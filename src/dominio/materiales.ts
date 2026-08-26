import { formatearImporte, MONEDA_INICIAL, type Moneda } from '@/dominio/monedas';

export const UNIDADES_MEDIDA = ['Unidad', 'Metro', 'Kilogramo', 'Litro', 'Rollo', 'Otro'] as const;
export const PRESENTACIONES = ['Caja', 'Paquete', 'Rollo', 'Bolsa', 'Bobina', 'Otro'] as const;

export type UnidadMedida = (typeof UNIDADES_MEDIDA)[number];
export type Presentacion = (typeof PRESENTACIONES)[number];
export type ModalidadPrecio = 'directo' | 'presentacion';
export type ValorVisiblePrecio = 'total' | 'unitario';

export interface DatosPrecioMaterial {
  id: string;
  comercio: string;
  moneda: Moneda;
  modalidad: ModalidadPrecio;
  importe: number | null;
  unidadMedida: UnidadMedida;
  unidadPersonalizada: string;
  presentacion: Presentacion;
  presentacionPersonalizada: string;
  cantidadContenido: number | null;
  precioCantidadParcial: number | null;
  valorVisible: ValorVisiblePrecio;
}

export interface PrecioMaterial extends DatosPrecioMaterial {
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DatosMaterial {
  nombre: string;
  precios: DatosPrecioMaterial[];
  idPrecioPredeterminado: string;
}

export interface Material extends Omit<DatosMaterial, 'precios'> {
  id: string;
  precios: PrecioMaterial[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

export function crearIdentificadorMaterial(): string {
  return crypto.randomUUID();
}

export function crearPrecioMaterial(moneda: Moneda = MONEDA_INICIAL): DatosPrecioMaterial {
  return {
    id: crearIdentificadorMaterial(),
    comercio: '',
    moneda,
    modalidad: 'directo',
    importe: null,
    unidadMedida: 'Unidad',
    unidadPersonalizada: '',
    presentacion: 'Caja',
    presentacionPersonalizada: '',
    cantidadContenido: null,
    precioCantidadParcial: null,
    valorVisible: 'unitario',
  };
}

export function calcularCostoUnitario(precio: DatosPrecioMaterial): number | null {
  if (
    precio.modalidad !== 'presentacion' ||
    precio.importe === null ||
    precio.importe <= 0 ||
    precio.cantidadContenido === null ||
    precio.cantidadContenido <= 0
  ) {
    return null;
  }

  return precio.importe / precio.cantidadContenido;
}

export function obtenerImporteVisible(precio: DatosPrecioMaterial): number {
  if (precio.modalidad === 'presentacion' && precio.valorVisible === 'unitario') {
    return precio.precioCantidadParcial ?? 0;
  }

  return precio.importe ?? 0;
}

export function obtenerUnidadVisible(precio: DatosPrecioMaterial): string {
  if (precio.modalidad === 'presentacion' && precio.valorVisible === 'total') {
    return obtenerPresentacion(precio).toLocaleLowerCase('es');
  }

  return obtenerUnidadMedida(precio).toLocaleLowerCase('es');
}

export function obtenerUnidadMedida(precio: DatosPrecioMaterial): string {
  return precio.unidadMedida === 'Otro'
    ? precio.unidadPersonalizada.trim() || 'unidad'
    : precio.unidadMedida;
}

export function obtenerPresentacion(precio: DatosPrecioMaterial): string {
  return precio.presentacion === 'Otro'
    ? precio.presentacionPersonalizada.trim() || 'presentación'
    : precio.presentacion;
}

export function formatearPrecioVisible(precio: DatosPrecioMaterial): string {
  return `${formatearImporte(obtenerImporteVisible(precio), precio.moneda)} por ${obtenerUnidadVisible(precio)}`;
}

export function obtenerPrecioPredeterminado(material: Material): PrecioMaterial | undefined {
  return (
    material.precios.find((precio) => precio.id === material.idPrecioPredeterminado) ??
    material.precios[0]
  );
}

export function crearMaterial(datos: DatosMaterial): Material {
  const ahora = new Date().toISOString();
  const datosNormalizados = normalizarDatosMaterial(datos);

  return {
    id: crearIdentificadorMaterial(),
    ...datosNormalizados,
    precios: datosNormalizados.precios.map((precio) => ({
      ...precio,
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
    })),
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
  };
}

export function actualizarMaterial(material: Material, datos: DatosMaterial): Material {
  const ahora = new Date().toISOString();
  const datosNormalizados = normalizarDatosMaterial(datos);

  return {
    ...material,
    ...datosNormalizados,
    precios: datosNormalizados.precios.map((precio) => {
      const precioAnterior = material.precios.find((actual) => actual.id === precio.id);
      return {
        ...precio,
        fechaCreacion: precioAnterior?.fechaCreacion ?? ahora,
        fechaActualizacion: ahora,
      };
    }),
    fechaActualizacion: ahora,
  };
}

export function normalizarDatosMaterial(datos: DatosMaterial): DatosMaterial {
  const precios = datos.precios.map((precio) => ({
    ...precio,
    comercio: precio.comercio.trim(),
    importe: normalizarNumero(precio.importe),
    unidadPersonalizada: precio.unidadPersonalizada.trim(),
    presentacionPersonalizada: precio.presentacionPersonalizada.trim(),
    cantidadContenido:
      precio.modalidad === 'presentacion' ? normalizarNumero(precio.cantidadContenido) : null,
    precioCantidadParcial:
      precio.modalidad === 'presentacion' ? normalizarNumero(precio.precioCantidadParcial) : null,
    valorVisible: precio.modalidad === 'directo' ? 'unitario' : precio.valorVisible,
  }));
  const idPrecioPredeterminado = precios.some(
    (precio) => precio.id === datos.idPrecioPredeterminado,
  )
    ? datos.idPrecioPredeterminado
    : (precios[0]?.id ?? '');

  return {
    nombre: datos.nombre.trim(),
    precios,
    idPrecioPredeterminado,
  };
}

function normalizarNumero(valor: number | null): number | null {
  if (valor === null || !Number.isFinite(Number(valor))) {
    return null;
  }

  return Number(valor);
}
