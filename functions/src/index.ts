import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { iniciarPruebaUnica } from './pruebaSuscripcion';
import { procesarCompra } from './procesarCompra';

initializeApp();

const REGION = 'southamerica-east1';
const CLAVE_CIFRADO_PLAY = defineSecret('CLAVE_CIFRADO_PLAY');

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
    const proyecto = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? '';
    if (!['calculatupresupuesto-prod', 'calculatupresupuesto-pru-b2e9a'].includes(proyecto)) {
      throw new HttpsError('failed-precondition', 'El entorno de compras no está configurado.');
    }
    const base = getFirestore();
    const configuracion = await base.doc('configuracionSuscripcion/play').get();
    const producto: unknown = configuracion.get('producto');
    if (typeof producto !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,255}$/.test(producto)) {
      throw new HttpsError('failed-precondition', 'El producto de suscripción aún no está configurado.');
    }
    try {
      return await procesarCompra(base, uid, token, {
        proyecto, producto, claveBase64: CLAVE_CIFRADO_PLAY.value(),
      });
    } catch {
      // No registrar ni devolver el token o las respuestas privadas de Google Play.
      throw new HttpsError('failed-precondition', 'No se pudo verificar la compra. Intentá nuevamente.');
    }
  },
);
