import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverAccesoSuscripcion } from '../src/dominio/suscripcion';
import { interpretarResultadoCompra } from '../src/dominio/resultadoCompra';
import {
  evaluarReferenciaSinConexion,
  MARGEN_SIN_CONEXION_MS,
} from '../src/servicios/suscripcion/referenciaTiempo';
import { correspondeACuenta, obtenerIdentificadorCuenta } from '../functions/src/identidadCompra';
import { interpretarCompraPlay } from '../functions/src/googlePlay';
import { cifrarToken, descifrarToken } from '../functions/src/cifradoToken';
import { verificarCompraPlay } from '../functions/src/verificacionCompra';
import { interpretarNotificacionPlay } from '../functions/src/notificacionPlay';
import { interpretarReferenciaPersistida } from '../src/servicios/suscripcion/referenciaPersistente';
import { resolverAccesoAndroidSinConexion } from '../src/servicios/suscripcion/accesoSinConexion';
import {
  descargarDocumentoPresupuesto,
  enviarDocumentoPresupuesto,
  type OpcionesAccionDocumentoPresupuesto,
} from '../src/servicios/documentos/accionesPresupuesto';
import { ErrorSalidaPresupuestoRestringida } from '../src/dominio/autenticacion';

test('solo una respuesta confirmada presenta la compra como verificada', () => {
  assert.equal(interpretarResultadoCompra({ actualizada: true, pendiente: false }), 'verificada');
  assert.equal(interpretarResultadoCompra({ actualizada: false, pendiente: true }), 'pendiente');
  assert.throws(() => interpretarResultadoCompra({ actualizada: false, pendiente: false }));
  assert.throws(() => interpretarResultadoCompra({ actualizada: true, pendiente: true }));
  assert.throws(() => interpretarResultadoCompra(null));
});

test('las acciones de documento rechazan Gratis antes de preparar o enviar datos', async () => {
  let preparaciones = 0;
  const opciones: OpcionesAccionDocumentoPresupuesto = {
    datos: {} as OpcionesAccionDocumentoPresupuesto['datos'],
    configuracion: {} as OpcionesAccionDocumentoPresupuesto['configuracion'],
    obtenerElemento: () => {
      preparaciones += 1;
      return null;
    },
    permitirSalida: false,
    antesDeGenerar: async () => {
      preparaciones += 1;
    },
  };
  await assert.rejects(descargarDocumentoPresupuesto(opciones), ErrorSalidaPresupuestoRestringida);
  await assert.rejects(enviarDocumentoPresupuesto(opciones), ErrorSalidaPresupuestoRestringida);
  assert.equal(preparaciones, 0);
});

test('el acceso distingue prueba vigente, vencida, exención y verificación pendiente', () => {
  const accesoGratis = {
    puedeGenerarSalida: false,
    mostrarMarca: true,
    mostrarPublicidad: true,
  };
  const accesoPro = {
    puedeGenerarSalida: true,
    mostrarMarca: false,
    mostrarPublicidad: false,
  };
  assert.deepEqual(resolverAccesoSuscripcion({ tipo: 'gratis' }, 10), accesoGratis);
  assert.deepEqual(resolverAccesoSuscripcion({ tipo: 'prueba', vencimiento: 100 }, 99), accesoPro);
  assert.deepEqual(
    resolverAccesoSuscripcion({ tipo: 'prueba', vencimiento: 100 }, 100),
    accesoGratis,
  );
  assert.deepEqual(resolverAccesoSuscripcion({ tipo: 'pro', vencimiento: 100 }, 99), accesoPro);
  assert.deepEqual(resolverAccesoSuscripcion({ tipo: 'pro', vencimiento: 100 }, 100), accesoGratis);
  assert.deepEqual(resolverAccesoSuscripcion({ tipo: 'exento' }, 10), accesoPro);
  assert.deepEqual(resolverAccesoSuscripcion({ tipo: 'pendiente' }, 10), {
    puedeGenerarSalida: false,
    mostrarMarca: true,
    mostrarPublicidad: false,
  });
  assert.equal(
    resolverAccesoSuscripcion({ tipo: 'prueba', vencimiento: 100 }, 99).puedeGenerarSalida,
    true,
  );
  assert.equal(
    resolverAccesoSuscripcion({ tipo: 'prueba', vencimiento: 100 }, 100).puedeGenerarSalida,
    false,
  );
  assert.equal(
    resolverAccesoSuscripcion({ tipo: 'pro', vencimiento: 100 }, NaN).puedeGenerarSalida,
    false,
  );
  assert.equal(resolverAccesoSuscripcion({ tipo: 'exento' }, 100).mostrarPublicidad, false);
});

