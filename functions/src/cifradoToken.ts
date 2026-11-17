import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface TokenCifrado {
  version: 1;
  nonce: string;
  contenido: string;
  autenticacion: string;
}

function obtenerClave(claveBase64: string): Buffer {
  const clave = Buffer.from(claveBase64, 'base64');
  if (clave.length !== 32 || clave.toString('base64') !== claveBase64) {
    throw new Error('La clave de cifrado de compras no es válida.');
  }
  return clave;
}

function contexto(proyecto: string, identificador: string): Buffer {
  if (!proyecto || !/^[0-9a-f]{64}$/.test(identificador))
    throw new Error('Contexto de compra inválido.');
  return Buffer.from(JSON.stringify(['compra-play-v1', proyecto, identificador]), 'utf8');
}

/** Cifra el token con una clave externa y lo vincula a su proyecto y documento. */
export function cifrarToken(
  token: string,
  claveBase64: string,
  proyecto: string,
  identificador: string,
): TokenCifrado {
  if (!token || token.length > 4096) throw new Error('Token de compra inválido.');
  const nonce = randomBytes(12);
  const cifrador = createCipheriv('aes-256-gcm', obtenerClave(claveBase64), nonce);
  cifrador.setAAD(contexto(proyecto, identificador));
  const contenido = Buffer.concat([cifrador.update(token, 'utf8'), cifrador.final()]);
  return {
    version: 1,
    nonce: nonce.toString('base64'),
    contenido: contenido.toString('base64'),
    autenticacion: cifrador.getAuthTag().toString('base64'),
  };
}

export function descifrarToken(
  datos: TokenCifrado,
  claveBase64: string,
  proyecto: string,
  identificador: string,
): string {
  try {
    if (datos.version !== 1) throw new Error();
    const nonce = Buffer.from(datos.nonce, 'base64');
    const autenticacion = Buffer.from(datos.autenticacion, 'base64');
    if (nonce.length !== 12 || autenticacion.length !== 16) throw new Error();
    const descifrador = createDecipheriv('aes-256-gcm', obtenerClave(claveBase64), nonce);
    descifrador.setAAD(contexto(proyecto, identificador));
    descifrador.setAuthTag(autenticacion);
    const token = Buffer.concat([
      descifrador.update(Buffer.from(datos.contenido, 'base64')),
      descifrador.final(),
    ]).toString('utf8');
    if (!token || token.length > 4096) throw new Error();
    return token;
  } catch {
    throw new Error('No se pudo verificar el token cifrado.');
  }
}
