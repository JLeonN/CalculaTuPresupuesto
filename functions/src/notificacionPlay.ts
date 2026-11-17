const PAQUETE_ANDROID = 'com.calculatupresupuesto.app';

export type AvisoPlay =
  | { tipo: 'suscripcion'; token: string }
  | { tipo: 'reembolso'; token: string; orden: string }
  | { tipo: 'prueba' }
  | { tipo: 'ignorado' };

/** El aviso solo identifica una compra; nunca demuestra que una suscripción está vigente. */
export function interpretarNotificacionPlay(valor: unknown): AvisoPlay {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    throw new Error('Notificación de Play inválida.');
  }
  const datos = valor as Record<string, unknown>;
  if (datos.packageName !== PAQUETE_ANDROID)
    throw new Error('La notificación pertenece a otra aplicación.');
  const candidatos = [
    'testNotification',
    'subscriptionNotification',
    'voidedPurchaseNotification',
  ].filter((campo) => datos[campo] !== undefined);
  if (candidatos.length > 1) throw new Error('La notificación de Play es ambigua.');
  if (datos.testNotification !== undefined) return { tipo: 'prueba' };
  const propiedad =
    datos.subscriptionNotification !== undefined
      ? 'subscriptionNotification'
      : datos.voidedPurchaseNotification !== undefined
        ? 'voidedPurchaseNotification'
        : null;
  if (!propiedad) return { tipo: 'ignorado' };
  const notificacion = datos[propiedad];
  if (!notificacion || typeof notificacion !== 'object' || Array.isArray(notificacion)) {
    throw new Error('Notificación de compra inválida.');
  }
  const contenido = notificacion as Record<string, unknown>;
  if (propiedad === 'voidedPurchaseNotification' && contenido.productType !== 1)
    return { tipo: 'ignorado' };
  if (
    typeof contenido.purchaseToken !== 'string' ||
    !contenido.purchaseToken ||
    contenido.purchaseToken.length > 4096
  ) {
    throw new Error('La notificación no contiene un token válido.');
  }
  if (propiedad === 'voidedPurchaseNotification') {
    if (
      contenido.refundType !== 1 ||
      typeof contenido.orderId !== 'string' ||
      !contenido.orderId ||
      contenido.orderId.length > 256
    ) {
      throw new Error('No se pudo identificar el reembolso completo.');
    }
    return { tipo: 'reembolso', token: contenido.purchaseToken, orden: contenido.orderId };
  }
  return { tipo: 'suscripcion', token: contenido.purchaseToken };
}