test('el margen Android no sobrevive a reinicios ni se comparte entre cuentas o proyectos', () => {
  const referencia = {
    uid: 'a',
    proyectoFirebase: 'pruebas',
    horaServidor: 1000,
    vencimiento: 2000,
    reloj: { arranques: 3, milisegundosTranscurridos: 100 },
  };
  const reloj = (tiempo: number, arranques = 3) => ({
    arranques,
    milisegundosTranscurridos: tiempo,
  });
  assert.equal(
    evaluarReferenciaSinConexion(referencia, 'a', 'pruebas', reloj(1100))?.dentroDelMargen,
    true,
  );
  assert.equal(
    evaluarReferenciaSinConexion(referencia, 'a', 'pruebas', reloj(1100 + MARGEN_SIN_CONEXION_MS))
      ?.dentroDelMargen,
    false,
  );
  assert.equal(evaluarReferenciaSinConexion(referencia, 'a', 'pruebas', reloj(1100, 4)), null);
  assert.equal(evaluarReferenciaSinConexion(referencia, 'a', 'pruebas', reloj(99)), null);
  assert.equal(evaluarReferenciaSinConexion(referencia, 'b', 'pruebas', reloj(1100)), null);
  assert.equal(evaluarReferenciaSinConexion(referencia, 'a', 'produccion', reloj(1100)), null);
});

