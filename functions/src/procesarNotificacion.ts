import { createHash } from 'node:crypto';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { consultarSuscripcionPlay, type CompraPlay } from './googlePlay';
import { interpretarNotificacionPlay } from './notificacionPlay';
import { procesarCompra } from './procesarCompra';

/** Los avisos solo identifican cambios; Play sigue siendo la fuente del estado. */
export async function procesarNotificacionPlay(
  base: Firestore,
  mensaje: unknown,
  configuracion: { proyecto: string; producto: string; claveBase64: string },
  servicios: {
    consultar: (token: string) => Promise<CompraPlay>;
    procesar: typeof procesarCompra;
  } = { consultar: consultarSuscripcionPlay, procesar: procesarCompra },
): Promise<'ignorada' | 'sin-titular' | 'procesada'> {
  const aviso = interpretarNotificacionPlay(mensaje);
  if (aviso.tipo === 'prueba' || aviso.tipo === 'ignorado') return 'ignorada';
  const pruebas = configuracion.proyecto === 'calculatupresupuesto-pru-b2e9a';
  if (!pruebas && configuracion.proyecto !== 'calculatupresupuesto-prod')
    throw new Error('Entorno inválido.');
  const identificador = createHash('sha256').update(aviso.token, 'utf8').digest('hex');
  const compra = base.doc(`titularesCompras/${identificador}`);
  if (aviso.tipo === 'reembolso') {
    const estado = await servicios.consultar(aviso.token);
    if (
      (estado.testPurchase !== undefined) !== pruebas ||
      !Array.isArray(estado.lineItems) ||
      !estado.lineItems.some((item) => item.productId === configuracion.producto)
    ) {
      throw new Error('La compra no corresponde al entorno o producto.');
    }
    const ordenHash = createHash('sha256').update(aviso.orden, 'utf8').digest('hex');
    const pendientes = base.doc(`reembolsosPendientes/${identificador}`);
    await base.runTransaction(async (transaccion) => {
      const titular = await transaccion.get(compra);
      transaccion.set(pendientes, { ordenes: FieldValue.arrayUnion(ordenHash) }, { merge: true });
      if (titular.exists)
        transaccion.update(compra, { ordenesReembolsadas: FieldValue.arrayUnion(ordenHash) });
    });
  }
  const documento = await compra.get();
  const uid: unknown = documento.get('uid');
  if (!documento.exists) return 'sin-titular';
  if (typeof uid !== 'string' || !uid)
    throw new Error('No se pudo verificar el titular de la compra.');
  await servicios.procesar(base, uid, aviso.token, configuracion);
  return 'procesada';
}
