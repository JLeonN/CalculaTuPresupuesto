import type { DatosPresupuesto, LineaPresupuesto, Presupuesto } from '@/dominio/presupuestos';

export interface CambiosMaterialListaCompras {
  comprado?: boolean;
  nombre?: string;
  cantidad?: number | null;
  precioUnitario?: number | null;
}

export function obtenerMaterialesListaCompras(
  lineas: readonly LineaPresupuesto[],
): LineaPresupuesto[] {
  return [
    ...lineas.filter((linea) => linea.tipo === 'material' && !linea.comprado),
    ...lineas.filter((linea) => linea.tipo === 'material' && linea.comprado),
  ];
}

export function crearDatosPresupuestoConMaterialActualizado(
  presupuesto: Presupuesto,
  idLinea: string,
  cambios: CambiosMaterialListaCompras,
): DatosPresupuesto {
  const claves = Object.keys(cambios) as (keyof CambiosMaterialListaCompras)[];
  if (
    claves.length === 0 ||
    claves.some((clave) => !['comprado', 'nombre', 'cantidad', 'precioUnitario'].includes(clave))
  ) {
    throw new Error('No hay cambios válidos para guardar en el material.');
  }
  if ('comprado' in cambios && typeof cambios.comprado !== 'boolean') {
    throw new Error('El estado de compra debe ser verdadero o falso.');
  }
  if ('nombre' in cambios && (typeof cambios.nombre !== 'string' || !cambios.nombre.trim())) {
    throw new Error('El nombre del material no puede estar vacío.');
  }
  for (const campo of ['cantidad', 'precioUnitario'] as const) {
    if (
      campo in cambios &&
      cambios[campo] !== null &&
      (typeof cambios[campo] !== 'number' || !Number.isFinite(cambios[campo]) || cambios[campo] < 0)
    ) {
      throw new Error(
        `El valor de ${campo === 'cantidad' ? 'cantidad' : 'precio'} debe ser un número no negativo.`,
      );
    }
  }

  const lineaActual = presupuesto.lineas.find((linea) => linea.id === idLinea);
  if (!lineaActual || lineaActual.tipo !== 'material') {
    throw new Error('El material que intentás actualizar no existe en este presupuesto.');
  }

  return {
    destinatario: { ...presupuesto.destinatario },
    fechaPresupuesto: presupuesto.fechaPresupuesto,
    moneda: presupuesto.moneda,
    porcentajeAdicionalMateriales: presupuesto.porcentajeAdicionalMateriales,
    formatoDocumento: presupuesto.formatoDocumento,
    configuracionDocumento: presupuesto.configuracionDocumento,
    lineas: presupuesto.lineas.map((linea) =>
      linea.id === idLinea
        ? { ...linea, ...cambios, nombre: cambios.nombre?.trim() ?? linea.nombre }
        : linea,
    ),
  };
}