test('cambiar la hora del dispositivo no prolonga el acceso sin conexión', () => {
  const referencia = {
    uid: 'a',
    proyectoFirebase: 'pruebas',
    horaServidor: 1000,
    vencimiento: 2000,
    reloj: { arranques: 3, milisegundosTranscurridos: 100 },
  };
  const reloj = { arranques: 3, milisegundosTranscurridos: 1100 + MARGEN_SIN_CONEXION_MS };
  const horaOriginal = Date.now;
  try {
    for (const horaEditable of [0, 1000, 9999999999999]) {
      Date.now = () => horaEditable;
      const resultado = resolverAccesoAndroidSinConexion(
        'pro',
        referencia,
        'a',
        'pruebas',
        reloj,
        true,
      );
      assert.equal(resultado.acceso.puedeGenerarSalida, false);
      assert.equal(resultado.necesitaConexion, true);
    }
  } finally {
    Date.now = horaOriginal;
  }
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
  const compra = {
    subscriptionState: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    lineItems: [{ productId: 'pro', expiryTime: '2030-01-01T00:00:00Z' }],
  };
  assert.equal(interpretarCompraPlay(compra, 'pro', 0).vigente, true);
  assert.equal(interpretarCompraPlay(compra, 'otro', 0).vigente, false);
  assert.equal(
    interpretarCompraPlay({ ...compra, subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD' }, 'pro', 0)
      .vigente,
    false,
  );
  assert.equal(
    interpretarCompraPlay({ ...compra, subscriptionState: 'SUBSCRIPTION_STATE_PENDING' }, 'pro', 0)
      .vigente,
    false,
  );
  assert.equal(interpretarCompraPlay({ ...compra, testPurchase: {} }, 'pro', 0).esPrueba, true);
});

test('el token cifrado queda asociado al proyecto y a su documento', () => {
  const clave = Buffer.alloc(32, 4).toString('base64');
  const identificador = 'a'.repeat(64);
  const cifrado = cifrarToken('token-sintetico', clave, 'pruebas', identificador);
  assert.equal(descifrarToken(cifrado, clave, 'pruebas', identificador), 'token-sintetico');
  assert.notEqual(cifrado.contenido, 'token-sintetico');
  assert.throws(() => descifrarToken(cifrado, clave, 'produccion', identificador));
  assert.throws(() => descifrarToken(cifrado, clave, 'pruebas', 'b'.repeat(64)));
  assert.throws(() =>
    descifrarToken(
      { ...cifrado, autenticacion: Buffer.alloc(16).toString('base64') },
      clave,
      'pruebas',
      identificador,
    ),
  );
  assert.throws(() => cifrarToken('token', 'clave-invalida', 'pruebas', identificador));
});

test('la compra debe coincidir con producto, cuenta y entorno antes de conceder acceso', () => {
  const proyecto = 'calculatupresupuesto-pru-b2e9a';
  const uid = 'cuenta-sintetica';
  const compra = {
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
    externalAccountIdentifiers: {
      obfuscatedExternalAccountId: obtenerIdentificadorCuenta(uid, proyecto),
    },
    lineItems: [{ productId: 'pro', expiryTime: '2030-01-01T00:00:00Z' }],
    testPurchase: {},
  };
  const resultado = verificarCompraPlay(compra, uid, proyecto, 'pro', 0);
  assert.equal(resultado.vigente, true);
  assert.equal(resultado.renovacionEsperada, true);
  assert.equal(
    verificarCompraPlay(
      { ...compra, subscriptionState: 'SUBSCRIPTION_STATE_CANCELED' },
      uid,
      proyecto,
      'pro',
      0,
    ).renovacionEsperada,
    false,
  );
  assert.equal(resultado.requiereConfirmacion, true);
  assert.throws(() => verificarCompraPlay(compra, 'otra', proyecto, 'pro', 0));
  assert.throws(() => verificarCompraPlay(compra, uid, proyecto, 'otro', 0));
  const { testPurchase: _prueba, ...sinPrueba } = compra;
  assert.throws(() => verificarCompraPlay(sinPrueba, uid, proyecto, 'pro', 0));
  assert.throws(() => verificarCompraPlay(compra, uid, 'proyecto-desconocido', 'pro', 0));
  assert.throws(() =>
    verificarCompraPlay({ ...compra, lineItems: [{ productId: 'pro' }] }, uid, proyecto, 'pro', 0),
  );
  const { acknowledgementState: _confirmacion, ...sinConfirmacion } = compra;
  assert.throws(() => verificarCompraPlay(sinConfirmacion, uid, proyecto, 'pro', 0));
  assert.equal(
    verificarCompraPlay(
      { ...compra, subscriptionState: 'SUBSCRIPTION_STATE_PENDING' },
      uid,
      proyecto,
      'pro',
      0,
    ).vigente,
    false,
  );
});

test('las notificaciones identifican la compra sin conceder permisos', () => {
  const paquete = 'com.calculatupresupuesto.app';
  assert.deepEqual(interpretarNotificacionPlay({ packageName: paquete, testNotification: {} }), {
    tipo: 'prueba',
  });
  assert.deepEqual(
    interpretarNotificacionPlay({
      packageName: paquete,
      subscriptionNotification: { purchaseToken: 'sintetico' },
    }),
    { tipo: 'suscripcion', token: 'sintetico' },
  );
  assert.deepEqual(
    interpretarNotificacionPlay({
      packageName: paquete,
      voidedPurchaseNotification: {
        productType: 1,
        purchaseToken: 'sintetico',
        orderId: 'orden',
        refundType: 1,
      },
    }),
    { tipo: 'reembolso', token: 'sintetico', orden: 'orden' },
  );
  assert.deepEqual(
    interpretarNotificacionPlay({
      packageName: paquete,
      voidedPurchaseNotification: { productType: 2 },
    }),
    { tipo: 'ignorado' },
  );
  assert.throws(() =>
    interpretarNotificacionPlay({
      packageName: 'otro',
      subscriptionNotification: { purchaseToken: 'sintetico' },
    }),
  );
  assert.throws(() =>
    interpretarNotificacionPlay({ packageName: paquete, subscriptionNotification: {} }),
  );
  assert.throws(() =>
    interpretarNotificacionPlay({
      packageName: paquete,
      subscriptionNotification: {},
      testNotification: {},
    }),
  );
});

test('la referencia persistida rechaza datos corruptos o incompletos', () => {
  const referencia = {
    uid: 'a',
    tipo: 'pro',
    proyectoFirebase: 'pruebas',
    horaServidor: 1000,
    vencimiento: 2000,
    reloj: { arranques: 3, milisegundosTranscurridos: 100 },
  };
  assert.deepEqual(interpretarReferenciaPersistida(JSON.stringify(referencia)), referencia);
  assert.deepEqual(
    interpretarReferenciaPersistida(JSON.stringify({ ...referencia, permiteMargen: true })),
    { ...referencia, permiteMargen: true },
  );
  assert.equal(
    interpretarReferenciaPersistida(JSON.stringify({ ...referencia, permiteMargen: 'sí' })),
    null,
  );
  assert.equal(interpretarReferenciaPersistida('{'), null);
  assert.equal(
    interpretarReferenciaPersistida(
      JSON.stringify({ ...referencia, reloj: { arranques: -1, milisegundosTranscurridos: 100 } }),
    ),
    null,
  );
  assert.equal(interpretarReferenciaPersistida(JSON.stringify({ ...referencia, uid: '' })), null);
});

test('el margen adicional corresponde a Pro pagado, no prolonga la prueba', () => {
  const referencia = {
    uid: 'a',
    proyectoFirebase: 'pruebas',
    horaServidor: 1000,
    vencimiento: 2000,
    reloj: { arranques: 3, milisegundosTranscurridos: 100 },
  };
  const reloj = { arranques: 3, milisegundosTranscurridos: 1100 };
  assert.equal(
    resolverAccesoAndroidSinConexion('prueba', referencia, 'a', 'pruebas', reloj).acceso
      .puedeGenerarSalida,
    false,
  );
  assert.equal(
    resolverAccesoAndroidSinConexion('pro', referencia, 'a', 'pruebas', reloj, true).acceso
      .puedeGenerarSalida,
    true,
  );
  assert.equal(
    resolverAccesoAndroidSinConexion('pro', referencia, 'a', 'pruebas', reloj, false).acceso
      .puedeGenerarSalida,
    false,
  );
  assert.equal(
    resolverAccesoAndroidSinConexion(
      'pro',
      referencia,
      'a',
      'pruebas',
      {
        ...reloj,
        milisegundosTranscurridos: reloj.milisegundosTranscurridos + MARGEN_SIN_CONEXION_MS - 1,
      },
      true,
    ).acceso.puedeGenerarSalida,
    true,
  );
  assert.equal(
    resolverAccesoAndroidSinConexion(
      'pro',
      referencia,
      'a',
      'pruebas',
      {
        ...reloj,
        milisegundosTranscurridos: reloj.milisegundosTranscurridos + MARGEN_SIN_CONEXION_MS,
      },
      true,
    ).acceso.puedeGenerarSalida,
    false,
  );
  assert.equal(
    resolverAccesoAndroidSinConexion('pro', referencia, 'a', 'pruebas', { ...reloj, arranques: 4 })
      .necesitaConexion,
    true,
  );
});
