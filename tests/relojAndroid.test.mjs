import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

let servidor;
let reloj;
let simulacion;

before(async () => {
  const moduloSimulado = '\0capacitor-reloj-simulado';
  servidor = await createServer({
    configFile: false,
    envFile: false,
    optimizeDeps: { noDiscovery: true },
    resolve: {
      alias: [
        { find: '@capacitor/core', replacement: moduloSimulado },
        { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
      ],
    },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
    plugins: [
      {
        name: 'reloj-nativo-simulado',
        resolveId(id) {
          return id === moduloSimulado ? id : null;
        },
        load(id) {
          if (id !== moduloSimulado) return null;
          return `
            export const control = { plataforma: 'android', referencia: null, llamadas: 0 };
            export const Capacitor = { getPlatform: () => control.plataforma };
            export const registerPlugin = () => ({ obtenerReferencia: async () => {
              control.llamadas += 1;
              return control.referencia;
            } });
          `;
        },
      },
    ],
  });
  reloj = await servidor.ssrLoadModule('/src/servicios/suscripcion/relojAndroid.ts');
  simulacion = await servidor.ssrLoadModule(moduloSimulado);
});

after(async () => {
  await servidor?.close();
});

test('el adaptador acepta una referencia Android y rechaza valores inválidos', async () => {
  const control = simulacion.control;
  control.plataforma = 'android';
  control.referencia = { arranques: 4, milisegundosTranscurridos: 1234 };
  assert.deepEqual(await reloj.obtenerReferenciaRelojAndroid(), control.referencia);
  for (const referencia of [
    { arranques: -1, milisegundosTranscurridos: 1234 },
    { arranques: 4, milisegundosTranscurridos: -1 },
    { arranques: 4.5, milisegundosTranscurridos: 1234 },
    { arranques: 4, milisegundosTranscurridos: Number.MAX_SAFE_INTEGER + 1 },
    { arranques: null, milisegundosTranscurridos: 1234 },
  ]) {
    control.referencia = referencia;
    await assert.rejects(
      reloj.obtenerReferenciaRelojAndroid(),
      /referencia del reloj no es válida/,
    );
  }
});

test('la web no solicita la referencia nativa', async () => {
  const control = simulacion.control;
  control.plataforma = 'web';
  control.llamadas = 0;
  await assert.rejects(reloj.obtenerReferenciaRelojAndroid(), /solo está disponible en Android/);
  assert.equal(control.llamadas, 0);
});
