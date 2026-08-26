import {
  crearIdentificadorMaterial,
  obtenerPresentacion,
  obtenerPrecioPredeterminado,
  obtenerUnidadMedida,
  type Material,
  type PrecioMaterial,
} from '@/dominio/materiales';
import { esMoneda, MONEDA_INICIAL, type Moneda } from '@/dominio/monedas';
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

export type TipoDestinatario = (typeof TIPOS_DESTINATARIO)[number];
export type TipoConceptoPresupuesto = (typeof TIPOS_CONCEPTO_PRESUPUESTO)[number];
export type OrigenLineaPresupuesto = (typeof ORIGENES_LINEA_PRESUPUESTO)[number];
export type EstadoPresupuesto = (typeof ESTADOS_PRESUPUESTO)[number];

export interface OpcionUnidadPresupuesto {
  unidad: string;
  precioUnitario: number | null;
}

export interface LineaPresupuesto {
  id: string;
  tipo: TipoConceptoPresupuesto;
  origen: OrigenLineaPresupuesto;
  idMaterial: string | null;
  nombre: string;
  cantidad: number | null;
  unidad: string;
  opcionesUnidad: OpcionUnidadPresupuesto[];
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
  }));
}

export function recuperarPresupuestoGuardado(valor: unknown): Presupuesto | null {
  if (!esRegistro(valor) || typeof valor.id !== 'string' || !Array.isArray(valor.lineas)) {
    return null;
  }

  const destinatario = recuperarDestinatario(valor.destinatario);
  const lineas = valor.lineas.map(recuperarLineaPresupuesto).filter(esLineaRecuperada);

  if (destinatario === null || lineas.length !== valor.lineas.length) {
    return null;
  }

  const ahora = new Date().toISOString();
  const estado = esEstadoPresupuesto(valor.estado) ? valor.estado : 'pendiente';

  return {
    id: valor.id,
    destinatario,
    fechaPresupuesto: obtenerTexto(valor.fechaPresupuesto),
    moneda: esMoneda(valor.moneda) ? valor.moneda : MONEDA_INICIAL,
    lineas,
    configuracionDocumento: recuperarConfiguracionDocumento(valor.configuracionDocumento),
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
    typeof valor.fechaPresupuesto === 'string' &&
    esMoneda(valor.moneda) &&
    esDestinatarioGuardado(valor.destinatario) &&
    Array.isArray(valor.lineas) &&
    valor.lineas.every(esLineaPresupuestoGuardada) &&
    (valor.configuracionDocumento === null ||
      valor.configuracionDocumento === undefined ||
      recuperarConfiguracionDocumento(valor.configuracionDocumento) !== null) &&
    esEstadoPresupuesto(valor.estado) &&
    (valor.fechaCambioEstado === null || typeof valor.fechaCambioEstado === 'string') &&
    typeof valor.fechaCreacion === 'string' &&
    typeof valor.fechaActualizacion === 'string'
  );
}

export function crearLineaMaterialManual(
  nombre: string,
  moneda: Moneda = MONEDA_INICIAL,
): LineaPresupuesto {
  return {
    id: crearIdentificadorMaterial(),
    tipo: 'material',
    origen: 'manual',
    idMaterial: null,
    nombre: nombre.trim(),
    cantidad: 1,
    unidad: 'Unidad',
    opcionesUnidad: [],
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

  return {
    id: crearIdentificadorMaterial(),
    tipo: 'material',
    origen: 'catalogo',
    idMaterial: material.id,
    nombre: material.nombre,
    cantidad: 1,
    unidad: opcionPredeterminada?.unidad ?? 'Unidad',
    opcionesUnidad,
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
    moneda: monedaDestino,
  };
}

export function calcularSubtotalLinea(linea: LineaPresupuesto): number {
  const precio = normalizarNumeroNoNegativo(linea.precioUnitario);
  return precio * normalizarNumeroNoNegativo(linea.cantidad);
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
): number {
  return lineas.reduce((total, linea) => {
    if (!lineaTieneMonedaCompatible(linea, monedaPresupuesto)) {
      return total;
    }

    return total + calcularSubtotalLinea(linea);
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
): number {
  return calcularTotalPorTiposConcepto(lineas, monedaPresupuesto, ['material']);
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
    origen: 'predefinido',
    idMaterial: null,
    nombre,
    cantidad: 0,
    unidad,
    opcionesUnidad: [],
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
    nombre: linea.nombre.trim(),
    cantidad: normalizarNumeroEditable(linea.cantidad, 0),
    precioUnitario: normalizarNumeroEditable(linea.precioUnitario, null),
    opcionesUnidad: linea.opcionesUnidad.map((opcion) => ({
      unidad: opcion.unidad.trim(),
      precioUnitario: normalizarNumeroEditable(opcion.precioUnitario, null),
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
  if (!esRegistro(valor)) {
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

  const opcionesUnidad = Array.isArray(valor.opcionesUnidad)
    ? valor.opcionesUnidad.map(recuperarOpcionUnidad).filter(esOpcionRecuperada)
    : [];

  return {
    id: typeof valor.id === 'string' ? valor.id : crearIdentificadorMaterial(),
    tipo,
    origen: esOrigenLineaPresupuesto(valor.origen) ? valor.origen : 'manual',
    idMaterial: typeof valor.idMaterial === 'string' ? valor.idMaterial : null,
    nombre: obtenerTexto(valor.nombre).trim(),
    cantidad: normalizarNumeroEditable(valor.cantidad, 0),
    unidad: obtenerTexto(valor.unidad).trim() || 'Unidad',
    opcionesUnidad,
    precioUnitario: normalizarNumeroEditable(valor.precioUnitario, null),
    moneda: esMoneda(valor.moneda) ? valor.moneda : MONEDA_INICIAL,
  };
}

function recuperarOpcionUnidad(valor: unknown): OpcionUnidadPresupuesto | null {
  if (!esRegistro(valor)) {
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
    TIPOS_CONCEPTO_PRESUPUESTO.some((tipo) => tipo === valor.tipo) &&
    ORIGENES_LINEA_PRESUPUESTO.some((origen) => origen === valor.origen) &&
    (valor.idMaterial === null || typeof valor.idMaterial === 'string') &&
    typeof valor.nombre === 'string' &&
    esNumeroOpcional(valor.cantidad) &&
    typeof valor.unidad === 'string' &&
    Array.isArray(valor.opcionesUnidad) &&
    esNumeroOpcional(valor.precioUnitario) &&
    esMoneda(valor.moneda)
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
