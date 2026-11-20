import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';

const raiz = fileURLToPath(new URL('../src/', import.meta.url));
const salida = fileURLToPath(
  new URL('../src-capacitor/android/app/src/debug/assets/public/ch-interfaz/', import.meta.url),
);
const modulos = {
  '@/configuracion/firebase': `export const estaFirebaseConfigurado = () => false;
    export const obtenerFirebase = () => ({ aplicacion: { options: { projectId: 'proyecto-ficticio' } } });`,
  '@/configuracion/configuracionSuscripcion': `export const SUSCRIPCION_HABILITADA = true;`,
  '@/servicios/suscripcion/servicioSuscripcion': `
    export const consultarEstadoSuscripcion = async () => ({ estado: window.__estadoFicticio, horaServidor: Date.now(), mostrarAvisoPrueba: false });
    export const reconciliarSuscripcion = async () => 'limitada';
    export const confirmarAvisoPrueba = async () => {};
    export const observarEstadoSuscripcion = () => () => {};
    export const consultarConfiguracionCompra = async () => { throw new Error('Compras deshabilitadas'); };`,
  '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion': `
    const datos = new Map();
    export const crearAlmacenamientoAplicacion = () => ({
      obtener: async clave => datos.get(clave) ?? null,
      guardar: async (clave, valor) => { datos.set(clave, valor); },
      eliminar: async clave => { datos.delete(clave); }
    });`,
  '@/servicios/suscripcion/referenciaPersistente': `
    let referencia = null;
    export const guardarReferenciaSuscripcion = async valor => { referencia = valor; };
    export const eliminarReferenciaSuscripcion = async () => { referencia = null; };
    export const leerReferenciaSuscripcion = async (uid, proyecto) => referencia?.uid === uid && referencia?.proyectoFirebase === proyecto ? referencia : null;`,
  '@/composables/usePublicidad': `
    import { ref } from 'vue';
    const altoBanner = ref(0), mostrarOpcionesPrivacidad = ref(false);
    export const usePublicidad = () => ({ altoBanner, mostrarOpcionesPrivacidad,
      iniciarPublicidad: async () => { window.__publicidadFicticia = true; altoBanner.value = 50; },
      detenerPublicidad: async () => { window.__publicidadFicticia = false; altoBanner.value = 0; },
      abrirOpcionesPrivacidad: async () => {} });`,
  '@/components/ModalActualizacion.vue': `export default { render: () => null };`,
  '@/servicios/suscripcion/servicioComprasAndroid': `
    const bloquear = async () => { throw new Error('Compras deshabilitadas en la prueba'); };
    export const comprarSuscripcionAndroid = bloquear, consultarProductoAndroid = bloquear,
      gestionarSuscripcionAndroid = bloquear, recuperarComprasAndroid = bloquear;`,
};
const probarAdmob = process.argv.includes('--admob-prueba');
if (process.argv.slice(2).some((argumento) => argumento !== '--admob-prueba'))
  throw new Error('Opción de prueba desconocida.');
if (probarAdmob) {
  delete modulos['@/composables/usePublicidad'];
  modulos['@/configuracion/configuracionPublicidad'] = `
    export const ID_BANNER_ADMOB_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
    export const ID_BANNER_PRUEBA_ANDROID = ID_BANNER_ADMOB_ANDROID;
    export const obtenerConfiguracionSolicitudPublicidad = () => ({ adId: ID_BANNER_ADMOB_ANDROID, isTesting: true });`;
}
const alias = Object.fromEntries(Object.keys(modulos).map((nombre) => [nombre, `\0${nombre}`]));
await build({
  root: fileURLToPath(new URL('../tests/fixtures/', import.meta.url)),
  base: '/ch-interfaz/',
  configFile: false,
  envDir: false,
  publicDir: false,
  plugins: [
    {
      name: 'interfaz-android-aislada',
      resolveId: (id) =>
        Object.values(alias).includes(id)
          ? id
          : id === 'virtual:panel-suscripcion-aislado'
            ? '\0aislamiento'
            : null,
      load(id) {
        if (id === '\0aislamiento') return 'export const panelAislado = true;';
        const nombre = Object.keys(alias).find((clave) => alias[clave] === id);
        return nombre ? modulos[nombre] : null;
      },
      transform(codigo, id) {
        if (!probarAdmob || !id.replaceAll('\\', '/').endsWith('/src/composables/usePublicidad.ts'))
          return null;
        const condicion = 'consentimiento.status === AdmobConsentStatus.REQUIRED &&';
        if (!codigo.includes(condicion))
          throw new Error(
            'No se pudo desactivar el formulario de consentimiento para esta prueba.',
          );
        return codigo.replace(condicion, 'false &&');
      },
    },
    vue(),
  ],
  resolve: {
    alias: [
      ...Object.entries(alias).map(([find, replacement]) => ({ find, replacement })),
      { find: '@', replacement: raiz },
    ],
  },
  build: {
    outDir: salida,
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(
        new URL('../tests/fixtures/aplicacion-suscripcion.html', import.meta.url),
      ),
    },
  },
});
const prohibidos = [
  'calculatupresupuesto-prod',
  'calculatupresupuesto-pru-b2e9a',
  'referencia-suscripcion-v1',
  'ca-app-pub-7620083100302566/2220669269',
];
let unidadDePruebaEncontrada = false;
for (const archivo of await readdir(`${salida}/assets`)) {
  if (!archivo.endsWith('.js')) continue;
  const codigo = await readFile(`${salida}/assets/${archivo}`, 'utf8');
  if (codigo.includes('ca-app-pub-3940256099942544/6300978111')) unidadDePruebaEncontrada = true;
  if (prohibidos.some((valor) => codigo.includes(valor)))
    throw new Error('La interfaz de depuración contiene configuración real; no instalar la APK.');
}
if (probarAdmob && !unidadDePruebaEncontrada)
  throw new Error('No se encontró la unidad oficial de prueba; no instalar la APK.');
