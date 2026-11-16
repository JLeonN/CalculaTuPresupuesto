import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { asociarCompraVerificada } from '../functions/src/asociacionCompra';
import { iniciarPruebaUnica } from '../functions/src/pruebaSuscripcion';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Esta prueba requiere el emulador.');
const requerir = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = requerir('firebase-admin/app') as typeof import('firebase-admin/app');
const { getFirestore, Timestamp } = requerir('firebase-admin/firestore') as typeof import('firebase-admin/firestore');
const app = initializeApp({ projectId: 'demo-calcula-pruebas' }, 'asociacion-sintetica');
const base = getFirestore(app);
after(async () => { await deleteApp(app); });

test('la asociación concurrente reserva el token para una sola cuenta', async () => {
  const token = `sintetico-${Date.now()}-${Math.random()}`;
  const resultados = await Promise.allSettled([
    asociarCompraVerificada(base, 'cuenta-a', token),
    asociarCompraVerificada(base, 'cuenta-b', token),
  ]);
  assert.equal(resultados.filter((resultado) => resultado.status === 'fulfilled').length, 1);
  assert.equal(resultados.filter((resultado) => resultado.status === 'rejected').length, 1);
});

test('una cadena enlazada exige el mismo dueño y admite reintentos', async () => {
  const token = `anterior-${Date.now()}-${Math.random()}`;
  const siguiente = `${token}-siguiente`;
  await asociarCompraVerificada(base, 'cuenta-a', token);
  await assert.rejects(asociarCompraVerificada(base, 'cuenta-b', siguiente, token));
  await asociarCompraVerificada(base, 'cuenta-a', siguiente, token);
  await asociarCompraVerificada(base, 'cuenta-a', siguiente, token);
  await assert.rejects(asociarCompraVerificada(base, 'cuenta-a', `${token}-otro`, 'desconocido'));
});

test('la prueba es única, incluso con entradas simultáneas', async () => {
  const dia = 24 * 60 * 60 * 1000;
  const ahora = Date.now();
  const uid = `cuenta-antigua-${ahora}`;
  await base.doc('configuracionSuscripcion/activacion').set({ fecha: Timestamp.fromMillis(ahora - 30 * dia) });
  const resultados = await Promise.all([
    iniciarPruebaUnica(base, uid, ahora - 40 * dia),
    iniciarPruebaUnica(base, uid, ahora - 40 * dia),
  ]);
  assert.equal(resultados[0]!.inicioPrueba, resultados[1]!.inicioPrueba);
  assert.equal(resultados[0]!.vencimiento - resultados[0]!.inicioPrueba, 10 * dia);
  assert.equal((await iniciarPruebaUnica(base, uid, ahora - 40 * dia)).inicioPrueba, resultados[0]!.inicioPrueba);
});

test('una verificación de correo demorada no prolonga la prueba', async () => {
  const dia = 24 * 60 * 60 * 1000;
  const ahora = Date.now();
  const registro = ahora - 20 * dia;
  await base.doc('configuracionSuscripcion/activacion').set({ fecha: Timestamp.fromMillis(ahora - 30 * dia) });
  const resultado = await iniciarPruebaUnica(base, `cuenta-nueva-${ahora}`, registro);
  assert.equal(resultado.inicioPrueba, registro);
  assert.equal(resultado.tipo, 'gratis');
});
