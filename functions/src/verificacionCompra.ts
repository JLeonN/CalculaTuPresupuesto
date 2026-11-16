import { correspondeACuenta } from './identidadCompra';
import { interpretarCompraPlay, type CompraPlay } from './googlePlay';

export interface CompraVerificada {
  vigente: boolean;
  vencimiento: number | null;
  pendiente: boolean;
  requiereConfirmacion: boolean;
  tokenAnterior?: string;
}

/** Comprueba los datos devueltos por Play antes de reservar o entregar acceso. */
export function verificarCompraPlay(
  compra: CompraPlay,
  uid: string,
  proyecto: string,
  producto: string,
  ahora: number,
): CompraVerificada {
  const entorno = proyecto === 'calculatupresupuesto-prod'
    ? 'produccion'
    : proyecto === 'calculatupresupuesto-pru-b2e9a' ? 'pruebas' : null;
  if (!entorno || !producto || !Number.isSafeInteger(ahora) || ahora < 0) {
    throw new Error('No se pudo identificar el entorno de la compra.');
  }
  if (!Array.isArray(compra.lineItems) || !compra.lineItems.some((linea) => linea.productId === producto)) {
    throw new Error('La compra no corresponde al producto esperado.');
  }
  if (!correspondeACuenta(compra, uid, proyecto)) throw new Error('La compra no corresponde a esta cuenta.');
  const interpretacion = interpretarCompraPlay(compra, producto, ahora);
  if (interpretacion.esPrueba !== (entorno === 'pruebas')) {
    throw new Error('La compra no corresponde a este entorno.');
  }
  const estadosValidos = new Set([
    'SUBSCRIPTION_STATE_PENDING', 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED',
    'SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    'SUBSCRIPTION_STATE_CANCELED', 'SUBSCRIPTION_STATE_ON_HOLD',
    'SUBSCRIPTION_STATE_PAUSED', 'SUBSCRIPTION_STATE_EXPIRED',
  ]);
  if (!estadosValidos.has(compra.subscriptionState ?? '')) throw new Error('Estado de compra desconocido.');
  if (
    ['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED']
      .includes(compra.subscriptionState ?? '') && interpretacion.vencimiento === null
  ) {
    throw new Error('No se pudo verificar el vencimiento de la compra.');
  }
  const pendiente = compra.subscriptionState === 'SUBSCRIPTION_STATE_PENDING';
  if (interpretacion.vigente && compra.acknowledgementState !== 'ACKNOWLEDGEMENT_STATE_PENDING' &&
      compra.acknowledgementState !== 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED') {
    throw new Error('No se pudo verificar la confirmación de la compra.');
  }
  return {
    vigente: interpretacion.vigente,
    vencimiento: interpretacion.vencimiento,
    pendiente,
    requiereConfirmacion: interpretacion.vigente && compra.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING',
    ...(compra.linkedPurchaseToken ? { tokenAnterior: compra.linkedPurchaseToken } : {}),
  };
}
