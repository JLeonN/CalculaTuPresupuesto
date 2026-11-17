import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import type { CompraVerificada } from './verificacionCompra';

function referenciaCompra(base: Firestore, identificador: string) {
  if (!/^[0-9a-f]{64}$/.test(identificador)) throw new Error('Identificador de compra inválido.');
  return base.doc(`titularesCompras/${identificador}`);
}

/** Reservar antes de consultar Play impide que una consulta anterior sobrescriba otra más reciente. */
export async function reservarRevisionCompra(
  base: Firestore,
  identificador: string,
): Promise<number> {
  const compra = referenciaCompra(base, identificador);
  return base.runTransaction(async (transaccion) => {
    const documento = await transaccion.get(compra);
    if (!documento.exists) throw new Error('La compra aún no tiene titular.');
    const anterior = documento.get('revisionSolicitada') ?? 0;
    if (!Number.isSafeInteger(anterior) || anterior < 0 || anterior >= Number.MAX_SAFE_INTEGER) {
      throw new Error('La revisión de compra no es válida.');
    }
    const revision = anterior + 1;
    transaccion.update(compra, { revisionSolicitada: revision });
    return revision;
  });
}

/** Aplica únicamente una respuesta ya verificada de Play y todavía vigente como revisión. */
export async function aplicarRevisionCompra(
  base: Firestore,
  identificador: string,
  revision: number,
  uid: string,
  compraVerificada: CompraVerificada,
): Promise<boolean> {
  if (!uid || !Number.isSafeInteger(revision) || revision < 1)
    throw new Error('Revisión inválida.');
  const compra = referenciaCompra(base, identificador);
  const identificadorAnterior = compraVerificada.tokenAnterior
    ? createHash('sha256').update(compraVerificada.tokenAnterior, 'utf8').digest('hex')
    : undefined;
  const privada = base.doc(`suscripcionesPrivadas/${uid}`);
  const publica = base.doc(`usuarios/${uid}/suscripcion/estado`);
  return base.runTransaction(async (transaccion) => {
    const [documentoCompra, documentoPrivado, documentoPublico] = await Promise.all([
      transaccion.get(compra),
      transaccion.get(privada),
      transaccion.get(publica),
    ]);
    if (!documentoCompra.exists || documentoCompra.get('uid') !== uid)
      throw new Error('Titular de compra inválido.');
    if (documentoCompra.get('revisionSolicitada') !== revision) return false;
    const datos = documentoPrivado.data();
    const reembolsos: unknown = documentoCompra.get('ordenesReembolsadas') ?? [];
    if (
      !Array.isArray(reembolsos) ||
      reembolsos.some((orden) => typeof orden !== 'string' || !/^[0-9a-f]{64}$/.test(orden))
    ) {
      throw new Error('No se pudo comprobar el historial de reembolsos.');
    }
    if (compraVerificada.vigente && reembolsos.length && !compraVerificada.ordenHash) {
      throw new Error('No se pudo comprobar la orden vigente.');
    }
    // Una operación pendiente no reemplaza una suscripción activa ni inicia una nueva.
    if (compraVerificada.pendiente) return false;
    const ahora = Timestamp.now();
    const vencimiento = compraVerificada.vencimiento;
    if (compraVerificada.vigente && (!Number.isSafeInteger(vencimiento) || vencimiento === null)) {
      throw new Error('Vencimiento de compra inválido.');
    }
    const pro =
      compraVerificada.vigente &&
      vencimiento !== null &&
      vencimiento > ahora.toMillis() &&
      (!compraVerificada.ordenHash || !reembolsos.includes(compraVerificada.ordenHash));
    const actual = datos?.compraActual;
    if (actual && actual !== identificador && actual !== identificadorAnterior) {
      // Una compra nueva sin enlace solo sustituye otra cuyo acceso ya terminó.
      const tipoAnterior: unknown = documentoPublico.get('tipo');
      const vencimientoAnterior: unknown = documentoPublico.get('vencimiento');
      const anteriorFinalizada =
        tipoAnterior === 'gratis' ||
        tipoAnterior === 'prueba' ||
        (tipoAnterior === 'pro' &&
          Number.isSafeInteger(vencimientoAnterior) &&
          (vencimientoAnterior as number) <= ahora.toMillis());
      if (!pro || !anteriorFinalizada) return false;
    }
    const exento = datos?.exento === true;
    const finPrueba = datos?.vencimientoPrueba;
    const prueba = finPrueba instanceof Timestamp && finPrueba.toMillis() > ahora.toMillis();
    const estado = exento
      ? { tipo: 'exento' }
      : pro
        ? { tipo: 'pro', vencimiento, permiteMargen: compraVerificada.renovacionEsperada === true }
        : prueba
          ? { tipo: 'prueba', vencimiento: finPrueba.toMillis() }
          : { tipo: 'gratis' };
    const proximaRevision = Timestamp.fromMillis(
      Math.min(
        ahora.toMillis() + 24 * 60 * 60 * 1000,
        pro && vencimiento !== null ? vencimiento : Number.MAX_SAFE_INTEGER,
      ),
    );
    transaccion.set(
      privada,
      { compraActual: identificador, verificadaEn: ahora, proximaRevision },
      { merge: true },
    );
    transaccion.set(publica, estado);
    transaccion.update(compra, { revisionAplicada: revision });
    return true;
  });
}
