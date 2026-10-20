export function esPorcentajeAdicionalMateriales(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
}

export function convertirEntradaPorcentajeAdicionalMateriales(entrada: unknown): number | null {
  if (esPorcentajeAdicionalMateriales(entrada)) {
    return entrada;
  }

  if (typeof entrada === 'string' && entrada.trim() !== '') {
    const porcentaje = Number(entrada);
    return esPorcentajeAdicionalMateriales(porcentaje) ? porcentaje : null;
  }

  return null;
}

export function exigirPorcentajeAdicionalMateriales(valor: unknown): number {
  if (!esPorcentajeAdicionalMateriales(valor)) {
    throw new RangeError('Ingresá un porcentaje adicional sobre materiales válido.');
  }

  return valor;
}
