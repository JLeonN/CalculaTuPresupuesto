import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createPinia } from 'pinia';

test('una escritura Android atrasada no reemplaza la referencia de otra cuenta', async () => {
  const modulos = {
    '@capacitor/core': `export const Capacitor = { getPlatform: () => 'android' };
      export const registerPlugin = () => ({ obtenerReferencia: async () => ({ arranques: 1, milisegundosTranscurridos: 100 }) });`,
    '@/configuracion/firebase': `export const obtenerFirebase = () => ({ aplicacion: { options: { projectId: 'pruebas' } } });`,
    '@/servicios/suscripcion/relojAndroid': `export const obtenerReferenciaRelojAndroid = async () => ({ arranques: 1, milisegundosTranscurridos: 100 });`,
    '@/servicios/suscripcion/servicioSuscripcion': `
      export const consultarEstadoSuscripcion = async () => ({ estado: { tipo: 'gratis' }, horaServidor: 1000, mostrarAvisoPrueba: false });
      export const reconciliarSuscripcion = async () => 'limitada';
      export const confirmarAvisoPrueba = async () => {};`,
    '@/servicios/suscripcion/referenciaPersistente': `
      export const control = { valor: null, inicio: null, liberar: null };
      export const guardarReferenciaSuscripcion = async (referencia) => {
        if (referencia.uid === 'a') {
          await new Promise((resolve) => { control.liberar = resolve; control.inicio(); });
        }
        control.valor = referencia;
      };
      export const eliminarReferenciaSuscripcion = async () => { control.valor = null; };
      export const leerReferenciaSuscripcion = async (uid, proyecto) =>
        control.valor?.uid === uid && control.valor?.proyectoFirebase === proyecto ? control.valor : null;`,
  };
  const alias = Object.fromEntries(Object.keys(modulos).map((nombre) => [nombre, `\0${nombre}`]));
  const servidor = await createServer({
    configFile: false,
    envFile: false,
    optimizeDeps: { noDiscovery: true },
    plugins: [
      {
        name: 'android-aislado',
        resolveId(id) {
          return Object.values(alias).includes(id) ? id : null;
        },
        load(id) {
          const nombre = Object.keys(alias).find((clave) => alias[clave] === id);
          return nombre ? modulos[nombre] : null;
        },
      },
    ],
    resolve: {
      alias: [
        ...Object.entries(alias).map(([find, replacement]) => ({ find, replacement })),
        { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
      ],
    },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
  });
  let suscripcion;
  try {
    const { useSuscripcionStore } = await servidor.ssrLoadModule('/src/stores/suscripcion.ts');
    const { control } = await servidor.ssrLoadModule(
      '@/servicios/suscripcion/referenciaPersistente',
    );
    suscripcion = useSuscripcionStore(createPinia());
    const inicio = new Promise((resolve) => {
      control.inicio = resolve;
    });
    const primera = suscripcion.cargar('a');
    await inicio;
    const segunda = suscripcion.cargar('b');
    // La segunda carga debe llegar a la escritura antes de liberar la primera.
    await new Promise((resolve) => setTimeout(resolve, 100));
    control.liberar();
    await Promise.all([primera, segunda]);
    assert.equal(suscripcion.uid, 'b');
    assert.equal(control.valor.uid, 'b');
  } finally {
    suscripcion?.limpiar();
    await servidor.close();
  }
});
