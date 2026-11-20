import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';

const moduloFirebase = '\0firebase-aislado-para-prueba';
const moduloAislamiento = '\0panel-suscripcion-aislado';
const moduloSuscripcion = '\0suscripcion-habilitada-simulada';
const moduloServicio = '\0servicio-suscripcion-simulado';
const servidor = await createServer({
  configFile: false,
  envFile: false,
  plugins: [
    {
      name: 'firebase-aislado-para-prueba',
      enforce: 'pre',
      resolveId(id) {
        if (id === 'virtual:panel-suscripcion-aislado') return moduloAislamiento;
        return id === moduloFirebase ||
          id === moduloAislamiento ||
          id === moduloSuscripcion ||
          id === moduloServicio
          ? id
          : null;
      },
      load(id) {
        if (id === moduloAislamiento) return 'export const panelAislado = true;';
        if (id === moduloSuscripcion) return 'export const SUSCRIPCION_HABILITADA = true;';
        if (id === moduloServicio)
          return `
          export const consultarEstadoSuscripcion = async () => ({ estado: window.__estadoFicticio, horaServidor: Date.now(), mostrarAvisoPrueba: false });
          export const reconciliarSuscripcion = async () => 'limitada';
          export const confirmarAvisoPrueba = async () => {};
          export const observarEstadoSuscripcion = () => () => {};
          export const consultarConfiguracionCompra = async () => { throw new Error('Compras deshabilitadas'); };`;
        if (id !== moduloFirebase) return null;
        return "export const estaFirebaseConfigurado = () => false; export const obtenerFirebase = () => ({ aplicacion: { options: { projectId: 'proyecto-ficticio' } } });";
      },
    },
    vue(),
  ],
  resolve: {
    alias: [
      { find: '@/configuracion/firebase', replacement: moduloFirebase },
      { find: '@/configuracion/configuracionSuscripcion', replacement: moduloSuscripcion },
      { find: '@/servicios/suscripcion/servicioSuscripcion', replacement: moduloServicio },
      { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
    ],
  },
  server: { host: '127.0.0.1', port: 4179, strictPort: true, hmr: false, ws: false },
  logLevel: 'error',
});
await servidor.listen();
console.log(
  'Vista aislada disponible en http://127.0.0.1:4179/tests/fixtures/panel-suscripcion.html',
);
