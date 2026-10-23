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
