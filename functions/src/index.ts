import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { iniciarPruebaUnica } from './pruebaSuscripcion';

initializeApp();

const REGION = 'southamerica-east1';

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
