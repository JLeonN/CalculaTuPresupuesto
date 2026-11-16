import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

const DURACION_PRUEBA_MS = 10 * 24 * 60 * 60 * 1000;

export async function iniciarPruebaUnica(base: Firestore, uid: string, registro: number) {
  if (!uid || !Number.isSafeInteger(registro) || registro < 0) {
    throw new HttpsError('failed-precondition', 'No se pudo verificar la cuenta.');
  }
  const configuracion = base.doc('configuracionSuscripcion/activacion');
  const privada = base.doc(`suscripcionesPrivadas/${uid}`);
  const publica = base.doc(`usuarios/${uid}/suscripcion/estado`);

  return base.runTransaction(async (transaccion) => {
    const [documentoConfiguracion, documentoPrivado, documentoPublico] = await Promise.all([
      transaccion.get(configuracion), transaccion.get(privada), transaccion.get(publica),
    ]);
    const activacion = documentoConfiguracion.get('fecha');
    const ahora = Timestamp.now();
    if (!(activacion instanceof Timestamp) || activacion.toMillis() > ahora.toMillis()) {
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
}
