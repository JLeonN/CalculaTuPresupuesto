import { createHash } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
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
    await servicios.consultar(token), uid, configuracion.proyecto, configuracion.producto, Date.now(),
  );
  await asociarCompraVerificada(base, uid, token, configuracion, primera.tokenAnterior);
  const identificador = createHash('sha256').update(token, 'utf8').digest('hex');
  const revision = await reservarRevisionCompra(base, identificador);
  // Consultar después de reservar evita que una respuesta antigua invalide una más reciente.
  const verificada = verificarCompraPlay(
    await servicios.consultar(token), uid, configuracion.proyecto, configuracion.producto, Date.now(),
  );
  if (verificada.tokenAnterior !== primera.tokenAnterior) {
    throw new Error('La asociación de la compra cambió durante la verificación.');
  }
  const actualizada = await aplicarRevisionCompra(base, identificador, revision, uid, verificada);
  if (actualizada && verificada.requiereConfirmacion &&
      verificada.vencimiento !== null && verificada.vencimiento > Date.now()) {
    await servicios.confirmar(token, configuracion.producto);
  }
  return { actualizada, pendiente: verificada.pendiente };
}
