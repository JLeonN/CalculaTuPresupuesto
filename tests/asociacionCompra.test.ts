import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { asociarCompraVerificada } from '../functions/src/asociacionCompra';
import { iniciarPruebaUnica } from '../functions/src/pruebaSuscripcion';
import { createHash } from 'node:crypto';
import { descifrarToken } from '../functions/src/cifradoToken';
import {
  aplicarRevisionCompra,
  reservarRevisionCompra,
} from '../functions/src/actualizacionCompra';
import { procesarCompra } from '../functions/src/procesarCompra';
import { obtenerIdentificadorCuenta } from '../functions/src/identidadCompra';
import { procesarNotificacionPlay } from '../functions/src/procesarNotificacion';
import { reconciliarCompraCuenta } from '../functions/src/reconciliarCompra';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Esta prueba requiere el emulador.');
const requerir = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = requerir('firebase-admin/app');
const { getFirestore, Timestamp } = requerir('firebase-admin/firestore');
const app = initializeApp({ projectId: 'demo-calcula-pruebas' }, 'asociacion-sintetica');
const base = getFirestore(app);
const configuracion = {
  proyecto: 'demo-calcula-pruebas',
  claveBase64: Buffer.alloc(32, 7).toString('base64'),
};
after(async () => {
  await deleteApp(app);
});

test('la asociación concurrente reserva el token para una sola cuenta', async () => {
  const token = `sintetico-${Date.now()}-${Math.random()}`;
  const resultados = await Promise.allSettled([
    asociarCompraVerificada(base, 'cuenta-a', token, configuracion),
    asociarCompraVerificada(base, 'cuenta-b', token, configuracion),
  ]);
  assert.equal(resultados.filter((resultado) => resultado.status === 'fulfilled').length, 1);
  assert.equal(resultados.filter((resultado) => resultado.status === 'rejected').length, 1);
  const id = createHash('sha256').update(token).digest('hex');
  const documento = await base.doc(`titularesCompras/${id}`).get();
  assert.equal(JSON.stringify(documento.data()).includes(token), false);
  assert.equal(
    descifrarToken(
      documento.get('tokenCifrado'),
      configuracion.claveBase64,
      configuracion.proyecto,
      id,
    ),
    token,
  );
});

test('una cadena enlazada exige el mismo dueño y admite reintentos', async () => {
  const token = `anterior-${Date.now()}-${Math.random()}`;
  const siguiente = `${token}-siguiente`;
  await asociarCompraVerificada(base, 'cuenta-a', token, configuracion);
  await assert.rejects(asociarCompraVerificada(base, 'cuenta-b', siguiente, configuracion, token));
  await asociarCompraVerificada(base, 'cuenta-a', siguiente, configuracion, token);
  await asociarCompraVerificada(base, 'cuenta-a', siguiente, configuracion, token);
  await assert.rejects(
    asociarCompraVerificada(base, 'cuenta-a', `${token}-otro`, configuracion, 'desconocido'),
  );
});

test('la prueba es única, incluso con entradas simultáneas', async () => {
  const dia = 24 * 60 * 60 * 1000;
  const ahora = Date.now();
  const uid = `cuenta-antigua-${ahora}`;
  await base
    .doc('configuracionSuscripcion/activacion')
    .set({ fecha: Timestamp.fromMillis(ahora - 30 * dia) });
  const resultados = await Promise.all([
    iniciarPruebaUnica(base, uid, ahora - 40 * dia),
    iniciarPruebaUnica(base, uid, ahora - 40 * dia),
  ]);
  assert.equal(resultados[0]!.inicioPrueba, resultados[1]!.inicioPrueba);
  assert.equal(resultados[0]!.mostrarAvisoPrueba, true);
  assert.equal(resultados[1]!.mostrarAvisoPrueba, true);
  assert.equal(resultados[0]!.vencimiento - resultados[0]!.inicioPrueba, 10 * dia);
  assert.equal(
    (await iniciarPruebaUnica(base, uid, ahora - 40 * dia)).inicioPrueba,
    resultados[0]!.inicioPrueba,
  );
});

