import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createPinia, setActivePinia } from 'pinia';

const MODULOS = {
  '@/configuracion/firebase': '\0firebase-simulado',
  '@/configuracion/configuracionSuscripcion': '\0suscripcion-habilitada-simulada',
  '@/servicios/suscripcion/servicioSuscripcion': '\0servicio-suscripcion-simulado',
};
let servidor;
let useAutenticacionStore;
let useSuscripcionStore;
let servicio;

before(async () => {
  servidor = await createServer({
    configFile: false,
    envFile: false,
    optimizeDeps: { noDiscovery: true },
    plugins: [
      {
        name: 'servicios-aislados-para-permisos',
        enforce: 'pre',
        resolveId(id) {
          return Object.values(MODULOS).includes(id) ? id : null;
        },
        load(id) {
          if (id === MODULOS['@/configuracion/firebase']) {
            return `export const estaFirebaseConfigurado = () => false;
            export const obtenerFirebase = () => ({ aplicacion: { options: { projectId: 'proyecto-sintetico' } } });`;
          }
          if (id === MODULOS['@/configuracion/configuracionSuscripcion']) {
            return 'export const SUSCRIPCION_HABILITADA = true;';
          }
          if (id === MODULOS['@/servicios/suscripcion/servicioSuscripcion']) {
            return `export const respuesta = { estado: { tipo: 'pendiente' }, horaServidor: 0, mostrarAvisoPrueba: false };
              export const control = { fallar: false, espera: null };
            export const consultarEstadoSuscripcion = async () => {
                const capturada = { ...respuesta };
                if (control.espera) await control.espera;
              if (control.fallar) throw new Error('Sin conexión simulada');
                return capturada;
            };
            export const confirmarAvisoPrueba = async () => {};
            export const reconciliarSuscripcion = async () => 'limitada';
            export const observarEstadoSuscripcion = () => () => {};`;
          }
          return null;
        },
      },
    ],
    resolve: {
      alias: [
        ...Object.entries(MODULOS).map(([find, replacement]) => ({ find, replacement })),
        { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
      ],
    },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
  });
  ({ useAutenticacionStore } = await servidor.ssrLoadModule('/src/stores/autenticacion.ts'));
  ({ useSuscripcionStore } = await servidor.ssrLoadModule('/src/stores/suscripcion.ts'));
  servicio = await servidor.ssrLoadModule('@/servicios/suscripcion/servicioSuscripcion');
});

test('una respuesta atrasada no concede el acceso de otra cuenta', async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const suscripcion = useSuscripcionStore(pinia);
  const ahora = Date.now();
  let resolver;
  servicio.control.fallar = false;
  servicio.control.espera = new Promise((resolve) => {
    resolver = resolve;
  });
  servicio.respuesta.estado = { tipo: 'pro', vencimiento: ahora + 60000 };
  servicio.respuesta.horaServidor = ahora;
  try {
    const cargaAnterior = suscripcion.cargar('cuenta-a');
    servicio.control.espera = null;
    servicio.respuesta.estado = { tipo: 'gratis' };
    await suscripcion.cargar('cuenta-b');
    resolver();
    await cargaAnterior;
    assert.equal(suscripcion.uid, 'cuenta-b');
    assert.equal(suscripcion.estado.tipo, 'gratis');
    assert.equal(suscripcion.acceso.puedeGenerarSalida, false);
  } finally {
    servicio.control.espera = null;
    suscripcion.limpiar();
  }
});

test('la web conserva el estado confirmado sin conexión solo para la misma cuenta', async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const suscripcion = useSuscripcionStore(pinia);
  const ahora = Date.now();
  servicio.respuesta.estado = { tipo: 'pro', vencimiento: ahora + 60000 };
  servicio.respuesta.horaServidor = ahora;
  servicio.control.fallar = false;
  try {
    await suscripcion.cargar('cuenta-a');
    assert.equal(suscripcion.acceso.puedeGenerarSalida, true);
    servicio.control.fallar = true;
    await suscripcion.cargar('cuenta-a');
    assert.equal(suscripcion.estado.tipo, 'pro');
    assert.equal(suscripcion.acceso.puedeGenerarSalida, true);
    assert.match(suscripcion.error, /No se pudo verificar/);
    await suscripcion.cargar('cuenta-b');
    assert.equal(suscripcion.estado.tipo, 'pendiente');
    assert.equal(suscripcion.acceso.puedeGenerarSalida, false);
  } finally {
    servicio.control.fallar = false;
    suscripcion.limpiar();
  }
});

after(async () => {
  await servidor?.close();
});

test('los permisos de la sesión siguen el estado de suscripción confirmado', async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const autenticacion = useAutenticacionStore(pinia);
  const suscripcion = useSuscripcionStore(pinia);
  autenticacion.usuario = {
    id: 'cuenta-sintetica',
    nombre: 'Prueba',
    correo: null,
    correoVerificado: true,
    proveedores: [],
    proveedor: 'firebase',
  };
  autenticacion.inicializada = true;
  const ahora = Date.now();
  const casos = [
    [{ tipo: 'gratis' }, false, true, true],
    [{ tipo: 'prueba', vencimiento: ahora + 60000 }, true, false, false],
    [{ tipo: 'prueba', vencimiento: ahora - 1 }, false, true, true],
    [{ tipo: 'pro', vencimiento: ahora + 60000 }, true, false, false],
    [{ tipo: 'pro', vencimiento: ahora - 1 }, false, true, true],
    [{ tipo: 'exento' }, true, false, false],
    [{ tipo: 'pendiente' }, false, true, false],
  ];
  try {
    for (const [estado, salida, marca, publicidad] of casos) {
      servicio.respuesta.estado = estado;
      servicio.respuesta.horaServidor = ahora;
      await suscripcion.cargar('cuenta-sintetica');
      assert.equal(autenticacion.puedeGenerarSalidaPresupuesto, salida, estado.tipo);
      assert.equal(autenticacion.mostrarMarcaPresupuesto, marca, estado.tipo);
      assert.equal(autenticacion.mostrarPublicidad, publicidad, estado.tipo);
    }
    autenticacion.usuario = null;
    assert.equal(autenticacion.puedeGenerarSalidaPresupuesto, false);
    assert.equal(autenticacion.mostrarMarcaPresupuesto, true);
  } finally {
    suscripcion.limpiar();
  }
});
