import { Capacitor, registerPlugin } from '@capacitor/core';

export interface ReferenciaRelojAndroid {
  milisegundosTranscurridos: number;
  arranques: number;
}

const reloj = registerPlugin<{
  obtenerReferencia(): Promise<ReferenciaRelojAndroid>;
}>('RelojConfiable');

export async function obtenerReferenciaRelojAndroid(): Promise<ReferenciaRelojAndroid> {
  if (Capacitor.getPlatform() !== 'android') {
    throw new Error('El reloj confiable solo está disponible en Android.');
  }
  const referencia = await reloj.obtenerReferencia();
  if (
    !Number.isSafeInteger(referencia.arranques) ||
    referencia.arranques < 0 ||
    !Number.isSafeInteger(referencia.milisegundosTranscurridos) ||
    referencia.milisegundosTranscurridos < 0
  ) {
    throw new Error('La referencia del reloj no es válida.');
  }
  return referencia;
}

/** Devuelve null si el dispositivo se reinició o la referencia es incoherente. */
export function calcularTiempoTranscurrido(
  anterior: ReferenciaRelojAndroid,
  actual: ReferenciaRelojAndroid,
): number | null {
  if (
    !Number.isSafeInteger(anterior.arranques) ||
    !Number.isSafeInteger(actual.arranques) ||
    anterior.arranques < 0 ||
    anterior.arranques !== actual.arranques ||
    !Number.isSafeInteger(anterior.milisegundosTranscurridos) ||
    !Number.isSafeInteger(actual.milisegundosTranscurridos) ||
    anterior.milisegundosTranscurridos < 0 ||
    actual.milisegundosTranscurridos < anterior.milisegundosTranscurridos
  ) return null;
  return actual.milisegundosTranscurridos - anterior.milisegundosTranscurridos;
}
