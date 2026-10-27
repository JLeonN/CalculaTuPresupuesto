import {
  crearIdentificadorMaterial,
  obtenerPresentacion,
  obtenerPrecioPredeterminado,
  obtenerUnidadMedida,
  type Material,
  type PrecioMaterial,
} from '@/dominio/materiales';
import { esMoneda, MONEDA_INICIAL, type Moneda } from '@/dominio/monedas';
import {
  esPorcentajeAdicionalMateriales,
  exigirPorcentajeAdicionalMateriales,
} from '@/dominio/porcentajeAdicionalMateriales';
import type {
  Configuracion,
  LogoConfiguracion,
  MetodoPagoConfiguracion,
  RedSocialConfiguracion,
} from '@/dominio/configuracion';

export const TIPOS_DESTINATARIO = ['potencial', 'guardado'] as const;
export const TIPOS_CONCEPTO_PRESUPUESTO = ['material', 'manoObra', 'traslado'] as const;
export const ORIGENES_LINEA_PRESUPUESTO = ['predefinido', 'catalogo', 'manual'] as const;
export const ESTADOS_PRESUPUESTO = ['pendiente', 'aceptado', 'rechazado'] as const;
export const FORMATOS_DOCUMENTO_PRESUPUESTO = ['completo', 'resumido'] as const;
const FACTOR_REDONDEO_IMPORTES = 100;

export type TipoDestinatario = (typeof TIPOS_DESTINATARIO)[number];
export type TipoConceptoPresupuesto = (typeof TIPOS_CONCEPTO_PRESUPUESTO)[number];
export type OrigenLineaPresupuesto = (typeof ORIGENES_LINEA_PRESUPUESTO)[number];
export type EstadoPresupuesto = (typeof ESTADOS_PRESUPUESTO)[number];
export type FormatoDocumentoPresupuesto = (typeof FORMATOS_DOCUMENTO_PRESUPUESTO)[number];

export function esFormatoDocumentoPresupuesto(
  valor: unknown,
): valor is FormatoDocumentoPresupuesto {
  return FORMATOS_DOCUMENTO_PRESUPUESTO.some((formato) => formato === valor);
}

export interface OpcionUnidadPresupuesto {
  unidad: string;
  precioUnitario: number | null;
}

export interface OpcionPrecioPresupuesto {
  id: string;
  moneda: Moneda;
  unidad: string;
  precioUnitario: number | null;
  opcionesUnidad: OpcionUnidadPresupuesto[];
}

export interface LineaPresupuesto {
  id: string;
  tipo: TipoConceptoPresupuesto;
  comprado: boolean;
  origen: OrigenLineaPresupuesto;
  idMaterial: string | null;
  nombre: string;
  cantidad: number | null;
  unidad: string;
  opcionesUnidad: OpcionUnidadPresupuesto[];
  opcionesPrecio: OpcionPrecioPresupuesto[];
  idPrecioSeleccionado: string | null;
  precioUnitario: number | null;
  moneda: Moneda;
}

export interface DatosDestinatarioPresupuesto {
  tipo: TipoDestinatario;
  idCliente: string | null;
  nombre: string;
  telefono: string;
}

export interface ConfiguracionDocumentoPresupuesto {
  nombreEmpresa: string;
  nombreResponsable: string;
  telefono: string;
  correo: string;
  direccion: string;
  rut: string;
  logo: LogoConfiguracion | null;
  mensajeFinal: string;
  metodosPago: MetodoPagoConfiguracion[];
  redesSociales: RedSocialConfiguracion[];
}

export interface ValoresInicialesPresupuesto {
  nombreManoObra?: string | undefined;
  precioManoObraHora?: number | null | undefined;
  precioTrasladoKilometro?: number | null | undefined;
}

export interface DatosPresupuesto {
  destinatario: DatosDestinatarioPresupuesto;
  fechaPresupuesto: string;
  moneda: Moneda;
  porcentajeAdicionalMateriales: number;
  formatoDocumento: FormatoDocumentoPresupuesto;
  lineas: LineaPresupuesto[];
  configuracionDocumento: ConfiguracionDocumentoPresupuesto | null;
}

