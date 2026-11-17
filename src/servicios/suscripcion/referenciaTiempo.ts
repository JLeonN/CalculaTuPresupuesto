import { calcularTiempoTranscurrido, type ReferenciaRelojAndroid } from './relojAndroid';

export const MARGEN_SIN_CONEXION_MS = 5 * 24 * 60 * 60 * 1000;

/** Referencia recibida de una respuesta verificada y asociada a cuenta y entorno. */
export interface ReferenciaTiempoSuscripcion {
  uid: string;
  proyectoFirebase: string;
  horaServidor: number;
  vencimiento: number;
  reloj: ReferenciaRelojAndroid;
}

/** No protege contra un dispositivo manipulado; rechaza referencias incoherentes. */
export function evaluarReferenciaSinConexion(
  referencia: ReferenciaTiempoSuscripcion,
  uid: string,
  proyectoFirebase: string,
  relojActual: ReferenciaRelojAndroid,
): { fechaEstimada: number; dentroDelMargen: boolean } | null {
  if (
    !uid ||
    !proyectoFirebase ||
    referencia.uid !== uid ||
    referencia.proyectoFirebase !== proyectoFirebase ||
    !Number.isSafeInteger(referencia.horaServidor) ||
    referencia.horaServidor < 0 ||
    !Number.isSafeInteger(referencia.vencimiento) ||
    referencia.vencimiento < 0
  )
    return null;

  const transcurrido = calcularTiempoTranscurrido(referencia.reloj, relojActual);
  if (transcurrido === null) return null;
  const fechaEstimada = referencia.horaServidor + transcurrido;
  const limite = referencia.vencimiento + MARGEN_SIN_CONEXION_MS;
  if (!Number.isSafeInteger(fechaEstimada) || !Number.isSafeInteger(limite)) return null;
  return { fechaEstimada, dentroDelMargen: fechaEstimada < limite };
}
