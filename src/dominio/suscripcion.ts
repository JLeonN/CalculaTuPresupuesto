/** Estado confirmado por el servidor; nunca construirlo a partir de datos editables. */
export type EstadoSuscripcion =
  | { tipo: 'gratis' }
  | { tipo: 'pendiente' }
  | { tipo: 'prueba'; vencimiento: number }
  | { tipo: 'pro'; vencimiento: number; permiteMargen?: boolean }
  | { tipo: 'exento' };

export interface AccesoSuscripcion {
  puedeGenerarSalida: boolean;
  mostrarMarca: boolean;
  mostrarPublicidad: boolean;
}

/** La fecha debe proceder de una referencia confiable de la plataforma. */
export function resolverAccesoSuscripcion(
  estado: EstadoSuscripcion,
  fechaEvaluada: number,
): AccesoSuscripcion {
  const vigente =
    estado.tipo === 'exento' ||
    ((estado.tipo === 'prueba' || estado.tipo === 'pro') &&
      Number.isFinite(fechaEvaluada) &&
      Number.isFinite(estado.vencimiento) &&
      fechaEvaluada < estado.vencimiento);

  return {
    puedeGenerarSalida: vigente,
    mostrarMarca: !vigente,
    mostrarPublicidad: !vigente && estado.tipo !== 'pendiente',
  };
}
