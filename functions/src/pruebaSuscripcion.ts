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
      transaccion.get(configuracion),
      transaccion.get(privada),
      transaccion.get(publica),
    ]);
    const activacion = documentoConfiguracion.get('fecha');
    const ahora = Timestamp.now();
    if (!(activacion instanceof Timestamp) || activacion.toMillis() > ahora.toMillis()) {
      throw new HttpsError('failed-precondition', 'La suscripción aún no está activada.');
    }
    const datosPrivados = documentoPrivado.data();
    let avisoPendiente = datosPrivados?.avisoPruebaPendiente === true;
    let inicio = datosPrivados?.inicioPrueba;
    let vencimiento = datosPrivados?.vencimientoPrueba;
    if (inicio === undefined && vencimiento === undefined) {
      inicio = Timestamp.fromMillis(registro < activacion.toMillis() ? ahora.toMillis() : registro);
      vencimiento = Timestamp.fromMillis(inicio.toMillis() + DURACION_PRUEBA_MS);
      avisoPendiente = registro < activacion.toMillis() && datosPrivados?.exento !== true;
      transaccion.set(
        privada,
        {
          inicioPrueba: inicio,
          vencimientoPrueba: vencimiento,
          avisoPruebaPendiente: avisoPendiente,
        },
        { merge: true },
      );
    } else if (!(inicio instanceof Timestamp) || !(vencimiento instanceof Timestamp)) {
      throw new HttpsError('failed-precondition', 'No se pudo verificar la prueba.');
    }
    const exento = datosPrivados?.exento === true;
    if (!exento && documentoPublico.get('tipo') === 'pro') {
      const vencimientoPro: unknown = documentoPublico.get('vencimiento');
      if (!Number.isSafeInteger(vencimientoPro) || (vencimientoPro as number) < 0) {
        throw new HttpsError('failed-precondition', 'No se pudo verificar la compra.');
      }
      // Esta lectura no sustituye la reconciliación con Play.
      return {
        tipo: 'pro',
        inicioPrueba: inicio.toMillis(),
        vencimiento: vencimientoPro as number,
        permiteMargen: documentoPublico.get('permiteMargen') === true,
        horaServidor: ahora.toMillis(),
        mostrarAvisoPrueba: false,
      };
    }
    const tipo = exento
      ? 'exento'
      : vencimiento.toMillis() > ahora.toMillis()
        ? 'prueba'
        : 'gratis';
    const estado = { tipo, inicioPrueba: inicio.toMillis(), vencimiento: vencimiento.toMillis() };
    transaccion.set(publica, estado);
    return {
      ...estado,
      horaServidor: ahora.toMillis(),
      mostrarAvisoPrueba: tipo === 'prueba' && avisoPendiente,
    };
  });
}
