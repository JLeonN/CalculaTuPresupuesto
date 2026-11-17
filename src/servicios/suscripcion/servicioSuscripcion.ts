import { getFunctions, httpsCallable } from 'firebase/functions';
import { obtenerFirebase } from '@/configuracion/firebase';
import type { EstadoSuscripcion } from '@/dominio/suscripcion';
import { doc, onSnapshot } from 'firebase/firestore';

export interface EstadoConfirmadoSuscripcion {
  estado: EstadoSuscripcion;
  horaServidor: number;
  mostrarAvisoPrueba: boolean;
}

/** Obtiene el estado de la sesión actual desde el servidor, no desde datos editables. */
export async function consultarEstadoSuscripcion(): Promise<EstadoConfirmadoSuscripcion> {
  const { aplicacion } = obtenerFirebase();
  const invocar = httpsCallable<undefined, unknown>(
    getFunctions(aplicacion, 'southamerica-east1'),
    'iniciarPruebaSuscripcion',
  );
  const resultado = (await invocar()).data;
  if (!resultado || typeof resultado !== 'object')
    throw new Error('Estado de suscripción inválido.');
  const datos = resultado as Record<string, unknown>;
  if (!Number.isSafeInteger(datos.horaServidor) || (datos.horaServidor as number) < 0) {
    throw new Error('La hora del servidor no es válida.');
  }
  const horaServidor = datos.horaServidor as number;
  const mostrarAvisoPrueba = datos.mostrarAvisoPrueba === true;
  if (datos.tipo === 'gratis' || datos.tipo === 'exento') {
    return { estado: { tipo: datos.tipo }, horaServidor, mostrarAvisoPrueba };
  }
  if (
    (datos.tipo === 'prueba' || datos.tipo === 'pro') &&
    Number.isSafeInteger(datos.vencimiento) &&
    (datos.vencimiento as number) >= 0
  ) {
    return {
      estado:
        datos.tipo === 'pro'
          ? {
              tipo: 'pro',
              vencimiento: datos.vencimiento as number,
              permiteMargen: datos.permiteMargen === true,
            }
          : { tipo: 'prueba', vencimiento: datos.vencimiento as number },
      horaServidor,
      mostrarAvisoPrueba,
    };
  }
  throw new Error('Estado de suscripción inválido.');
}

export async function confirmarAvisoPrueba(): Promise<void> {
  const { aplicacion } = obtenerFirebase();
  await httpsCallable(getFunctions(aplicacion, 'southamerica-east1'), 'confirmarAvisoPrueba')();
}

export async function consultarConfiguracionCompra(): Promise<{ producto: string; plan: string }> {
  const { aplicacion } = obtenerFirebase();
  const consultar = httpsCallable<undefined, unknown>(
    getFunctions(aplicacion, 'southamerica-east1'),
    'obtenerProductoSuscripcion',
  );
  const datos = (await consultar()).data;
  if (!datos || typeof datos !== 'object') throw new Error('Producto de suscripción inválido.');
  const configuracion = datos as Record<string, unknown>;
  if (
    typeof configuracion.producto !== 'string' ||
    typeof configuracion.plan !== 'string' ||
    !configuracion.producto ||
    !configuracion.plan
  )
    throw new Error('Producto de suscripción inválido.');
  return { producto: configuracion.producto, plan: configuracion.plan };
}

export async function reconciliarSuscripcion(): Promise<
  'sin-compra' | 'limitada' | 'actualizada' | 'pendiente'
> {
  const { aplicacion } = obtenerFirebase();
  const reconciliar = httpsCallable<undefined, unknown>(
    getFunctions(aplicacion, 'southamerica-east1'),
    'reconciliarSuscripcion',
  );
  const datos = (await reconciliar()).data;
  if (!datos || typeof datos !== 'object') throw new Error('Respuesta de reconciliación inválida.');
  const resultado = (datos as Record<string, unknown>).resultado;
  if (
    resultado !== 'sin-compra' &&
    resultado !== 'limitada' &&
    resultado !== 'actualizada' &&
    resultado !== 'pendiente'
  ) {
    throw new Error('Respuesta de reconciliación inválida.');
  }
  return resultado;
}

/** El aviso no concede permisos: solicita una nueva lectura con hora del servidor. */
export function observarEstadoSuscripcion(
  uid: string,
  cambio: (tipo: string, vencimiento: number | null, permiteMargen: boolean) => void,
): () => void {
  const { baseDatos } = obtenerFirebase();
  return onSnapshot(
    doc(baseDatos, 'usuarios', uid, 'suscripcion', 'estado'),
    (instantanea) => {
      if (instantanea.metadata.fromCache || !instantanea.exists()) return;
      const datos = instantanea.data();
      if (typeof datos.tipo === 'string') {
        const vencimiento =
          (datos.tipo === 'pro' || datos.tipo === 'prueba') && typeof datos.vencimiento === 'number'
            ? datos.vencimiento
            : null;
        cambio(datos.tipo, vencimiento, datos.permiteMargen === true);
      }
    },
    () => {
      /* La consulta y el aviso de conexión permanecen a cargo del store. */
    },
  );
}
