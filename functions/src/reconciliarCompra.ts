import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { descifrarToken, type TokenCifrado } from './cifradoToken';
import { procesarCompra } from './procesarCompra';

const INTERVALO_MS = 60_000;

/** Reconsulta la compra asociada sin tratar un fallo de red como una cancelación. */
export async function reconciliarCompraCuenta(
  base: Firestore,
  uid: string,
  configuracion: { proyecto: string; producto: string; claveBase64: string },
  procesar: typeof procesarCompra = procesarCompra,
): Promise<'sin-compra' | 'limitada' | 'actualizada' | 'pendiente'> {
  if (!uid) throw new Error('Cuenta inválida.');
  const privada = base.doc(`suscripcionesPrivadas/${uid}`);
  const reserva = await base.runTransaction(async (transaccion) => {
    const datos = await transaccion.get(privada);
    const identificador: unknown = datos.get('compraActual');
    if (identificador === undefined) return null;
    if (typeof identificador !== 'string' || !/^[0-9a-f]{64}$/.test(identificador))
      throw new Error('Compra inválida.');
    const compra = await transaccion.get(base.doc(`titularesCompras/${identificador}`));
    if (!compra.exists || compra.get('uid') !== uid) throw new Error('Titular de compra inválido.');
    const ahora = Timestamp.now();
    const intento: unknown = datos.get('ultimoIntentoConciliacion');
    if (intento instanceof Timestamp && ahora.toMillis() - intento.toMillis() < INTERVALO_MS) {
      const verificada: unknown = datos.get('verificadaEn');
      if (!(verificada instanceof Timestamp) || verificada.toMillis() < intento.toMillis()) {
        throw new Error('La verificación anterior aún no se completó.');
      }
      return 'limitada' as const;
    }
    const cifrado: unknown = compra.get('tokenCifrado');
    if (!cifrado || typeof cifrado !== 'object') throw new Error('Token cifrado inválido.');
    transaccion.set(privada, { ultimoIntentoConciliacion: ahora }, { merge: true });
    return { identificador, cifrado: cifrado as TokenCifrado };
  });
  if (reserva === null) return 'sin-compra';
  if (reserva === 'limitada') return 'limitada';
  const token = descifrarToken(
    reserva.cifrado,
    configuracion.claveBase64,
    configuracion.proyecto,
    reserva.identificador,
  );
  const resultado = await procesar(base, uid, token, configuracion);
  if (resultado.pendiente) return 'pendiente';
  if (!resultado.actualizada) throw new Error('Otra revisión de la compra está en curso.');
  return 'actualizada';
}
