import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Timestamp } from 'firebase-admin/firestore';
import { iniciarPruebaUnica } from './pruebaSuscripcion';
import { procesarCompra } from './procesarCompra';
import { procesarNotificacionPlay } from './procesarNotificacion';
import { reconciliarCompraCuenta } from './reconciliarCompra';

initializeApp();

const REGION = 'southamerica-east1';
const CLAVE_CIFRADO_PLAY = defineSecret('CLAVE_CIFRADO_PLAY');

async function obtenerConfiguracionPlay() {
  const proyecto = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? '';
  if (!['calculatupresupuesto-prod', 'calculatupresupuesto-pru-b2e9a'].includes(proyecto)) {
    throw new HttpsError('failed-precondition', 'El entorno de compras no está configurado.');
  }
  const producto: unknown = (await getFirestore().doc('configuracionSuscripcion/play').get()).get(
    'producto',
  );
  if (typeof producto !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,255}$/.test(producto)) {
    throw new HttpsError(
      'failed-precondition',
      'El producto de suscripción aún no está configurado.',
    );
  }
  return { proyecto, producto, claveBase64: CLAVE_CIFRADO_PLAY.value() };
}

/** Inicializa una única prueba por cuenta sin aceptar fechas ni exenciones del cliente. */
export const iniciarPruebaSuscripcion = onCall({ region: REGION }, async (solicitud) => {
  const uid = solicitud.auth?.uid;
  if (!uid || solicitud.auth?.token.email_verified !== true) {
    throw new HttpsError('unauthenticated', 'Iniciá sesión con una cuenta verificada.');
  }

  const usuario = await getAuth().getUser(uid);
  const registro = Date.parse(usuario.metadata.creationTime);
  if (!usuario.emailVerified || usuario.disabled || !Number.isFinite(registro)) {
    throw new HttpsError('failed-precondition', 'No se pudo verificar la cuenta.');
  }

  return iniciarPruebaUnica(getFirestore(), uid, registro);
});

export const confirmarAvisoPrueba = onCall({ region: REGION }, async (solicitud) => {
  const uid = solicitud.auth?.uid;
  if (!uid || solicitud.auth?.token.email_verified !== true) {
    throw new HttpsError('unauthenticated', 'Iniciá sesión con una cuenta verificada.');
  }
  const privada = getFirestore().doc(`suscripcionesPrivadas/${uid}`);
  await getFirestore().runTransaction(async (transaccion) => {
    const documento = await transaccion.get(privada);
    if (documento.exists && documento.get('avisoPruebaPendiente') === true) {
      transaccion.update(privada, { avisoPruebaPendiente: false });
    }
  });
});

/** La cuenta, el producto y el entorno se validan en el servidor, no en el cliente. */
export const registrarCompraPlay = onCall(
  { region: REGION, secrets: [CLAVE_CIFRADO_PLAY] },
  async (solicitud) => {
    const uid = solicitud.auth?.uid;
    if (!uid || solicitud.auth?.token.email_verified !== true) {
      throw new HttpsError('unauthenticated', 'Iniciá sesión con una cuenta verificada.');
    }
    const usuario = await getAuth().getUser(uid);
    if (!usuario.emailVerified || usuario.disabled) {
      throw new HttpsError('permission-denied', 'No se pudo verificar la cuenta.');
    }
    const token: unknown = solicitud.data?.token;
    if (typeof token !== 'string' || !token || token.length > 4096) {
      throw new HttpsError('invalid-argument', 'No se pudo leer la compra.');
    }
    try {
      return await procesarCompra(getFirestore(), uid, token, await obtenerConfiguracionPlay());
    } catch {
      // No registrar ni devolver el token o las respuestas privadas de Google Play.
      throw new HttpsError(
        'failed-precondition',
        'No se pudo verificar la compra. Intentá nuevamente.',
      );
    }
  },
);

/** El tema y sus permisos deben configurarse y comprobarse por entorno antes del despliegue. */
export const recibirAvisosPlay = onMessagePublished(
  { topic: 'avisos-play', region: REGION, retry: true, secrets: [CLAVE_CIFRADO_PLAY] },
  async (evento) => {
    try {
      await procesarNotificacionPlay(
        getFirestore(),
        evento.data.message.json,
        await obtenerConfiguracionPlay(),
      );
    } catch {
      // El reintento no debe registrar tokens ni el contenido del mensaje.
      throw new Error('No se pudo procesar el aviso de Google Play.');
    }
  },
);

export const reconciliarSuscripcion = onCall(
  { region: REGION, secrets: [CLAVE_CIFRADO_PLAY] },
  async (solicitud) => {
    const uid = solicitud.auth?.uid;
    if (!uid || solicitud.auth?.token.email_verified !== true) {
      throw new HttpsError('unauthenticated', 'Iniciá sesión con una cuenta verificada.');
    }
    const usuario = await getAuth().getUser(uid);
    if (!usuario.emailVerified || usuario.disabled)
      throw new HttpsError('permission-denied', 'No se pudo verificar la cuenta.');
    try {
      return {
        resultado: await reconciliarCompraCuenta(
          getFirestore(),
          uid,
          await obtenerConfiguracionPlay(),
        ),
      };
    } catch {
      throw new HttpsError(
        'unavailable',
        'No se pudo verificar la suscripción. Intentá nuevamente.',
      );
    }
  },
);

export const obtenerProductoSuscripcion = onCall({ region: REGION }, async (solicitud) => {
  if (!solicitud.auth?.uid || solicitud.auth.token.email_verified !== true) {
    throw new HttpsError('unauthenticated', 'Iniciá sesión con una cuenta verificada.');
  }
  const documento = await getFirestore().doc('configuracionSuscripcion/play').get();
  const producto: unknown = documento.get('producto');
  const plan: unknown = documento.get('plan');
  if (
    typeof producto !== 'string' ||
    typeof plan !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]{0,255}$/.test(producto) ||
    !/^[a-z0-9][a-z0-9-]{0,62}$/.test(plan)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'El producto de suscripción aún no está configurado.',
    );
  }
  return { producto, plan };
});

/** Revisa un lote acotado; la programación y sus costos deben revisarse antes del despliegue. */
export const revisarSuscripcionesPendientes = onSchedule(
  { schedule: 'every 6 hours', region: REGION, secrets: [CLAVE_CIFRADO_PLAY] },
  async () => {
    const base = getFirestore();
    const configuracion = await obtenerConfiguracionPlay();
    const pendientes = await base
      .collection('suscripcionesPrivadas')
      .where('proximaRevision', '<=', Timestamp.now())
      .orderBy('proximaRevision')
      .limit(100)
      .get();
    for (const documento of pendientes.docs) {
      let reprogramar = false;
      try {
        const resultado = await reconciliarCompraCuenta(base, documento.id, configuracion);
        reprogramar = resultado !== 'actualizada';
      } catch {
        reprogramar = true;
      }
      if (reprogramar) {
        await base.runTransaction(async (transaccion) => {
          const actual = await transaccion.get(documento.ref);
          const fechaAnterior: unknown = documento.get('proximaRevision');
          const fechaActual: unknown = actual.get('proximaRevision');
          if (
            fechaAnterior instanceof Timestamp &&
            fechaActual instanceof Timestamp &&
            fechaAnterior.isEqual(fechaActual)
          ) {
            transaccion.update(documento.ref, {
              proximaRevision: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
            });
          }
        });
      }
    }
  },
);
