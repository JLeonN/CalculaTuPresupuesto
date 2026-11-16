import { createHash } from 'node:crypto';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
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
  const tokenCifrado = cifrarToken(tokenCompra, configuracion.claveBase64, configuracion.proyecto, identificador);
  const identificadorAnterior = tokenAnterior ? identificarToken(tokenAnterior) : null;
  if (identificadorAnterior === identificador) throw new Error('La compra enlazada es inválida.');
  const actual = base.doc(`titularesCompras/${identificador}`);
  const anterior = identificadorAnterior ? base.doc(`titularesCompras/${identificadorAnterior}`) : null;

  await base.runTransaction(async (transaccion) => {
    const documentoActual = await transaccion.get(actual);
    const documentoAnterior = anterior ? await transaccion.get(anterior) : null;
    if (documentoActual.exists && documentoActual.get('uid') !== uid) {
      throw new Error('La compra pertenece a otra cuenta.');
    }
    // Una cadena desconocida requiere una recuperación administrativa segura.
    if (documentoAnterior && (!documentoAnterior.exists || documentoAnterior.get('uid') !== uid)) {
      throw new Error('No se pudo verificar la cuenta de la compra anterior.');
    }
    if (!documentoActual.exists) {
      transaccion.create(actual, { uid, tokenCifrado, creadoEn: FieldValue.serverTimestamp() });
    }
  });
}
