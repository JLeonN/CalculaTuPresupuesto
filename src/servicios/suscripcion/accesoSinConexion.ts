import { resolverAccesoSuscripcion, type AccesoSuscripcion } from '@/dominio/suscripcion';
import {
  evaluarReferenciaSinConexion,
  MARGEN_SIN_CONEXION_MS,
  type ReferenciaTiempoSuscripcion,
} from './referenciaTiempo';
import type { ReferenciaRelojAndroid } from './relojAndroid';

/** Evalúa solo una referencia previamente confirmada; un reinicio exige volver a consultar. */
export function resolverAccesoAndroidSinConexion(
  tipo: 'prueba' | 'pro',
  referencia: ReferenciaTiempoSuscripcion,
  uid: string,
  proyecto: string,
  reloj: ReferenciaRelojAndroid,
  permiteMargen = false,
): { acceso: AccesoSuscripcion; necesitaConexion: boolean } {
  const evaluacion = evaluarReferenciaSinConexion(referencia, uid, proyecto, reloj);
  if (!evaluacion) {
    return {
      acceso: resolverAccesoSuscripcion({ tipo: 'pendiente' }, NaN),
      necesitaConexion: true,
    };
  }
  // La prueba termina al cumplirse los diez días; el margen cubre una posible renovación pagada.
  const limite =
    referencia.vencimiento + (tipo === 'pro' && permiteMargen ? MARGEN_SIN_CONEXION_MS : 0);
  if (!Number.isSafeInteger(limite)) {
    return {
      acceso: resolverAccesoSuscripcion({ tipo: 'pendiente' }, NaN),
      necesitaConexion: true,
    };
  }
  return {
    acceso: resolverAccesoSuscripcion({ tipo, vencimiento: limite }, evaluacion.fechaEstimada),
    necesitaConexion: evaluacion.fechaEstimada >= referencia.vencimiento,
  };
}
