import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

let servidor;
let servicio;
let simulacion;

before(async () => {
  const moduloSimulado = '\0compra-android-simulada';
  servidor = await createServer({
    configFile: false,
    envFile: false,
    resolve: {
      alias: [
        { find: '@/configuracion/firebase', replacement: moduloSimulado },
        { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
      ],
    },
    server: { middlewareMode: true, hmr: false, ws: false },
    ssr: { noExternal: ['@capacitor/core', '@capgo/native-purchases', 'firebase'] },
    appType: 'custom',
    logLevel: 'error',
    plugins: [
      {
        name: 'compras-aisladas-para-prueba',
        enforce: 'pre',
        resolveId(id) {
        if (id === moduloSimulado) return moduloSimulado;
          return [
            '@capacitor/core',
            '@capgo/native-purchases',
            'firebase/functions',
            '@/configuracion/firebase',
            'compra-android-simulada',
          ].includes(id)
            ? moduloSimulado
            : null;
        },
        load(id) {
          if (id !== moduloSimulado) return null;
          return `
          export const configuracion = { compras: [], respuesta: { actualizada: false, pendiente: true }, tokens: [] };
          export const Capacitor = { getPlatform: () => 'android' };
          export const PURCHASE_TYPE = { SUBS: 'subs' };
          export const NativePurchases = {
            purchaseProduct: async () => { throw new Error('Purchase is pending'); },
            getPurchases: async () => ({ purchases: configuracion.compras }),
          };
          export const obtenerFirebase = () => ({
            aplicacion: { options: { projectId: 'proyecto-sintetico' } },
            autenticacion: { currentUser: { uid: 'cuenta-sintetica', emailVerified: true } },
          });
          export const getFunctions = () => ({});
          export const httpsCallable = () => async ({ token }) => {
            configuracion.tokens.push(token);
            return { data: configuracion.respuesta };
          };
        `;
        },
      },
    ],
  });
  servicio = await servidor.ssrLoadModule('/src/servicios/suscripcion/servicioComprasAndroid.ts');
  simulacion = await servidor.ssrLoadModule('compra-android-simulada');
});

after(async () => {
  await servidor?.close();
});

test('una compra pendiente del plugin se recupera y se registra sin presentarla como confirmada', async () => {
  simulacion.configuracion.compras = [
    { productIdentifier: 'pro', purchaseState: '2', purchaseToken: 'token-sintetico' },
  ];
  simulacion.configuracion.tokens = [];
  const resultado = await servicio.comprarSuscripcionAndroid('cuenta-sintetica', {
    producto: 'pro',
    plan: 'mensual',
    precio: 'precio de prueba',
    oferta: 'oferta-sintetica',
  });
  assert.equal(resultado, 'pendiente');
  assert.deepEqual(simulacion.configuracion.tokens, ['token-sintetico']);
  simulacion.configuracion.compras = [];
  await assert.rejects(
    servicio.comprarSuscripcionAndroid('cuenta-sintetica', {
      producto: 'pro',
      plan: 'mensual',
      precio: 'precio de prueba',
      oferta: 'oferta-sintetica',
    }),
  );
});