test('una verificación de correo demorada no prolonga la prueba', async () => {
  const dia = 24 * 60 * 60 * 1000;
  const ahora = Date.now();
  const registro = ahora - 20 * dia;
  await base
    .doc('configuracionSuscripcion/activacion')
    .set({ fecha: Timestamp.fromMillis(ahora - 30 * dia) });
  const resultado = await iniciarPruebaUnica(base, `cuenta-nueva-${ahora}`, registro);
  assert.equal(resultado.inicioPrueba, registro);
  assert.equal(resultado.tipo, 'gratis');
  assert.equal(resultado.mostrarAvisoPrueba, false);
});

test('una respuesta vieja no sobrescribe una más reciente ni una compra pendiente', async () => {
  const token = `revision-${Date.now()}-${Math.random()}`;
  const uid = `titular-${Date.now()}`;
  const id = createHash('sha256').update(token).digest('hex');
  await asociarCompraVerificada(base, uid, token, configuracion);
  const antigua = await reservarRevisionCompra(base, id);
  const nueva = await reservarRevisionCompra(base, id);
  const vigente = {
    vigente: true,
    vencimiento: Date.now() + 86400000,
    pendiente: false,
    requiereConfirmacion: false,
  };
  assert.equal(await aplicarRevisionCompra(base, id, nueva, uid, vigente), true);
  assert.equal(
    await aplicarRevisionCompra(base, id, antigua, uid, { ...vigente, vigente: false }),
    false,
  );
  const estado = base.doc(`usuarios/${uid}/suscripcion/estado`);
  assert.equal((await estado.get()).get('tipo'), 'pro');
  const pendiente = await reservarRevisionCompra(base, id);
  assert.equal(
    await aplicarRevisionCompra(base, id, pendiente, uid, {
      ...vigente,
      vigente: false,
      pendiente: true,
    }),
    false,
  );
  assert.equal((await estado.get()).get('tipo'), 'pro');
  const suspension = await reservarRevisionCompra(base, id);
  assert.equal(
    await aplicarRevisionCompra(base, id, suspension, uid, { ...vigente, vigente: false }),
    true,
  );
  assert.equal((await estado.get()).get('tipo'), 'gratis');
});

test('una compra anterior no reemplaza la compra enlazada actual', async () => {
  const token = `enlace-${Date.now()}-${Math.random()}`;
  const uid = `titular-enlace-${Date.now()}`;
  const nuevo = `${token}-nuevo`;
  const idAnterior = createHash('sha256').update(token).digest('hex');
  const idNuevo = createHash('sha256').update(nuevo).digest('hex');
  await asociarCompraVerificada(base, uid, token, configuracion);
  await asociarCompraVerificada(base, uid, nuevo, configuracion, token);
  const compra = {
    vigente: true,
    vencimiento: Date.now() + 86400000,
    pendiente: false,
    requiereConfirmacion: false,
  };
  const revisionAnterior = await reservarRevisionCompra(base, idAnterior);
  assert.equal(await aplicarRevisionCompra(base, idAnterior, revisionAnterior, uid, compra), true);
  const revisionNueva = await reservarRevisionCompra(base, idNuevo);
  assert.equal(
    await aplicarRevisionCompra(base, idNuevo, revisionNueva, uid, {
      ...compra,
      tokenAnterior: token,
    }),
    true,
  );
  const avisoTardio = await reservarRevisionCompra(base, idAnterior);
  assert.equal(
    await aplicarRevisionCompra(base, idAnterior, avisoTardio, uid, { ...compra, vigente: false }),
    false,
  );
  assert.equal((await base.doc(`usuarios/${uid}/suscripcion/estado`).get()).get('tipo'), 'pro');
});

