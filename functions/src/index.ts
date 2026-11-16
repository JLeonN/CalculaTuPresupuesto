import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const DURACION_PRUEBA_MS = 10 * 24 * 60 * 60 * 1000;
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

  const base = getFirestore();
  const configuracion = base.doc('configuracionSuscripcion/activacion');
  const privada = base.doc(`suscripcionesPrivadas/${uid}`);
  const publica = base.doc(`usuarios/${uid}/suscripcion/estado`);

  return base.runTransaction(async (transaccion) => {
    const [documentoConfiguracion, documentoPrivado, documentoPublico] = await Promise.all([
      transaccion.get(configuracion),
      transaccion.get(privada),
      transaccion.get(publica),
    ]);
    const activacion = documentoConfiguracion.get('fecha');
    if (!(activacion instanceof Timestamp)) {
      throw new HttpsError('failed-precondition', 'La suscripción aún no está activada.');
    }
    const ahora = Timestamp.now();
    if (activacion.toMillis() > ahora.toMillis()) {
      throw new HttpsError('failed-precondition', 'La suscripción aún no está activada.');
    }

    const datosPrivados = documentoPrivado.data();
    let inicio = datosPrivados?.inicioPrueba;
    let vencimiento = datosPrivados?.vencimientoPrueba;
    if (inicio === undefined && vencimiento === undefined) {
      inicio = Timestamp.fromMillis(registro < activacion.toMillis() ? ahora.toMillis() : registro);
      vencimiento = Timestamp.fromMillis(inicio.toMillis() + DURACION_PRUEBA_MS);
      transaccion.set(privada, { inicioPrueba: inicio, vencimientoPrueba: vencimiento }, { merge: true });
    } else if (!(inicio instanceof Timestamp) || !(vencimiento instanceof Timestamp)) {
      throw new HttpsError('failed-precondition', 'No se pudo verificar la prueba.');
    }

    // La integración de Play aún no existe: nunca sobrescribir un estado pagado.
    if (documentoPublico.get('tipo') === 'pro') {
      throw new HttpsError('failed-precondition', 'La compra requiere reconciliación.');
    }
    const exento = datosPrivados?.exento === true;
    const tipo = exento ? 'exento' : vencimiento.toMillis() > ahora.toMillis() ? 'prueba' : 'gratis';
    const estado = { tipo, inicioPrueba: inicio.toMillis(), vencimiento: vencimiento.toMillis() };
    transaccion.set(publica, estado);
    return { ...estado, horaServidor: ahora.toMillis() };
  });
});
