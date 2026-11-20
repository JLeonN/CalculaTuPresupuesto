import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('una referencia Pro no verificable pide conexión y Gratis ofrece suscribirse', async () => {
  const modulos = {
    quasar: `export const avisos = []; export const useQuasar = () => ({ notify: aviso => avisos.push(aviso) });`,
    'vue-router': `export const useRouter = () => ({ push: async () => {} });`,
    '@/stores/autenticacion': `export const cuenta = { estaAutenticado: true, solicitarInicioSesion: () => {} }; export const useAutenticacionStore = () => cuenta;`,
    '@/stores/suscripcion': `export const suscripcion = { estado: { tipo: 'pro' }, acceso: { puedeGenerarSalida: false }, error: 'Referencia no verificable' }; export const useSuscripcionStore = () => suscripcion;`,
  };
  const alias = Object.fromEntries(Object.keys(modulos).map((nombre) => [nombre, `\0${nombre}`]));
  const servidor = await createServer({
    configFile: false,
    envFile: false,
    optimizeDeps: { noDiscovery: true },
    plugins: [
      {
        name: 'aislar-aviso-suscripcion',
        resolveId: (id) => (Object.values(alias).includes(id) ? id : null),
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
  try {
    const { useAccesoSalida } = await servidor.ssrLoadModule('/src/composables/useAccesoSalida.ts');
    const { avisos } = await servidor.ssrLoadModule('quasar');
    const { suscripcion } = await servidor.ssrLoadModule('@/stores/suscripcion');
    const acceso = useAccesoSalida();
    acceso.solicitarAccesoSalida();
    assert.match(avisos.at(-1).message, /Conectate para verificar/);
    suscripcion.estado.tipo = 'gratis';
    suscripcion.error = null;
    acceso.solicitarAccesoSalida();
    assert.match(avisos.at(-1).message, /necesitás Pro/);
    assert.equal(avisos.at(-1).actions[0].label, 'Ver suscripción');
  } finally {
    await servidor.close();
  }
});
