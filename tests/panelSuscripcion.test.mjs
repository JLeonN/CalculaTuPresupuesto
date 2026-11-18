import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createPinia, setActivePinia } from 'pinia';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from '@vue/server-renderer';

let servidor;
let PanelSuscripcion;
let useAutenticacionStore;
let useSuscripcionStore;
let configuracionFirebase;

before(async () => {
  servidor = await createServer({
    configFile: false,
    envFile: false,
    optimizeDeps: { noDiscovery: true },
    plugins: [
      {
        name: 'firebase-aislado-para-prueba',
        enforce: 'pre',
        resolveId(id) {
          if (id === '\0firebase-aislado-para-prueba') return id;
          return id === '@/configuracion/firebase' ? '\0firebase-aislado-para-prueba' : null;
        },
        load(id) {
          if (id !== '\0firebase-aislado-para-prueba') return null;
          return "export const estaFirebaseConfigurado = () => false; export const obtenerFirebase = () => { throw new Error('Firebase deshabilitado durante esta prueba'); };";
        },
      },
      vue(),
    ],
    resolve: {
      alias: [
        { find: '@/configuracion/firebase', replacement: '\0firebase-aislado-para-prueba' },
        { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
      ],
    },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
  });
  ({ default: PanelSuscripcion } = await servidor.ssrLoadModule(
    '/src/components/suscripcion/PanelSuscripcion.vue',
  ));
  ({ useAutenticacionStore } = await servidor.ssrLoadModule('/src/stores/autenticacion.ts'));
  ({ useSuscripcionStore } = await servidor.ssrLoadModule('/src/stores/suscripcion.ts'));
  configuracionFirebase = await servidor.ssrLoadModule('@/configuracion/firebase');
});

after(async () => {
  await servidor?.close();
});

async function renderizarPanel(estado, autenticado = true, error = null) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const autenticacion = useAutenticacionStore(pinia);
  const suscripcion = useSuscripcionStore(pinia);
  if (autenticado) {
    autenticacion.usuario = {
      id: 'cuenta-sintetica',
      nombre: 'Prueba',
      correo: null,
      correoVerificado: true,
      proveedores: [],
      proveedor: 'firebase',
    };
  }
  suscripcion.estado = estado;
  suscripcion.error = error;
  const app = createSSRApp(PanelSuscripcion);
  app.use(pinia);
  app.component(
    'q-btn',
    defineComponent({
      props: ['label'],
      setup(props) {
        return () => h('button', props.label);
      },
    }),
  );
  return renderToString(app);
}

test('el panel web explica los planes sin consultar servicios externos', async () => {
  assert.equal(configuracionFirebase.estaFirebaseConfigurado(), false);
  assert.throws(() => configuracionFirebase.obtenerFirebase());
  const gratis = await renderizarPanel({ tipo: 'gratis' });
  assert.match(gratis, /Plan Gratis/);
  assert.match(gratis, /Para contratar Pro, abrí la aplicación Android/);
  assert.doesNotMatch(gratis, /Suscribirme con Google Play/);
  const prueba = await renderizarPanel({ tipo: 'prueba', vencimiento: Date.UTC(2030, 0, 2) });
  assert.match(prueba, /Prueba Pro/);
  assert.match(prueba, /Tu prueba no requiere tarjeta/);
  const pro = await renderizarPanel({ tipo: 'pro', vencimiento: Date.UTC(2030, 0, 2) });
  assert.match(pro, /Plan Pro/);
  assert.match(pro, /Hasta el/);
  assert.match(pro, /gestionar tu suscripción desde Google Play/);
  assert.doesNotMatch(pro, /Para contratar Pro/);
  const exento = await renderizarPanel({ tipo: 'exento' });
  assert.match(exento, /<strong>Pro<\/strong>/);
  assert.doesNotMatch(exento, /Hasta el/);
  assert.doesNotMatch(exento, /Para contratar Pro/);
  const visitante = await renderizarPanel({ tipo: 'pendiente' }, false);
  assert.match(visitante, /Iniciá sesión para comenzar tu prueba Pro de 10 días/);
  const sinConexion = await renderizarPanel(
    { tipo: 'pendiente' },
    true,
    'No se pudo verificar la suscripción.',
  );
  assert.match(sinConexion, /No se pudo verificar la suscripción/);
  assert.match(sinConexion, /Reintentar/);
  assert.doesNotMatch(sinConexion, /Para contratar Pro/);
});
