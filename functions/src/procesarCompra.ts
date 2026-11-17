import { createHash } from 'node:crypto';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { asociarCompraVerificada } from './asociacionCompra';
import { aplicarRevisionCompra, reservarRevisionCompra } from './actualizacionCompra';
import { confirmarSuscripcionPlay, consultarSuscripcionPlay, type CompraPlay } from './googlePlay';
import { verificarCompraPlay } from './verificacionCompra';

/** Orquesta una compra ya recibida; no debe exponerse sin autenticación y configuración del servidor. */
export async function procesarCompra(
  base: Firestore,
  uid: string,
  token: string,
  configuracion: { proyecto: string; producto: string; claveBase64: string },
  servicios: {
    consultar: (token: string) => Promise<CompraPlay>;
    confirmar: (token: string, producto: string) => Promise<void>;
  } = { consultar: consultarSuscripcionPlay, confirmar: confirmarSuscripcionPlay },
): Promise<{ actualizada: boolean; pendiente: boolean }> {
  // La primera consulta valida la titularidad antes de reservar el token.
  const primera = verificarCompraPlay(
    await servicios.consultar(token),
    uid,
    configuracion.proyecto,
    configuracion.producto,
    Date.now(),
  );
  await asociarCompraVerificada(base, uid, token, configuracion, primera.tokenAnterior);
  const identificador = createHash('sha256').update(token, 'utf8').digest('hex');
  const revision = await reservarRevisionCompra(base, identificador);
  // Consultar después de reservar evita que una respuesta antigua invalide una más reciente.
  const verificada = verificarCompraPlay(
    await servicios.consultar(token),
    uid,
    configuracion.proyecto,
    configuracion.producto,
    Date.now(),
  );
  if (verificada.tokenAnterior !== primera.tokenAnterior) {
    throw new Error('La asociación de la compra cambió durante la verificación.');
  }
  const actualizada = await aplicarRevisionCompra(base, identificador, revision, uid, verificada);
  if (
    actualizada &&
    verificada.requiereConfirmacion &&
    verificada.vencimiento !== null &&
    verificada.vencimiento > Date.now()
  ) {
    const documento = await base.doc(`titularesCompras/${identificador}`).get();
    const reembolsos: unknown = documento.get('ordenesReembolsadas') ?? [];
    if (!Array.isArray(reembolsos) || (reembolsos.length && !verificada.ordenHash)) {
      throw new Error('No se pudo verificar la orden antes de confirmar.');
    }
    if (!verificada.ordenHash || !reembolsos.includes(verificada.ordenHash)) {
      await servicios.confirmar(token, configuracion.producto);
    }
  }
  if (actualizada || verificada.pendienteCancelada) {
    const referencia = base.doc(`titularesCompras/${identificador}`);
    await base.runTransaction(async (transaccion) => {
      const documento = await transaccion.get(referencia);
      if (documento.get('uid') === uid && documento.get('revisionSolicitada') === revision) {
        transaccion.update(referencia, { proximaRevisionPendiente: FieldValue.delete() });
      }
    });
  }
  return { actualizada, pendiente: verificada.pendiente };
}
