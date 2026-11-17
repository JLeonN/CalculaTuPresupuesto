import { createHash } from 'node:crypto';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { cifrarToken } from './cifradoToken';

function identificarToken(token: string): string {
  if (!token || token.length > 4096) throw new Error('Token de compra inválido.');
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Reserva la titularidad de tokens ya verificados con Play para un único UID.
 * No comprueba la compra ni concede permisos. El token se guarda cifrado una sola vez.
 */
export async function asociarCompraVerificada(
  base: Firestore,
  uid: string,
  tokenCompra: string,
  configuracion: { proyecto: string; claveBase64: string },
  tokenAnterior?: string,
): Promise<void> {
  if (!uid) throw new Error('Falta la identidad de la cuenta.');
  const identificador = identificarToken(tokenCompra);
  const tokenCifrado = cifrarToken(
    tokenCompra,
    configuracion.claveBase64,
    configuracion.proyecto,
    identificador,
  );
  const identificadorAnterior = tokenAnterior ? identificarToken(tokenAnterior) : null;
  if (identificadorAnterior === identificador) throw new Error('La compra enlazada es inválida.');
  const actual = base.doc(`titularesCompras/${identificador}`);
  const anterior = identificadorAnterior
    ? base.doc(`titularesCompras/${identificadorAnterior}`)
    : null;
  const avisos = base.doc(`reembolsosPendientes/${identificador}`);

  await base.runTransaction(async (transaccion) => {
    const documentoActual = await transaccion.get(actual);
    const documentoAnterior = anterior ? await transaccion.get(anterior) : null;
    const documentoAvisos = await transaccion.get(avisos);
    if (documentoActual.exists && documentoActual.get('uid') !== uid) {
      throw new Error('La compra pertenece a otra cuenta.');
    }
    // Una cadena desconocida requiere una recuperación administrativa segura.
    if (documentoAnterior && (!documentoAnterior.exists || documentoAnterior.get('uid') !== uid)) {
      throw new Error('No se pudo verificar la cuenta de la compra anterior.');
    }
    if (!documentoActual.exists) {
      const ordenes: unknown = documentoAvisos.get('ordenes') ?? [];
      if (
        !Array.isArray(ordenes) ||
        ordenes.some((orden) => typeof orden !== 'string' || !/^[0-9a-f]{64}$/.test(orden))
      ) {
        throw new Error('No se pudo comprobar el historial de reembolsos.');
      }
      transaccion.create(actual, {
        uid,
        tokenCifrado,
        ordenesReembolsadas: ordenes,
        proximaRevisionPendiente: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
        creadoEn: FieldValue.serverTimestamp(),
      });
    } else if (documentoActual.get('proximaRevisionPendiente') === undefined) {
      // Si falla una consulta posterior, la compra conserva un reintento independiente.
      transaccion.update(actual, {
        proximaRevisionPendiente: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
      });
    }
  });
}
