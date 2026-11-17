import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { descifrarToken, type TokenCifrado } from './cifradoToken';
import { procesarCompra } from './procesarCompra';

const INTERVALO_REINTENTO_MS = 60 * 60 * 1000;
const MAXIMO_COMPRAS = 100;

/** Recupera compras asociadas sin depender de la entrega del aviso de Play. */
export async function revisarComprasPendientes(
  base: Firestore,
  configuracion: { proyecto: string; producto: string; claveBase64: string },
  procesar: typeof procesarCompra = procesarCompra,
): Promise<void> {
  const ahora = Timestamp.now();
  const compras = await base
    .collection('titularesCompras')
    .where('proximaRevisionPendiente', '<=', ahora)
    .orderBy('proximaRevisionPendiente')
    .limit(MAXIMO_COMPRAS)
    .get();

  for (const compra of compras.docs) {
    try {
      const reserva = await base.runTransaction(async (transaccion) => {
        const actual = await transaccion.get(compra.ref);
        const fecha: unknown = actual.get('proximaRevisionPendiente');
        const uid: unknown = actual.get('uid');
        const cifrado: unknown = actual.get('tokenCifrado');
        if (!(fecha instanceof Timestamp) || fecha.toMillis() > ahora.toMillis()) return null;
        // La reserva limita reintentos y evita que dos ejecuciones consulten la misma compra.
        transaccion.update(compra.ref, {
          proximaRevisionPendiente: Timestamp.fromMillis(Date.now() + INTERVALO_REINTENTO_MS),
        });
        return { uid, cifrado };
      });
      if (!reserva) continue;
      if (
        typeof reserva.uid !== 'string' ||
        !reserva.uid ||
        !reserva.cifrado ||
        typeof reserva.cifrado !== 'object'
      ) {
        throw new Error('La compra pendiente no es válida.');
      }
      const token = descifrarToken(
        reserva.cifrado as TokenCifrado,
        configuracion.claveBase64,
        configuracion.proyecto,
        compra.id,
      );
      await procesar(base, reserva.uid, token, configuracion);
    } catch {
      // La fecha reservada mantiene el reintento sin registrar tokens ni datos de Play.
    }
  }
}
