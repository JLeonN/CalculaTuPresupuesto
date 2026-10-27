export const ETIQUETAS_TELEFONO = ['Personal', 'Trabajo', 'WhatsApp', 'Otro'] as const;

export type EtiquetaTelefono = (typeof ETIQUETAS_TELEFONO)[number];

export interface TelefonoCliente {
  id: string;
  numero: string;
  etiqueta: EtiquetaTelefono;
  esPrincipal: boolean;
}

export interface LocalCliente {
  id: string;
  nombre: string;
  direccion: string;
  telefonos: TelefonoCliente[];
}

export interface Cliente {
  id: string;
  nombre: string;
  telefonos: TelefonoCliente[];
  locales: LocalCliente[];
  correo: string;
  notas: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DatosCliente {
  nombre: string;
  telefonos: TelefonoCliente[];
  locales: LocalCliente[];
  correo: string;
  notas: string;
}

export function esClienteGuardado(valor: unknown): valor is Cliente {
  if (!esRegistroCliente(valor)) return false;
  if (
    !esTextoNoVacio(valor.id) ||
    !esTextoNoVacio(valor.nombre) ||
    typeof valor.correo !== 'string' ||
    typeof valor.notas !== 'string' ||
    !esTextoNoVacio(valor.fechaCreacion) ||
    !esTextoNoVacio(valor.fechaActualizacion) ||
    !Array.isArray(valor.telefonos) ||
    !Array.isArray(valor.locales)
  )
    return false;

  if (
    !valor.telefonos.every(esTelefonoGuardado) ||
    !valor.locales.every(esLocalGuardado) ||
    !identificadoresUnicos(valor.locales)
  )
    return false;
  const telefonos = [...valor.telefonos, ...valor.locales.flatMap((local) => local.telefonos)];
  return identificadoresUnicos(telefonos);
}

function esLocalGuardado(valor: unknown): valor is LocalCliente {
  return (
    esRegistroCliente(valor) &&
    esTextoNoVacio(valor.id) &&
    typeof valor.nombre === 'string' &&
    typeof valor.direccion === 'string' &&
    Array.isArray(valor.telefonos) &&
    valor.telefonos.every(esTelefonoGuardado) &&
    identificadoresUnicos(valor.telefonos)
  );
}

function esTelefonoGuardado(valor: unknown): valor is TelefonoCliente {
  return (
    esRegistroCliente(valor) &&
    esTextoNoVacio(valor.id) &&
    typeof valor.numero === 'string' &&
    ETIQUETAS_TELEFONO.some((etiqueta) => etiqueta === valor.etiqueta) &&
    typeof valor.esPrincipal === 'boolean'
  );
}

function esRegistroCliente(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTextoNoVacio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim() !== '';
}

function identificadoresUnicos(registros: { id: string }[]): boolean {
  return new Set(registros.map((registro) => registro.id)).size === registros.length;
}

export function crearIdentificador(): string {
  return crypto.randomUUID();
}

export function crearTelefono(): TelefonoCliente {
  return {
    id: crearIdentificador(),
    numero: '',
    etiqueta: 'Personal',
    esPrincipal: true,
  };
}

export function crearTelefonoLocal(): TelefonoCliente {
  return { ...crearTelefono(), etiqueta: 'Trabajo' };
}

export function crearLocal(): LocalCliente {
  return {
    id: crearIdentificador(),
    nombre: '',
    direccion: '',
    telefonos: [],
  };
}

export function normalizarTelefonos(telefonos: TelefonoCliente[]): TelefonoCliente[] {
  const indicePrincipal = telefonos.findIndex((telefono) => telefono.esPrincipal);
  const indiceTelefonoPrincipal = indicePrincipal >= 0 ? indicePrincipal : 0;

  return telefonos.map((telefono, indice) => ({
    ...telefono,
    numero: telefono.numero.trim(),
    esPrincipal: indice === indiceTelefonoPrincipal,
  }));
}

export function obtenerTelefonosConNumero(telefonos: TelefonoCliente[]): TelefonoCliente[] {
  return telefonos.filter((telefono) => telefono.numero.trim() !== '');
}

export function obtenerLocalesConDatos(locales: LocalCliente[]): LocalCliente[] {
  return locales.filter(
    (local) =>
      local.nombre.trim() !== '' ||
      local.direccion.trim() !== '' ||
      obtenerTelefonosConNumero(local.telefonos ?? []).length > 0,
  );
}

export function crearCliente(datos: DatosCliente): Cliente {
  const ahora = new Date().toISOString();

  return {
    id: crearIdentificador(),
    ...normalizarDatosCliente(datos),
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
  };
}

export function actualizarCliente(cliente: Cliente, datos: DatosCliente): Cliente {
  return {
    ...cliente,
    ...normalizarDatosCliente(datos),
    fechaActualizacion: new Date().toISOString(),
  };
}

export function obtenerTelefonoPrincipal(cliente: Cliente): TelefonoCliente | undefined {
  const telefonosConNumero = obtenerTelefonosConNumero(cliente.telefonos);

  return telefonosConNumero.find((telefono) => telefono.esPrincipal) ?? telefonosConNumero[0];
}

export function normalizarDatosCliente(datos: DatosCliente): DatosCliente {
  const telefonosConNumero = obtenerTelefonosConNumero(datos.telefonos);

  return {
    nombre: datos.nombre.trim(),
    telefonos: normalizarTelefonos(telefonosConNumero),
    locales: obtenerLocalesConDatos(datos.locales).map((local) => ({
      ...local,
      nombre: local.nombre.trim(),
      direccion: local.direccion.trim(),
      telefonos: normalizarTelefonos(obtenerTelefonosConNumero(local.telefonos ?? [])),
    })),
    correo: datos.correo.trim(),
    notas: datos.notas.trim(),
  };
}
