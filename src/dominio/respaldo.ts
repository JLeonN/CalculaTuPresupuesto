import { esClienteGuardado, type Cliente } from '@/dominio/clientes';
import { esConfiguracionGuardada, type Configuracion } from '@/dominio/configuracion';
import { esMaterialGuardado, type Material } from '@/dominio/materiales';
import { esPresupuestoGuardado, type Presupuesto } from '@/dominio/presupuestos';

export const TIPO_RESPALDO = 'calcula-tu-presupuesto-respaldo';
export const VERSION_FORMATO_RESPALDO = 1;

export interface DatosRespaldo {
  configuracion: Configuracion | null;
  clientes: Cliente[];
  materiales: Material[];
  presupuestos: Presupuesto[];
}

export interface RespaldoDatos {
  tipo: typeof TIPO_RESPALDO;
  versionFormato: typeof VERSION_FORMATO_RESPALDO;
  fechaExportacion: string;
  datos: DatosRespaldo;
}

export interface ResumenColeccionImportacion {
  nuevos: number;
  existentesIguales: number;
  existentesDistintos: number;
}

export type EstadoConfiguracionImportacion =
  | 'seAgrega'
  | 'yaExisteIgual'
  | 'yaExisteDistinta'
  | 'sinDatosEnCopia';

export interface ResumenImportacion {
  clientes: ResumenColeccionImportacion;
  materiales: ResumenColeccionImportacion;
  presupuestos: ResumenColeccionImportacion;
  configuracion: EstadoConfiguracionImportacion;
}

export function crearRespaldo(datos: DatosRespaldo, fecha = new Date()): RespaldoDatos {
  return validarRespaldo({
    tipo: TIPO_RESPALDO,
    versionFormato: VERSION_FORMATO_RESPALDO,
    fechaExportacion: fecha.toISOString(),
    datos,
  });
}

export function validarRespaldo(valor: unknown): RespaldoDatos {
  if (!esRegistro(valor) || valor.tipo !== TIPO_RESPALDO) {
    throw new Error('El archivo no es una copia de Calcula tu presupuesto.');
  }
  if (valor.versionFormato !== VERSION_FORMATO_RESPALDO) {
    throw new Error('La versión de esta copia no es compatible con la aplicación.');
  }
  if (
    typeof valor.fechaExportacion !== 'string' ||
    Number.isNaN(Date.parse(valor.fechaExportacion)) ||
    !esRegistro(valor.datos)
  ) {
    throw new Error('La copia no tiene una fecha o estructura válida.');
  }

  const datos = valor.datos;
  if (
    !(datos.configuracion === null || esConfiguracionGuardada(datos.configuracion)) ||
    !esColeccionValida(datos.clientes, esClienteGuardado) ||
    !esColeccionValida(datos.materiales, esMaterialGuardado) ||
    !esColeccionValida(datos.presupuestos, esPresupuestoGuardado)
  ) {
    throw new Error('La copia contiene registros inválidos o identificadores repetidos.');
  }
  return structuredClone(valor) as unknown as RespaldoDatos;
}

export function compararRespaldo(
  respaldo: RespaldoDatos,
  actuales: DatosRespaldo,
): ResumenImportacion {
  return {
    clientes: compararColeccion(respaldo.datos.clientes, actuales.clientes),
    materiales: compararColeccion(respaldo.datos.materiales, actuales.materiales),
    presupuestos: compararColeccion(respaldo.datos.presupuestos, actuales.presupuestos),
    configuracion: compararConfiguracion(respaldo.datos.configuracion, actuales.configuracion),
  };
}

function esColeccionValida<T extends { id: string }>(
  valor: unknown,
  validar: (registro: unknown) => registro is T,
): valor is T[] {
  return (
    Array.isArray(valor) &&
    valor.every(validar) &&
    new Set(valor.map((registro: T) => registro.id)).size === valor.length
  );
}

function compararColeccion<T extends { id: string }>(
  entrantes: readonly T[],
  actuales: readonly T[],
): ResumenColeccionImportacion {
  const porId = new Map(actuales.map((registro) => [registro.id, registro]));
  const resumen: ResumenColeccionImportacion = {
    nuevos: 0,
    existentesIguales: 0,
    existentesDistintos: 0,
  };
  for (const entrante of entrantes) {
    const actual = porId.get(entrante.id);
    if (!actual) resumen.nuevos += 1;
    else if (sonIguales(actual, entrante)) resumen.existentesIguales += 1;
    else resumen.existentesDistintos += 1;
  }
  return resumen;
}

function compararConfiguracion(
  entrante: Configuracion | null,
  actual: Configuracion | null,
): EstadoConfiguracionImportacion {
  if (entrante === null) return 'sinDatosEnCopia';
  if (actual === null) return 'seAgrega';
  return sonIguales(entrante, actual) ? 'yaExisteIgual' : 'yaExisteDistinta';
}

function sonIguales(primero: unknown, segundo: unknown): boolean {
  return JSON.stringify(ordenarClaves(primero)) === JSON.stringify(ordenarClaves(segundo));
}

function ordenarClaves(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenarClaves);
  if (!esRegistro(valor)) return valor;
  return Object.fromEntries(
    Object.entries(valor)
      .sort(([claveA], [claveB]) => claveA.localeCompare(claveB))
      .map(([clave, contenido]) => [clave, ordenarClaves(contenido)]),
  );
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