test('una recompra sin enlace sustituye solo una compra finalizada', async () => {
  const uid = `recompra-${Date.now()}-${Math.random()}`;
  const anterior = `anterior-${uid}`;
  const nuevo = `nuevo-${uid}`;
  const idAnterior = createHash('sha256').update(anterior).digest('hex');
  const idNuevo = createHash('sha256').update(nuevo).digest('hex');
  await asociarCompraVerificada(base, uid, anterior, configuracion);
  await asociarCompraVerificada(base, uid, nuevo, configuracion);
  const compra = {
    vigente: true,
    vencimiento: Date.now() + 86400000,
    pendiente: false,
    requiereConfirmacion: false,
    renovacionEsperada: true,
  };
  assert.equal(
    await aplicarRevisionCompra(
      base,
      idAnterior,
      await reservarRevisionCompra(base, idAnterior),
      uid,
      compra,
    ),
    true,
  );
  assert.equal(
    await aplicarRevisionCompra(
      base,
      idNuevo,
      await reservarRevisionCompra(base, idNuevo),
      uid,
      compra,
    ),
    false,
  );
  assert.equal(
    await aplicarRevisionCompra(
      base,
      idAnterior,
      await reservarRevisionCompra(base, idAnterior),
      uid,
      { ...compra, vigente: false },
    ),
    true,
  );
  assert.equal(
    await aplicarRevisionCompra(
      base,
      idNuevo,
      await reservarRevisionCompra(base, idNuevo),
      uid,
      compra,
    ),
    true,
  );
  assert.equal(
    await aplicarRevisionCompra(
      base,
      idAnterior,
      await reservarRevisionCompra(base, idAnterior),
      uid,
      { ...compra, vigente: false },
    ),
    false,
  );
  const publica = await base.doc(`usuarios/${uid}/suscripcion/estado`).get();
  assert.equal(publica.get('tipo'), 'pro');
  assert.equal(publica.get('permiteMargen'), true);
});

test('el procesamiento verifica, concede y solo después confirma la compra', async () => {
  const uid = `proceso-${Date.now()}`;
  const token = `compra-${Date.now()}-${Math.random()}`;
  const proyecto = 'calculatupresupuesto-pru-b2e9a';
  const ajustes = { proyecto, producto: 'pro', claveBase64: configuracion.claveBase64 };
  let consultas = 0;
  let confirmaciones = 0;
  const servicios = {
    consultar: async () => {
      consultas += 1;
      return {
        subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
        externalAccountIdentifiers: {
          obfuscatedExternalAccountId: obtenerIdentificadorCuenta(uid, proyecto),
        },
        lineItems: [
          { productId: 'pro', expiryTime: new Date(Date.now() + 86400000).toISOString() },
        ],
        testPurchase: {},
      };
    },
    confirmar: async () => {
      assert.equal((await base.doc(`usuarios/${uid}/suscripcion/estado`).get()).get('tipo'), 'pro');
      confirmaciones += 1;
    },
  };
  assert.deepEqual(await procesarCompra(base, uid, token, ajustes, servicios), {
    actualizada: true,
    pendiente: false,
  });
  assert.equal(consultas, 2);
  assert.equal(confirmaciones, 1);
  await base
    .doc('configuracionSuscripcion/activacion')
    .set({ fecha: Timestamp.fromMillis(Date.now() - 86400000) });
  assert.equal((await iniciarPruebaUnica(base, uid, Date.now() - 172800000)).tipo, 'pro');
  await assert.rejects(procesarCompra(base, 'otra-cuenta', token, ajustes, servicios));
  assert.equal(confirmaciones, 1);
});

