import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { obtenerFirebase } from '@/configuracion/firebase';

interface ProductoSuscripcion {
  producto: string;
  plan: string;
  precio: string;
  oferta: string;
}

function asegurarAndroid(): void {
  if (Capacitor.getPlatform() !== 'android')
    throw new Error('Las compras están disponibles en Android.');
}

async function identificarCuenta(uid: string, proyecto: string): Promise<string> {
  const texto = JSON.stringify(['calculatupresupuesto', proyecto, uid]);
  const resumen = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(resumen), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function comprobarCuenta(uid: string): { proyecto: string } {
  const { aplicacion, autenticacion } = obtenerFirebase();
  const usuario = autenticacion.currentUser;
  if (!usuario || usuario.uid !== uid || !usuario.emailVerified || !aplicacion.options.projectId) {
    throw new Error('Iniciá sesión con la cuenta que usará la suscripción.');
  }
  return { proyecto: aplicacion.options.projectId };
}

export async function consultarProductoAndroid(
  producto: string,
  plan: string,
): Promise<ProductoSuscripcion> {
  asegurarAndroid();
  if (!producto || !plan) throw new Error('El producto todavía no está configurado.');
  const { products } = await NativePurchases.getProducts({
    productIdentifiers: [producto],
    productType: PURCHASE_TYPE.SUBS,
  });
  const encontrado = products.find(
    (item) => item.planIdentifier === producto && item.identifier === plan && !item.offerId,
  );
  if (!encontrado?.priceString || !encontrado.offerToken)
    throw new Error('Google Play no devolvió un precio disponible.');
  return { producto, plan, precio: encontrado.priceString, oferta: encontrado.offerToken };
}

async function enviarCompra(uid: string, token: string): Promise<void> {
  comprobarCuenta(uid);
  const { aplicacion } = obtenerFirebase();
  const registrar = httpsCallable<{ token: string }, { actualizada: boolean; pendiente: boolean }>(
    getFunctions(aplicacion, 'southamerica-east1'),
    'registrarCompraPlay',
  );
  const respuesta = await registrar({ token });
  comprobarCuenta(uid);
  if (!respuesta.data.actualizada && !respuesta.data.pendiente) {
    throw new Error('La compra necesita una nueva verificación.');
  }
}

/** El servidor comprueba y confirma la compra; el adaptador no concede permisos. */
export async function comprarSuscripcionAndroid(
  uid: string,
  seleccion: ProductoSuscripcion,
): Promise<'pendiente' | 'verificada'> {
  asegurarAndroid();
  const { proyecto } = comprobarCuenta(uid);
  const identificador = await identificarCuenta(uid, proyecto);
  comprobarCuenta(uid);
  const compra = await NativePurchases.purchaseProduct({
    productIdentifier: seleccion.producto,
    planIdentifier: seleccion.plan,
    offerToken: seleccion.oferta,
    productType: PURCHASE_TYPE.SUBS,
    appAccountToken: identificador,
    autoAcknowledgePurchases: false,
  });
  comprobarCuenta(uid);
  if (compra.purchaseState === '2') return 'pendiente';
  if (
    compra.purchaseState !== '1' ||
    !compra.purchaseToken ||
    compra.productIdentifier !== seleccion.producto
  ) {
    throw new Error('Google Play no devolvió una compra confirmada.');
  }
  await enviarCompra(uid, compra.purchaseToken);
  return 'verificada';
}

export async function recuperarComprasAndroid(uid: string, producto: string): Promise<number> {
  asegurarAndroid();
  const { proyecto } = comprobarCuenta(uid);
  const identificador = await identificarCuenta(uid, proyecto);
  comprobarCuenta(uid);
  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.SUBS,
    appAccountToken: identificador,
  });
  let recuperadas = 0;
  for (const compra of purchases) {
    if (
      compra.productIdentifier === producto &&
      compra.purchaseState === '1' &&
      compra.purchaseToken
    ) {
      await enviarCompra(uid, compra.purchaseToken);
      recuperadas += 1;
    }
  }
  return recuperadas;
}

export async function gestionarSuscripcionAndroid(): Promise<void> {
  asegurarAndroid();
  await NativePurchases.manageSubscriptions();
}