export interface Presupuesto extends DatosPresupuesto {
  id: string;
  estado: EstadoPresupuesto;
  fechaCambioEstado: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export function crearLineasInicialesPresupuesto(
  moneda: Moneda = MONEDA_INICIAL,
  valores: ValoresInicialesPresupuesto = {},
): LineaPresupuesto[] {
  return [
    crearLineaPredefinida(
      'manoObra',
      valores.nombreManoObra?.trim() || 'Mano de obra',
      'Hora',
      valores.precioManoObraHora,
      moneda,
    ),
    crearLineaPredefinida(
      'traslado',
      'Traslado',
      'Kilómetro',
      valores.precioTrasladoKilometro,
      moneda,
    ),
  ];
}

export function crearPresupuesto(datos: DatosPresupuesto): Presupuesto {
  const ahora = new Date().toISOString();

  return {
    id: crearIdentificadorMaterial(),
    ...normalizarDatosPresupuesto(datos),
    estado: 'pendiente',
    fechaCambioEstado: null,
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
  };
}

export function actualizarPresupuesto(
  presupuesto: Presupuesto,
  datos: DatosPresupuesto,
): Presupuesto {
  return {
    ...presupuesto,
    ...normalizarDatosPresupuesto(datos),
    fechaActualizacion: new Date().toISOString(),
  };
}

export function actualizarEstadoPresupuesto(
  presupuesto: Presupuesto,
  estado: EstadoPresupuesto,
): Presupuesto {
  if (presupuesto.estado === estado) {
    return presupuesto;
  }

  const ahora = new Date().toISOString();

  return {
    ...presupuesto,
    estado,
    fechaCambioEstado: estado === 'pendiente' ? null : ahora,
    fechaActualizacion: ahora,
  };
}

export function normalizarDatosPresupuesto(datos: DatosPresupuesto): DatosPresupuesto {
  return {
    destinatario: {
      tipo: datos.destinatario.tipo,
      idCliente: datos.destinatario.idCliente,
      nombre: datos.destinatario.nombre.trim(),
      telefono: datos.destinatario.telefono.trim(),
    },
    fechaPresupuesto: datos.fechaPresupuesto.trim(),
    moneda: esMoneda(datos.moneda) ? datos.moneda : MONEDA_INICIAL,
    porcentajeAdicionalMateriales: exigirPorcentajeAdicionalMateriales(
      datos.porcentajeAdicionalMateriales,
    ),
    formatoDocumento: esFormatoDocumentoPresupuesto(datos.formatoDocumento)
      ? datos.formatoDocumento
      : 'completo',
    lineas: datos.lineas.map(normalizarLineaPresupuesto),
    configuracionDocumento: datos.configuracionDocumento
      ? clonarConfiguracionDocumento(datos.configuracionDocumento)
      : null,
  };
}

export function crearConfiguracionDocumento(
  configuracion: Configuracion,
): ConfiguracionDocumentoPresupuesto {
  return clonarConfiguracionDocumento({
    nombreEmpresa: configuracion.nombreEmpresa,
    nombreResponsable: configuracion.nombreResponsable,
    telefono: configuracion.telefono,
    correo: configuracion.correo,
    direccion: configuracion.direccion,
    rut: configuracion.rut,
    logo: configuracion.logo,
    mensajeFinal: configuracion.mensajeFinal,
    metodosPago: configuracion.metodosPago,
    redesSociales: configuracion.redesSociales,
  });
}

export function clonarLineasPresupuesto(lineas: readonly LineaPresupuesto[]): LineaPresupuesto[] {
  return lineas.map((linea) => ({
    ...linea,
    opcionesUnidad: linea.opcionesUnidad.map((opcion) => ({ ...opcion })),
    opcionesPrecio: linea.opcionesPrecio.map((opcion) => ({
      ...opcion,
      opcionesUnidad: opcion.opcionesUnidad.map((unidad) => ({ ...unidad })),
    })),
  }));
}

export function recuperarPresupuestoGuardado(valor: unknown): Presupuesto | null {
  if (!esRegistro(valor) || typeof valor.id !== 'string' || !Array.isArray(valor.lineas)) {
    return null;
  }
  if (
    (valor.moneda !== undefined && !esMoneda(valor.moneda)) ||
    (valor.estado !== undefined && !esEstadoPresupuesto(valor.estado)) ||
    (valor.fechaPresupuesto !== undefined && typeof valor.fechaPresupuesto !== 'string') ||
    (valor.fechaCreacion !== undefined && typeof valor.fechaCreacion !== 'string') ||
    (valor.fechaActualizacion !== undefined && typeof valor.fechaActualizacion !== 'string') ||
    (valor.fechaCambioEstado !== undefined &&
      valor.fechaCambioEstado !== null &&
      (typeof valor.fechaCambioEstado !== 'string' ||
        Number.isNaN(Date.parse(valor.fechaCambioEstado))))
  )
    return null;

  const destinatario = recuperarDestinatario(valor.destinatario);
  const lineas = valor.lineas.map(recuperarLineaPresupuesto).filter(esLineaRecuperada);
  const configuracionDocumento = recuperarConfiguracionDocumento(valor.configuracionDocumento);

  if (
    destinatario === null ||
    lineas.length !== valor.lineas.length ||
    (valor.configuracionDocumento !== undefined &&
      valor.configuracionDocumento !== null &&
      configuracionDocumento === null)
  ) {
    return null;
  }

  const porcentajeAdicionalMateriales =
    valor.porcentajeAdicionalMateriales === undefined ? 0 : valor.porcentajeAdicionalMateriales;
  if (!esPorcentajeAdicionalMateriales(porcentajeAdicionalMateriales)) {
    return null;
  }

  const formatoDocumento =
    valor.formatoDocumento === undefined ? 'completo' : valor.formatoDocumento;
  if (!esFormatoDocumentoPresupuesto(formatoDocumento)) {
    return null;
  }

  const ahora = new Date().toISOString();
  const estado = esEstadoPresupuesto(valor.estado) ? valor.estado : 'pendiente';

  return {
    id: valor.id,
    destinatario,
    fechaPresupuesto: obtenerTexto(valor.fechaPresupuesto),
    moneda: esMoneda(valor.moneda) ? valor.moneda : MONEDA_INICIAL,
    porcentajeAdicionalMateriales,
    formatoDocumento,
    lineas,
    configuracionDocumento,
    estado,
    fechaCambioEstado: recuperarFechaCambioEstado(valor.fechaCambioEstado, estado),
    fechaCreacion: obtenerTexto(valor.fechaCreacion) || ahora,
    fechaActualizacion: obtenerTexto(valor.fechaActualizacion) || ahora,
  };
}

export function esPresupuestoGuardado(valor: unknown): valor is Presupuesto {
  if (!esRegistro(valor)) {
    return false;
  }

  return (
    typeof valor.id === 'string' &&
    valor.id.trim() !== '' &&
    typeof valor.fechaPresupuesto === 'string' &&
    valor.fechaPresupuesto.trim() !== '' &&
    esMoneda(valor.moneda) &&
    esPorcentajeAdicionalMateriales(valor.porcentajeAdicionalMateriales) &&
    esFormatoDocumentoPresupuesto(valor.formatoDocumento) &&
    esDestinatarioGuardado(valor.destinatario) &&
    Array.isArray(valor.lineas) &&
    valor.lineas.every(esLineaPresupuestoGuardada) &&
    new Set(valor.lineas.map((linea: LineaPresupuesto) => linea.id)).size === valor.lineas.length &&
    (valor.configuracionDocumento === null ||
      esConfiguracionDocumentoGuardada(valor.configuracionDocumento)) &&
    esEstadoPresupuesto(valor.estado) &&
    (valor.fechaCambioEstado === null || typeof valor.fechaCambioEstado === 'string') &&
    typeof valor.fechaCreacion === 'string' &&
    valor.fechaCreacion.trim() !== '' &&
    typeof valor.fechaActualizacion === 'string' &&
    valor.fechaActualizacion.trim() !== ''
  );
}

export function crearLineaMaterialManual(
  nombre: string,
  moneda: Moneda = MONEDA_INICIAL,
): LineaPresupuesto {
  return {
    id: crearIdentificadorMaterial(),
    tipo: 'material',
    comprado: false,
    origen: 'manual',
    idMaterial: null,
    nombre: nombre.trim(),
    cantidad: 1,
    unidad: 'Unidad',
    opcionesUnidad: [],
    opcionesPrecio: [],
    idPrecioSeleccionado: null,
    precioUnitario: null,
    moneda,
  };
}

export function crearLineaManoObra(moneda: Moneda = MONEDA_INICIAL): LineaPresupuesto {
  return {
    ...crearLineaPredefinida('manoObra', '', 'Hora', 0, moneda),
    origen: 'manual',
  };
}

export function crearLineaDesdeMaterial(
  material: Material,
  monedaPredeterminada: Moneda = MONEDA_INICIAL,
): LineaPresupuesto {
  const precio = obtenerPrecioPredeterminado(material);
  const opcionesUnidad = precio ? crearOpcionesUnidad(precio) : [];
  const opcionPredeterminada = precio
    ? obtenerOpcionPredeterminada(precio, opcionesUnidad)
    : undefined;
  const opcionesPrecio = material.precios.map((opcionPrecio) => {
    const unidades = crearOpcionesUnidad(opcionPrecio);
    const opcionVisible = obtenerOpcionPredeterminada(opcionPrecio, unidades);
    return {
      id: opcionPrecio.id,
      moneda: opcionPrecio.moneda,
      unidad: opcionVisible?.unidad ?? 'Unidad',
      precioUnitario: opcionVisible?.precioUnitario ?? null,
      opcionesUnidad: unidades,
    };
  });

  return {
    id: crearIdentificadorMaterial(),
    tipo: 'material',
    comprado: false,
    origen: 'catalogo',
    idMaterial: material.id,
    nombre: material.nombre,
    cantidad: 1,
    unidad: opcionPredeterminada?.unidad ?? 'Unidad',
    opcionesUnidad,
    opcionesPrecio,
    idPrecioSeleccionado: precio?.id ?? null,
    precioUnitario: opcionPredeterminada?.precioUnitario ?? null,
    moneda: precio?.moneda ?? monedaPredeterminada,
  };
}

export function confirmarConversionManualLinea(
  linea: LineaPresupuesto,
  monedaDestino: Moneda,
): LineaPresupuesto {
  return {
    ...linea,
    origen: linea.origen === 'catalogo' ? 'manual' : linea.origen,
    idMaterial: linea.origen === 'catalogo' ? null : linea.idMaterial,
    opcionesUnidad: [],
    opcionesPrecio: [],
    idPrecioSeleccionado: null,
    moneda: monedaDestino,
  };
}

export function calcularSubtotalLinea(linea: LineaPresupuesto): number {
  const precio = normalizarNumeroNoNegativo(linea.precioUnitario);
  return precio * normalizarNumeroNoNegativo(linea.cantidad);
}

function redondearImporteCliente(importe: number): number {
  return (
    Math.round((importe + Number.EPSILON) * FACTOR_REDONDEO_IMPORTES) / FACTOR_REDONDEO_IMPORTES
  );
}

export function calcularPrecioMaterialCliente(
  linea: LineaPresupuesto,
  porcentajeAdicionalMateriales: number,
): number {
  exigirPorcentajeAdicionalMateriales(porcentajeAdicionalMateriales);
  const precioReal = normalizarNumeroNoNegativo(linea.precioUnitario);
  return porcentajeAdicionalMateriales === 0
    ? precioReal
    : redondearImporteCliente(precioReal * (1 + porcentajeAdicionalMateriales / 100));
}

export function calcularSubtotalMaterialCliente(
  linea: LineaPresupuesto,
  porcentajeAdicionalMateriales: number,
): number {
  exigirPorcentajeAdicionalMateriales(porcentajeAdicionalMateriales);
  return porcentajeAdicionalMateriales === 0
    ? calcularSubtotalLinea(linea)
    : redondearImporteCliente(
        calcularPrecioMaterialCliente(linea, porcentajeAdicionalMateriales) *
          normalizarNumeroNoNegativo(linea.cantidad),
      );
}

export function lineaTieneMonedaCompatible(
  linea: LineaPresupuesto,
  monedaPresupuesto: Moneda,
): boolean {
  return linea.moneda === monedaPresupuesto;
}

export function calcularTotalPresupuesto(
  lineas: readonly LineaPresupuesto[],
  monedaPresupuesto: Moneda,
  porcentajeAdicionalMateriales: number,
): number {
  exigirPorcentajeAdicionalMateriales(porcentajeAdicionalMateriales);
  return lineas.reduce((total, linea) => {
    if (!lineaTieneMonedaCompatible(linea, monedaPresupuesto)) {
      return total;
    }

    return (
      total +
      (linea.tipo === 'material'
        ? calcularSubtotalMaterialCliente(linea, porcentajeAdicionalMateriales)
        : calcularSubtotalLinea(linea))
    );
  }, 0);
}

export function calcularTotalManoObraYTraslado(
  lineas: readonly LineaPresupuesto[],
  monedaPresupuesto: Moneda,
): number {
  return calcularTotalPorTiposConcepto(lineas, monedaPresupuesto, ['manoObra', 'traslado']);
}

export function calcularTotalMateriales(
  lineas: readonly LineaPresupuesto[],
  monedaPresupuesto: Moneda,
  porcentajeAdicionalMateriales: number,
): number {
  exigirPorcentajeAdicionalMateriales(porcentajeAdicionalMateriales);
  return lineas.reduce(
    (total, linea) =>
      linea.tipo === 'material' && lineaTieneMonedaCompatible(linea, monedaPresupuesto)
        ? total + calcularSubtotalMaterialCliente(linea, porcentajeAdicionalMateriales)
        : total,
    0,
  );
}

export function lineaTienePrecioPendiente(linea: LineaPresupuesto): boolean {
  return linea.precioUnitario === null || !Number.isFinite(Number(linea.precioUnitario));
}

function crearLineaPredefinida(
  tipo: Exclude<TipoConceptoPresupuesto, 'material'>,
  nombre: string,
  unidad: string,
  precioUnitario: number | null | undefined,
  moneda: Moneda,
): LineaPresupuesto {
  return {
    id: crearIdentificadorMaterial(),
    tipo,
    comprado: false,
    origen: 'predefinido',
    idMaterial: null,
    nombre,
    cantidad: 0,
    unidad,
    opcionesUnidad: [],
    opcionesPrecio: [],
    idPrecioSeleccionado: null,
    precioUnitario: precioUnitario ?? 0,
    moneda,
  };
}

function calcularTotalPorTiposConcepto(
  lineas: readonly LineaPresupuesto[],
  monedaPresupuesto: Moneda,
  tiposIncluidos: readonly TipoConceptoPresupuesto[],
): number {
  return lineas.reduce((total, linea) => {
    if (
      !tiposIncluidos.includes(linea.tipo) ||
      !lineaTieneMonedaCompatible(linea, monedaPresupuesto)
    ) {
      return total;
    }

    return total + calcularSubtotalLinea(linea);
  }, 0);
}

function crearOpcionesUnidad(precio: PrecioMaterial): OpcionUnidadPresupuesto[] {
  if (precio.modalidad === 'directo') {
    return [
      {
        unidad: obtenerUnidadMedida(precio),
        precioUnitario: precio.importe,
      },
    ];
  }

  const opciones = [
    {
      unidad: obtenerPresentacion(precio),
      precioUnitario: precio.importe,
    },
    {
      unidad: obtenerUnidadMedida(precio),
      precioUnitario: precio.precioCantidadParcial,
    },
  ];

  return opciones.filter(
    (opcion, indice) =>
      opciones.findIndex(
        (actual) => actual.unidad.toLocaleLowerCase('es') === opcion.unidad.toLocaleLowerCase('es'),
      ) === indice,
  );
}

function obtenerOpcionPredeterminada(
  precio: PrecioMaterial,
  opciones: OpcionUnidadPresupuesto[],
): OpcionUnidadPresupuesto | undefined {
  if (precio.modalidad === 'directo' || precio.valorVisible === 'total') {
    return opciones[0];
  }

  return opciones[1] ?? opciones[0];
}

function normalizarNumeroNoNegativo(valor: number | null): number {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

function normalizarLineaPresupuesto(linea: LineaPresupuesto): LineaPresupuesto {
  return {
    ...linea,
    comprado: linea.tipo === 'material' && linea.comprado === true,
    nombre: linea.nombre.trim(),
    cantidad: normalizarNumeroEditable(linea.cantidad, 0),
    precioUnitario: normalizarNumeroEditable(linea.precioUnitario, null),
    opcionesUnidad: linea.opcionesUnidad.map((opcion) => ({
      unidad: opcion.unidad.trim(),
      precioUnitario: normalizarNumeroEditable(opcion.precioUnitario, null),
    })),
    opcionesPrecio: linea.opcionesPrecio.map((opcion) => ({
      ...opcion,
      precioUnitario: normalizarNumeroEditable(opcion.precioUnitario, null),
      opcionesUnidad: opcion.opcionesUnidad.map((unidad) => ({
        unidad: unidad.unidad.trim(),
        precioUnitario: normalizarNumeroEditable(unidad.precioUnitario, null),
      })),
    })),
  };
}

function clonarConfiguracionDocumento(
  configuracion: ConfiguracionDocumentoPresupuesto,
): ConfiguracionDocumentoPresupuesto {
  return {
    nombreEmpresa: configuracion.nombreEmpresa.trim(),
    nombreResponsable: configuracion.nombreResponsable.trim(),
    telefono: configuracion.telefono.trim(),
    correo: configuracion.correo.trim(),
    direccion: configuracion.direccion.trim(),
    rut: configuracion.rut.trim(),
    logo: configuracion.logo ? { ...configuracion.logo } : null,
    mensajeFinal: configuracion.mensajeFinal.trim(),
    metodosPago: configuracion.metodosPago.map((metodo) => ({ ...metodo })),
    redesSociales: configuracion.redesSociales.map((redSocial) => ({ ...redSocial })),
  };
}

function recuperarConfiguracionDocumento(valor: unknown): ConfiguracionDocumentoPresupuesto | null {
  if (!esRegistro(valor)) {
    return null;
  }

  const logo = recuperarLogoConfiguracion(valor.logo);
  const metodosPago = recuperarMetodosPago(valor.metodosPago);
  const redesSociales = recuperarRedesSociales(valor.redesSociales);

  if (logo === undefined || metodosPago === null || redesSociales === null) {
    return null;
  }

  return clonarConfiguracionDocumento({
    nombreEmpresa: obtenerTexto(valor.nombreEmpresa),
    nombreResponsable: obtenerTexto(valor.nombreResponsable),
    telefono: obtenerTexto(valor.telefono),
    correo: obtenerTexto(valor.correo),
    direccion: obtenerTexto(valor.direccion),
    rut: obtenerTexto(valor.rut),
    logo,
    mensajeFinal: obtenerTexto(valor.mensajeFinal),
    metodosPago,
    redesSociales,
  });
}

function recuperarLogoConfiguracion(valor: unknown): LogoConfiguracion | null | undefined {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (
    !esRegistro(valor) ||
    typeof valor.nombre !== 'string' ||
    typeof valor.tipoMime !== 'string' ||
    typeof valor.datosUrl !== 'string' ||
    !valor.datosUrl.startsWith('data:image/')
  ) {
    return undefined;
  }

  return {
    nombre: valor.nombre,
    tipoMime: valor.tipoMime,
    datosUrl: valor.datosUrl,
  };
}

function recuperarMetodosPago(valor: unknown): MetodoPagoConfiguracion[] | null {
  if (!Array.isArray(valor)) {
    return null;
  }

  const metodosPago = valor
    .filter(
      (metodo) =>
        esRegistro(metodo) &&
        typeof metodo.id === 'string' &&
        typeof metodo.nombre === 'string' &&
        typeof metodo.numeroCuenta === 'string',
    )
    .map((metodo) => ({
      id: String(metodo.id),
      nombre: String(metodo.nombre),
      numeroCuenta: String(metodo.numeroCuenta),
    }));

  return metodosPago.length === valor.length ? metodosPago : null;
}

function recuperarRedesSociales(valor: unknown): RedSocialConfiguracion[] | null {
  if (!Array.isArray(valor)) {
    return null;
  }

  const redesSociales = valor
    .filter(
      (redSocial) =>
        esRegistro(redSocial) &&
        typeof redSocial.id === 'string' &&
        typeof redSocial.red === 'string' &&
        typeof redSocial.usuarioOEnlace === 'string',
    )
    .map((redSocial) => ({
      id: String(redSocial.id),
      red: String(redSocial.red),
      usuarioOEnlace: String(redSocial.usuarioOEnlace),
    }));

  return redesSociales.length === valor.length ? redesSociales : null;
}

function recuperarDestinatario(valor: unknown): DatosDestinatarioPresupuesto | null {
  if (
    !esRegistro(valor) ||
    (valor.tipo !== undefined && valor.tipo !== 'guardado' && valor.tipo !== 'potencial') ||
    (valor.idCliente !== undefined &&
      valor.idCliente !== null &&
      typeof valor.idCliente !== 'string') ||
    (valor.nombre !== undefined && typeof valor.nombre !== 'string') ||
    (valor.telefono !== undefined && typeof valor.telefono !== 'string')
  ) {
    return null;
  }

  return {
    tipo: valor.tipo === 'guardado' ? 'guardado' : 'potencial',
    idCliente: typeof valor.idCliente === 'string' ? valor.idCliente : null,
    nombre: obtenerTexto(valor.nombre).trim(),
    telefono: obtenerTexto(valor.telefono).trim(),
  };
}

function recuperarLineaPresupuesto(valor: unknown): LineaPresupuesto | null {
  if (!esRegistro(valor)) {
    return null;
  }

  const tipo = valor.tipo === 'nafta' ? 'traslado' : valor.tipo;
  if (!esTipoConceptoPresupuesto(tipo)) {
    return null;
  }

  if (
    (valor.id !== undefined && typeof valor.id !== 'string') ||
    (valor.comprado !== undefined && typeof valor.comprado !== 'boolean') ||
    (valor.origen !== undefined && !esOrigenLineaPresupuesto(valor.origen)) ||
    (valor.idMaterial !== undefined &&
      valor.idMaterial !== null &&
      typeof valor.idMaterial !== 'string') ||
    (valor.nombre !== undefined && typeof valor.nombre !== 'string') ||
    (valor.unidad !== undefined && typeof valor.unidad !== 'string') ||
    (valor.idPrecioSeleccionado !== undefined &&
      valor.idPrecioSeleccionado !== null &&
      typeof valor.idPrecioSeleccionado !== 'string') ||
    (valor.opcionesUnidad !== undefined && !Array.isArray(valor.opcionesUnidad)) ||
    (valor.opcionesPrecio !== undefined && !Array.isArray(valor.opcionesPrecio)) ||
    !esNumeroEditableRecuperable(valor.cantidad) ||
    !esNumeroEditableRecuperable(valor.precioUnitario) ||
    (valor.moneda !== undefined && !esMoneda(valor.moneda))
  )
    return null;

  const opcionesUnidadRecuperadas = Array.isArray(valor.opcionesUnidad)
    ? valor.opcionesUnidad.map(recuperarOpcionUnidad)
    : [];
  const opcionesPrecioRecuperadas = Array.isArray(valor.opcionesPrecio)
    ? valor.opcionesPrecio.map(recuperarOpcionPrecio)
    : [];
  if (
    opcionesUnidadRecuperadas.some((opcion) => opcion === null) ||
    opcionesPrecioRecuperadas.some((opcion) => opcion === null)
  )
    return null;
  const opcionesUnidad = opcionesUnidadRecuperadas.filter(esOpcionRecuperada);
  const opcionesPrecio = opcionesPrecioRecuperadas.filter(
    (opcion): opcion is OpcionPrecioPresupuesto => opcion !== null,
  );

  return {
    id: typeof valor.id === 'string' ? valor.id : crearIdentificadorMaterial(),
    tipo,
    comprado: tipo === 'material' && valor.comprado === true,
    origen: esOrigenLineaPresupuesto(valor.origen) ? valor.origen : 'manual',
    idMaterial: typeof valor.idMaterial === 'string' ? valor.idMaterial : null,
    nombre: obtenerTexto(valor.nombre).trim(),
    cantidad: normalizarNumeroEditable(valor.cantidad, 0),
    unidad: obtenerTexto(valor.unidad).trim() || 'Unidad',
    opcionesUnidad,
    opcionesPrecio,
    idPrecioSeleccionado:
      typeof valor.idPrecioSeleccionado === 'string' ? valor.idPrecioSeleccionado : null,
    precioUnitario: normalizarNumeroEditable(valor.precioUnitario, null),
    moneda: esMoneda(valor.moneda) ? valor.moneda : MONEDA_INICIAL,
  };
}

function recuperarOpcionUnidad(valor: unknown): OpcionUnidadPresupuesto | null {
  if (!esRegistro(valor) || !esNumeroEditableRecuperable(valor.precioUnitario)) {
    return null;
  }

  const unidad = obtenerTexto(valor.unidad).trim();
  if (unidad === '') {
    return null;
  }

  return {
    unidad,
    precioUnitario: normalizarNumeroEditable(valor.precioUnitario, null),
  };
}

function recuperarOpcionPrecio(valor: unknown): OpcionPrecioPresupuesto | null {
  if (
    !esRegistro(valor) ||
    typeof valor.id !== 'string' ||
    (valor.moneda !== undefined && !esMoneda(valor.moneda)) ||
    !esNumeroEditableRecuperable(valor.precioUnitario) ||
    (valor.unidad !== undefined && typeof valor.unidad !== 'string') ||
    (valor.opcionesUnidad !== undefined && !Array.isArray(valor.opcionesUnidad))
  ) {
    return null;
  }

  const opcionesUnidadRecuperadas = Array.isArray(valor.opcionesUnidad)
    ? valor.opcionesUnidad.map(recuperarOpcionUnidad)
    : [];
  if (opcionesUnidadRecuperadas.some((opcion) => opcion === null)) return null;
  const opcionesUnidad = opcionesUnidadRecuperadas.filter(esOpcionRecuperada);

  return {
    id: valor.id,
    moneda: esMoneda(valor.moneda) ? valor.moneda : MONEDA_INICIAL,
    unidad: obtenerTexto(valor.unidad).trim() || 'Unidad',
    precioUnitario: normalizarNumeroEditable(valor.precioUnitario, null),
    opcionesUnidad,
  };
}

function esNumeroEditableRecuperable(valor: unknown): boolean {
  if (valor === null || valor === undefined || valor === '') return true;
  if (typeof valor !== 'number' && typeof valor !== 'string') return false;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0;
}

function normalizarNumeroEditable(valor: unknown, valorVacio: number | null): number | null {
  if (valor === null || valor === undefined || valor === '') {
    return valorVacio;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : valorVacio;
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esDestinatarioGuardado(valor: unknown): valor is DatosDestinatarioPresupuesto {
  return (
    esRegistro(valor) &&
    (valor.tipo === 'potencial' || valor.tipo === 'guardado') &&
    (valor.idCliente === null || typeof valor.idCliente === 'string') &&
    typeof valor.nombre === 'string' &&
    typeof valor.telefono === 'string'
  );
}

function esLineaPresupuestoGuardada(valor: unknown): valor is LineaPresupuesto {
  return (
    esRegistro(valor) &&
    typeof valor.id === 'string' &&
    valor.id.trim() !== '' &&
    TIPOS_CONCEPTO_PRESUPUESTO.some((tipo) => tipo === valor.tipo) &&
    typeof valor.comprado === 'boolean' &&
    ORIGENES_LINEA_PRESUPUESTO.some((origen) => origen === valor.origen) &&
    (valor.idMaterial === null || typeof valor.idMaterial === 'string') &&
    typeof valor.nombre === 'string' &&
    esNumeroOpcional(valor.cantidad) &&
    typeof valor.unidad === 'string' &&
    Array.isArray(valor.opcionesUnidad) &&
    valor.opcionesUnidad.every(esOpcionUnidadGuardada) &&
    Array.isArray(valor.opcionesPrecio) &&
    valor.opcionesPrecio.every(esOpcionPrecioGuardada) &&
    new Set(valor.opcionesPrecio.map((opcion: OpcionPrecioPresupuesto) => opcion.id)).size ===
      valor.opcionesPrecio.length &&
    (valor.idPrecioSeleccionado === null || typeof valor.idPrecioSeleccionado === 'string') &&
    esNumeroOpcional(valor.precioUnitario) &&
    esMoneda(valor.moneda)
  );
}

function esOpcionUnidadGuardada(valor: unknown): valor is OpcionUnidadPresupuesto {
  return (
    esRegistro(valor) &&
    typeof valor.unidad === 'string' &&
    valor.unidad.trim() !== '' &&
    esNumeroOpcional(valor.precioUnitario)
  );
}

function esOpcionPrecioGuardada(valor: unknown): valor is OpcionPrecioPresupuesto {
  return (
    esRegistro(valor) &&
    typeof valor.id === 'string' &&
    valor.id.trim() !== '' &&
    esMoneda(valor.moneda) &&
    typeof valor.unidad === 'string' &&
    esNumeroOpcional(valor.precioUnitario) &&
    Array.isArray(valor.opcionesUnidad) &&
    valor.opcionesUnidad.every(esOpcionUnidadGuardada)
  );
}

function esConfiguracionDocumentoGuardada(
  valor: unknown,
): valor is ConfiguracionDocumentoPresupuesto {
  if (!esRegistro(valor)) return false;
  const metodosPago = recuperarMetodosPago(valor.metodosPago);
  const redesSociales = recuperarRedesSociales(valor.redesSociales);
  return (
    typeof valor.nombreEmpresa === 'string' &&
    typeof valor.nombreResponsable === 'string' &&
    typeof valor.telefono === 'string' &&
    typeof valor.correo === 'string' &&
    typeof valor.direccion === 'string' &&
    typeof valor.rut === 'string' &&
    typeof valor.mensajeFinal === 'string' &&
    recuperarLogoConfiguracion(valor.logo) !== undefined &&
    metodosPago !== null &&
    identificadoresUnicosDocumento(metodosPago) &&
    redesSociales !== null &&
    identificadoresUnicosDocumento(redesSociales)
  );
}

function identificadoresUnicosDocumento(registros: { id: string }[]): boolean {
  return (
    registros.every((registro) => registro.id.trim() !== '') &&
    new Set(registros.map((registro) => registro.id)).size === registros.length
  );
}

function esNumeroOpcional(valor: unknown): valor is number | null {
  return valor === null || (typeof valor === 'number' && Number.isFinite(valor) && valor >= 0);
}

function esTipoConceptoPresupuesto(valor: unknown): valor is TipoConceptoPresupuesto {
  return TIPOS_CONCEPTO_PRESUPUESTO.some((tipo) => tipo === valor);
}

function esOrigenLineaPresupuesto(valor: unknown): valor is OrigenLineaPresupuesto {
  return ORIGENES_LINEA_PRESUPUESTO.some((origen) => origen === valor);
}

function esEstadoPresupuesto(valor: unknown): valor is EstadoPresupuesto {
  return ESTADOS_PRESUPUESTO.some((estado) => estado === valor);
}

function recuperarFechaCambioEstado(valor: unknown, estado: EstadoPresupuesto): string | null {
  if (estado === 'pendiente' || typeof valor !== 'string') {
    return null;
  }

  return Number.isNaN(Date.parse(valor)) ? null : valor;
}

function esLineaRecuperada(linea: LineaPresupuesto | null): linea is LineaPresupuesto {
  return linea !== null;
}

function esOpcionRecuperada(
  opcion: OpcionUnidadPresupuesto | null,
): opcion is OpcionUnidadPresupuesto {
  return opcion !== null;
}

function obtenerTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}
