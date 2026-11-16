import { createHash, timingSafeEqual } from 'node:crypto';
import type { CompraPlay } from './googlePlay';

/** Identificador estable sin correo ni UID en claro para Play y para su verificación. */
export function obtenerIdentificadorCuenta(uid: string, proyecto: string): string {
  if (!uid || !proyecto) throw new Error('Falta la identidad de la cuenta o del entorno.');
  return createHash('sha256')
    .update(JSON.stringify(['calculatupresupuesto', proyecto, uid]), 'utf8')
    .digest('hex');
}

/** La igualdad del identificador no reemplaza la asociación exclusiva del token. */
export function correspondeACuenta(
  compra: CompraPlay,
  uid: string,
  proyecto: string,
): boolean {
  const recibido = compra.externalAccountIdentifiers?.obfuscatedExternalAccountId;
  if (typeof recibido !== 'string' || !/^[0-9a-f]{64}$/.test(recibido)) return false;
  const esperado = obtenerIdentificadorCuenta(uid, proyecto);
  return timingSafeEqual(Buffer.from(recibido, 'hex'), Buffer.from(esperado, 'hex'));
}
