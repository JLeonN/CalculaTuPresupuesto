import { getFunctions, httpsCallable } from 'firebase/functions';
import { obtenerFirebase } from '@/configuracion/firebase';
import type { EstadoSuscripcion } from '@/dominio/suscripcion';

export interface EstadoConfirmadoSuscripcion {
  estado: EstadoSuscripcion;
  horaServidor: number;
}

/** Obtiene el estado de la sesión actual desde el servidor, no desde datos editables. */
export async function consultarEstadoSuscripcion(): Promise<EstadoConfirmadoSuscripcion> {
  const { aplicacion } = obtenerFirebase();
  const invocar = httpsCallable<undefined, unknown>(
    getFunctions(aplicacion, 'southamerica-east1'),
    'iniciarPruebaSuscripcion',
  );
  const resultado = (await invocar()).data;
  if (!resultado || typeof resultado !== 'object') throw new Error('Estado de suscripción inválido.');
  const datos = resultado as Record<string, unknown>;
  if (!Number.isSafeInteger(datos.horaServidor) || (datos.horaServidor as number) < 0) {
    throw new Error('La hora del servidor no es válida.');
  }
  const horaServidor = datos.horaServidor as number;
  if (datos.tipo === 'gratis' || datos.tipo === 'exento') {
    return { estado: { tipo: datos.tipo }, horaServidor };
  }
  if (
    (datos.tipo === 'prueba' || datos.tipo === 'pro') &&
    Number.isSafeInteger(datos.vencimiento) && (datos.vencimiento as number) >= 0
  ) {
    return { estado: { tipo: datos.tipo, vencimiento: datos.vencimiento as number }, horaServidor };
  }
  throw new Error('Estado de suscripción inválido.');
}
