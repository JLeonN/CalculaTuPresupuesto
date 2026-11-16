import { GoogleAuth } from 'google-auth-library';

const PAQUETE_ANDROID = 'com.calculatupresupuesto.app';
const ALCANCE_PLAY = 'https://www.googleapis.com/auth/androidpublisher';

export interface CompraPlay {
  subscriptionState?: string;
  acknowledgementState?: string;
  linkedPurchaseToken?: string;
  testPurchase?: object;
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
  lineItems?: Array<{ productId?: string; expiryTime?: string }>;
}

/** Solo consulta Play. El resultado no concede acceso ni vincula una cuenta. */
export async function consultarSuscripcionPlay(tokenCompra: string): Promise<CompraPlay> {
  if (!tokenCompra || tokenCompra.length > 4096) throw new Error('Token de compra inválido.');
  const autenticacion = new GoogleAuth({ scopes: [ALCANCE_PLAY] });
  const cliente = await autenticacion.getClient();
  const credencial = await cliente.getAccessToken();
  if (!credencial.token) throw new Error('No se pudo autorizar la consulta a Google Play.');
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAQUETE_ANDROID}/purchases/subscriptionsv2/tokens/${encodeURIComponent(tokenCompra)}`;
  let respuesta: Response;
  try {
    respuesta = await fetch(url, { headers: { Authorization: `Bearer ${credencial.token}` } });
  } catch {
    throw new Error('No se pudo contactar a Google Play.');
  }
  // No propagar respuestas ni URL: podrían contener datos o tokens de compra.
  if (!respuesta.ok) throw new Error(`Google Play rechazó la consulta (${respuesta.status}).`);
  return (await respuesta.json()) as CompraPlay;
}

/** No reemplaza la validación de titularidad, producto, entorno ni la transacción. */
export function interpretarCompraPlay(compra: CompraPlay, producto: string, ahora: number): {
  vigente: boolean;
  vencimiento: number | null;
  esPrueba: boolean;
} {
  const estadosVigentes = new Set([
    'SUBSCRIPTION_STATE_ACTIVE',
    'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    'SUBSCRIPTION_STATE_CANCELED',
  ]);
  const vencimientos = (compra.lineItems ?? [])
    .filter((linea) => linea.productId === producto && typeof linea.expiryTime === 'string')
    .map((linea) => Date.parse(linea.expiryTime!))
    .filter(Number.isFinite);
  const vencimiento = vencimientos.length ? Math.max(...vencimientos) : null;
  return {
    vigente: Number.isFinite(ahora) && vencimiento !== null && vencimiento > ahora &&
      estadosVigentes.has(compra.subscriptionState ?? ''),
    vencimiento,
    esPrueba: compra.testPurchase !== undefined,
  };
}