test('un reembolso anterior al registro no concede acceso y no bloquea una renovación posterior', async () => {
  const uid = `reembolso-${Date.now()}`;
  const token = `token-reembolso-${Date.now()}-${Math.random()}`;
  const proyecto = 'calculatupresupuesto-pru-b2e9a';
  const ajustes = { proyecto, producto: 'pro', claveBase64: configuracion.claveBase64 };
  let orden = 'orden-sintetica-1';
  let confirmaciones = 0;
  const consultar = async () => ({
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
    externalAccountIdentifiers: {
      obfuscatedExternalAccountId: obtenerIdentificadorCuenta(uid, proyecto),
    },
    lineItems: [
      {
        productId: 'pro',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        latestSuccessfulOrderId: orden,
      },
    ],
    testPurchase: {},
  });
  const confirmar = async () => {
    confirmaciones += 1;
  };
  const aviso = {
    packageName: 'com.calculatupresupuesto.app',
    voidedPurchaseNotification: {
      purchaseToken: token,
      orderId: orden,
      productType: 1,
      refundType: 1,
    },
  };
  const notificaciones = {
    consultar,
    procesar: async (bd: typeof base, cuenta: string, compra: string, config: typeof ajustes) =>
      procesarCompra(bd, cuenta, compra, config, { consultar, confirmar }),
  };
  assert.equal(await procesarNotificacionPlay(base, aviso, ajustes, notificaciones), 'sin-titular');
  await procesarCompra(base, uid, token, ajustes, { consultar, confirmar });
  const estado = base.doc(`usuarios/${uid}/suscripcion/estado`);
  assert.equal((await estado.get()).get('tipo'), 'gratis');
  assert.equal(confirmaciones, 0);
  orden = 'orden-sintetica-2';
  assert.equal(await procesarNotificacionPlay(base, aviso, ajustes, notificaciones), 'procesada');
  assert.equal((await estado.get()).get('tipo'), 'pro');
  assert.equal(await procesarNotificacionPlay(base, aviso, ajustes, notificaciones), 'procesada');
  assert.equal((await estado.get()).get('tipo'), 'pro');
});

test('la reconciliación recupera el token cifrado y limita consultas repetidas', async () => {
  const uid = `reconciliar-${Date.now()}`;
  const token = `compra-reconciliar-${Date.now()}-${Math.random()}`;
  const id = createHash('sha256').update(token).digest('hex');
  await asociarCompraVerificada(base, uid, token, configuracion);
  await base.doc(`suscripcionesPrivadas/${uid}`).set({ compraActual: id });
  let llamadas = 0;
  const simular: typeof procesarCompra = async (_base, cuenta, recibido) => {
    assert.equal(cuenta, uid);
    assert.equal(recibido, token);
    llamadas += 1;
    await base
      .doc(`suscripcionesPrivadas/${uid}`)
      .set({ verificadaEn: Timestamp.now() }, { merge: true });
    return { actualizada: true, pendiente: false };
  };
  const ajustes = { ...configuracion, producto: 'pro' };
  assert.equal(await reconciliarCompraCuenta(base, uid, ajustes, simular), 'actualizada');
  assert.equal(await reconciliarCompraCuenta(base, uid, ajustes, simular), 'limitada');
  assert.equal(llamadas, 1);
  assert.equal(
    await reconciliarCompraCuenta(base, `${uid}-sin-compra`, ajustes, simular),
    'sin-compra',
  );
});

test('un error de consulta no modifica el último estado confirmado', async () => {
  const uid = `error-red-${Date.now()}`;
  const token = `token-red-${Date.now()}-${Math.random()}`;
  const id = createHash('sha256').update(token).digest('hex');
  await asociarCompraVerificada(base, uid, token, configuracion);
  await base.doc(`suscripcionesPrivadas/${uid}`).set({ compraActual: id });
  await base
    .doc(`usuarios/${uid}/suscripcion/estado`)
    .set({ tipo: 'pro', vencimiento: Date.now() + 86400000 });
  const simular: typeof procesarCompra = async () => {
    throw new Error('Sin conexión simulada');
  };
  await assert.rejects(
    reconciliarCompraCuenta(base, uid, { ...configuracion, producto: 'pro' }, simular),
  );
  await assert.rejects(
    reconciliarCompraCuenta(base, uid, { ...configuracion, producto: 'pro' }, simular),
  );
  assert.equal((await base.doc(`usuarios/${uid}/suscripcion/estado`).get()).get('tipo'), 'pro');
});
