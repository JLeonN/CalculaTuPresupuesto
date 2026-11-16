import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverAccesoSuscripcion } from '../src/dominio/suscripcion';
import { evaluarReferenciaSinConexion, MARGEN_SIN_CONEXION_MS } from '../src/servicios/suscripcion/referenciaTiempo';
import { correspondeACuenta, obtenerIdentificadorCuenta } from '../functions/src/identidadCompra';
import { interpretarCompraPlay } from '../functions/src/googlePlay';

test('el acceso distingue prueba vigente, vencida, exención y verificación pendiente', () => {
  assert.deepEqual(resolverAccesoSuscripcion({ tipo: 'pendiente' }, 10), {
    puedeGenerarSalida: false, mostrarMarca: true, mostrarPublicidad: false,
  });
  assert.equal(resolverAccesoSuscripcion({ tipo: 'prueba', vencimiento: 100 }, 99).puedeGenerarSalida, true);
  assert.equal(resolverAccesoSuscripcion({ tipo: 'prueba', vencimiento: 100 }, 100).puedeGenerarSalida, false);
  assert.equal(resolverAccesoSuscripcion({ tipo: 'pro', vencimiento: 100 }, NaN).puedeGenerarSalida, false);
  assert.equal(resolverAccesoSuscripcion({ tipo: 'exento' }, 100).mostrarPublicidad, false);
});

test('el margen Android no sobrevive a reinicios ni se comparte entre cuentas o proyectos', () => {
  const referencia = {
    uid: 'a', proyectoFirebase: 'pruebas', horaServidor: 1000, vencimiento: 2000,
    reloj: { arranques: 3, milisegundosTranscurridos: 100 },
  };
  const reloj = (tiempo: number, arranques = 3) => ({ arranques, milisegundosTranscurridos: tiempo });
  assert.equal(evaluarReferenciaSinConexion(referencia, 'a', 'pruebas', reloj(1100))?.dentroDelMargen, true);
  assert.equal(evaluarReferenciaSinConexion(referencia, 'a', 'pruebas', reloj(1100 + MARGEN_SIN_CONEXION_MS))?.dentroDelMargen, false);
  assert.equal(evaluarReferenciaSinConexion(referencia, 'a', 'pruebas', reloj(1100, 4)), null);
  assert.equal(evaluarReferenciaSinConexion(referencia, 'a', 'pruebas', reloj(99)), null);
  assert.equal(evaluarReferenciaSinConexion(referencia, 'b', 'pruebas', reloj(1100)), null);
  assert.equal(evaluarReferenciaSinConexion(referencia, 'a', 'produccion', reloj(1100)), null);
});

test('la identidad de Play está vinculada a cuenta y entorno', () => {
  const identificador = obtenerIdentificadorCuenta('a', 'pruebas');
  const compra = { externalAccountIdentifiers: { obfuscatedExternalAccountId: identificador } };
  assert.equal(correspondeACuenta(compra, 'a', 'pruebas'), true);
  assert.equal(correspondeACuenta(compra, 'b', 'pruebas'), false);
  assert.equal(correspondeACuenta(compra, 'a', 'produccion'), false);
  assert.equal(correspondeACuenta({}, 'a', 'pruebas'), false);
});

test('Play solo concede vigencia al producto y estado autorizados', () => {
  const compra = { subscriptionState: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', lineItems: [{ productId: 'pro', expiryTime: '2030-01-01T00:00:00Z' }] };
  assert.equal(interpretarCompraPlay(compra, 'pro', 0).vigente, true);
  assert.equal(interpretarCompraPlay(compra, 'otro', 0).vigente, false);
  assert.equal(interpretarCompraPlay({ ...compra, subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD' }, 'pro', 0).vigente, false);
  assert.equal(interpretarCompraPlay({ ...compra, subscriptionState: 'SUBSCRIPTION_STATE_PENDING' }, 'pro', 0).vigente, false);
  assert.equal(interpretarCompraPlay({ ...compra, testPurchase: {} }, 'pro', 0).esPrueba, true);
});
