import { Preferences } from '@capacitor/preferences';
import type { ReferenciaTiempoSuscripcion } from './referenciaTiempo';

const CLAVE_REFERENCIA = 'calcula-tu-presupuesto:referencia-suscripcion-v1';
export type ReferenciaPersistida = ReferenciaTiempoSuscripcion & {
  tipo: 'gratis' | 'exento' | 'prueba' | 'pro';
  permiteMargen?: boolean;
};

/** Los datos locales no impiden la manipulación de un dispositivo modificado. */
export function interpretarReferenciaPersistida(valor: string | null): ReferenciaPersistida | null {
  if (!valor) return null;
  try {
    const datos: unknown = JSON.parse(valor);
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null;
    const registro = datos as Record<string, unknown>;
    if (!registro.reloj || typeof registro.reloj !== 'object' || Array.isArray(registro.reloj))
      return null;
    const reloj = registro.reloj as Record<string, unknown>;
    if (
      typeof registro.uid !== 'string' ||
      !registro.uid ||
      (registro.tipo !== 'gratis' &&
        registro.tipo !== 'exento' &&
        registro.tipo !== 'prueba' &&
        registro.tipo !== 'pro') ||
      typeof registro.proyectoFirebase !== 'string' ||
      !registro.proyectoFirebase ||
      (registro.permiteMargen !== undefined && typeof registro.permiteMargen !== 'boolean') ||
      !Number.isSafeInteger(registro.horaServidor) ||
      (registro.horaServidor as number) < 0 ||
      !Number.isSafeInteger(registro.vencimiento) ||
      (registro.vencimiento as number) < 0 ||
      !Number.isSafeInteger(reloj.arranques) ||
      (reloj.arranques as number) < 0 ||
      !Number.isSafeInteger(reloj.milisegundosTranscurridos) ||
      (reloj.milisegundosTranscurridos as number) < 0
    )
      return null;
    return {
      uid: registro.uid,
      tipo: registro.tipo,
      ...(typeof registro.permiteMargen === 'boolean'
        ? { permiteMargen: registro.permiteMargen }
        : {}),
      proyectoFirebase: registro.proyectoFirebase,
      horaServidor: registro.horaServidor as number,
      vencimiento: registro.vencimiento as number,
      reloj: {
        arranques: reloj.arranques as number,
        milisegundosTranscurridos: reloj.milisegundosTranscurridos as number,
      },
    };
  } catch {
    return null;
  }
}

export async function guardarReferenciaSuscripcion(
  referencia: ReferenciaPersistida,
): Promise<void> {
  const valor = JSON.stringify(referencia);
  if (!interpretarReferenciaPersistida(valor))
    throw new Error('La referencia de suscripción no es válida.');
  await Preferences.set({ key: CLAVE_REFERENCIA, value: valor });
}

export async function leerReferenciaSuscripcion(
  uid: string,
  proyecto: string,
): Promise<ReferenciaPersistida | null> {
  const { value } = await Preferences.get({ key: CLAVE_REFERENCIA });
  const referencia = interpretarReferenciaPersistida(value);
  return referencia?.uid === uid && referencia.proyectoFirebase === proyecto ? referencia : null;
}

export async function eliminarReferenciaSuscripcion(): Promise<void> {
  await Preferences.remove({ key: CLAVE_REFERENCIA });
}
