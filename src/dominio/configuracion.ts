export const MENSAJE_FINAL_PREDETERMINADO =
  'Gracias por confiar en nosotros. Quedamos a disposición por cualquier consulta.';

const MENSAJE_FINAL_PREDETERMINADO_ANTERIOR =
  'Gracias por confiar en Mallic Tesla. Quedamos a disposición por cualquier consulta.';

export const REDES_SOCIALES_DISPONIBLES = [
  'Instagram',
  'Facebook',
  'TikTok',
  'YouTube',
  'LinkedIn',
  'X',
  'Otra',
] as const;

export interface LogoConfiguracion {
  nombre: string;
  tipoMime: string;
  datosUrl: string;
}

export interface MetodoPagoConfiguracion {
  id: string;
  nombre: string;
  numeroCuenta: string;
}

export interface RedSocialConfiguracion {
  id: string;
  red: string;
  usuarioOEnlace: string;
}

export interface TarifaManoObraConfiguracion {
  id: string;
  nombre: string;
  precioHora: number | null;
}

export interface DatosConfiguracion {
  nombreEmpresa: string;
  nombreResponsable: string;
  telefono: string;
  correo: string;
  direccion: string;
  rut: string;
  logo: LogoConfiguracion | null;
  tarifasManoObra: TarifaManoObraConfiguracion[];
  precioTrasladoKilometro: number | null;
  mensajeFinal: string;
  metodosPago: MetodoPagoConfiguracion[];
  redesSociales: RedSocialConfiguracion[];
}

export interface Configuracion extends DatosConfiguracion {
  fechaActualizacion: string | null;
}

export function crearConfiguracionInicial(): Configuracion {
  return {
    nombreEmpresa: '',
    nombreResponsable: '',
    telefono: '',
    correo: '',
    direccion: '',
    rut: '',
    logo: null,
    tarifasManoObra: [crearTarifaManoObraConfiguracion()],
    precioTrasladoKilometro: null,
    mensajeFinal: MENSAJE_FINAL_PREDETERMINADO,
    metodosPago: [crearMetodoPagoConfiguracion()],
    redesSociales: [crearRedSocialConfiguracion()],
    fechaActualizacion: null,
  };
}

export function crearMetodoPagoConfiguracion(): MetodoPagoConfiguracion {
  return {
    id: crypto.randomUUID(),
    nombre: '',
    numeroCuenta: '',
  };
}

export function crearRedSocialConfiguracion(): RedSocialConfiguracion {
  return {
    id: crypto.randomUUID(),
    red: 'Instagram',
    usuarioOEnlace: '',
  };
}

export function crearTarifaManoObraConfiguracion(
  nombre = 'Mano de obra general',
): TarifaManoObraConfiguracion {
  return {
    id: crypto.randomUUID(),
    nombre,
    precioHora: null,
  };
}

export function actualizarConfiguracion(datos: DatosConfiguracion): Configuracion {
  return {
    ...normalizarDatosConfiguracion(datos),
    fechaActualizacion: new Date().toISOString(),
  };
}

export function normalizarDatosConfiguracion(datos: DatosConfiguracion): DatosConfiguracion {
  return {
    nombreEmpresa: datos.nombreEmpresa.trim(),
    nombreResponsable: datos.nombreResponsable.trim(),
    telefono: datos.telefono.trim(),
    correo: datos.correo.trim(),
    direccion: datos.direccion.trim(),
    rut: datos.rut.trim(),
    logo: datos.logo ? { ...datos.logo, nombre: datos.logo.nombre.trim() } : null,
    tarifasManoObra: datos.tarifasManoObra.map(normalizarTarifaManoObra),
    precioTrasladoKilometro: normalizarPrecio(datos.precioTrasladoKilometro),
    mensajeFinal: normalizarTextoMultilinea(datos.mensajeFinal),
    metodosPago: datos.metodosPago
      .map((metodo) => ({
        ...metodo,
        nombre: metodo.nombre.trim(),
        numeroCuenta: metodo.numeroCuenta.trim(),
      }))
      .filter((metodo) => metodo.nombre !== '' || metodo.numeroCuenta !== ''),
    redesSociales: datos.redesSociales
      .map((redSocial) => ({
        ...redSocial,
        red: redSocial.red.trim(),
        usuarioOEnlace: redSocial.usuarioOEnlace.trim(),
      }))
      .filter((redSocial) => redSocial.usuarioOEnlace !== ''),
  };
}

export function esConfiguracionGuardada(valor: unknown): valor is Configuracion {
  if (!esRegistro(valor)) {
    return false;
  }

  const camposTexto = [
    'nombreEmpresa',
    'nombreResponsable',
    'telefono',
    'correo',
    'direccion',
    'rut',
    'mensajeFinal',
  ];

  return (
    camposTexto.every((campo) => typeof valor[campo] === 'string') &&
    esListaTarifasManoObra(valor.tarifasManoObra) &&
    esPrecioGuardado(valor.precioTrasladoKilometro) &&
    esLogoGuardado(valor.logo) &&
    esListaMetodosPago(valor.metodosPago) &&
    esListaRedesSociales(valor.redesSociales) &&
    (valor.fechaActualizacion === null || typeof valor.fechaActualizacion === 'string')
  );
}

export function migrarConfiguracionAnterior(valor: unknown): Configuracion | null {
  if (!esRegistro(valor)) {
    return null;
  }

  const configuracionBase = crearConfiguracionInicial();
  const datosBancarios = obtenerTexto(valor.datosTransferenciaBancaria).trim();
  const precioManoObraHora = esPrecioGuardado(valor.precioManoObraHora)
    ? valor.precioManoObraHora
    : null;

  return {
    ...configuracionBase,
    nombreEmpresa: obtenerTexto(valor.nombreEmpresa),
    nombreResponsable: obtenerTexto(valor.nombreResponsable),
    telefono: obtenerTexto(valor.telefono),
    correo: obtenerTexto(valor.correo),
    direccion: obtenerTexto(valor.direccion),
    rut: obtenerTexto(valor.rut),
    logo: esLogoGuardado(valor.logo) ? valor.logo : null,
    tarifasManoObra: [
      {
        ...crearTarifaManoObraConfiguracion(),
        precioHora: precioManoObraHora,
      },
    ],
    precioTrasladoKilometro: esPrecioGuardado(valor.precioTrasladoKilometro)
      ? valor.precioTrasladoKilometro
      : null,
    mensajeFinal: obtenerTexto(valor.mensajeFinal) || MENSAJE_FINAL_PREDETERMINADO,
    metodosPago: esListaMetodosPago(valor.metodosPago)
      ? structuredClone(valor.metodosPago)
      : datosBancarios
        ? [
            {
              id: crypto.randomUUID(),
              nombre: 'Transferencia bancaria',
              numeroCuenta: datosBancarios,
            },
          ]
        : [crearMetodoPagoConfiguracion()],
    redesSociales: esListaRedesSociales(valor.redesSociales)
      ? structuredClone(valor.redesSociales)
      : [crearRedSocialConfiguracion()],
    fechaActualizacion:
      typeof valor.fechaActualizacion === 'string' ? valor.fechaActualizacion : null,
  };
}

export function migrarMensajeFinalPredeterminado(configuracion: Configuracion): Configuracion {
  if (configuracion.mensajeFinal !== MENSAJE_FINAL_PREDETERMINADO_ANTERIOR) {
    return configuracion;
  }

  return {
    ...configuracion,
    mensajeFinal: MENSAJE_FINAL_PREDETERMINADO,
  };
}

function normalizarPrecio(valor: number | null): number | null {
  if (valor === null || !Number.isFinite(Number(valor))) {
    return null;
  }

  const precio = Number(valor);

  if (precio < 0) {
    throw new RangeError('Los precios de configuración no pueden ser negativos.');
  }

  return precio;
}

function normalizarTarifaManoObra(
  tarifa: TarifaManoObraConfiguracion,
): TarifaManoObraConfiguracion {
  const nombre = tarifa.nombre.trim();
  const precioHora = normalizarPrecio(tarifa.precioHora);

  if (nombre === '' || precioHora === null) {
    throw new RangeError('Completá el nombre y el precio de cada mano de obra.');
  }

  return {
    ...tarifa,
    nombre,
    precioHora,
  };
}

function normalizarTextoMultilinea(valor: string): string {
  return valor
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((linea) => linea.trimEnd())
    .join('\n')
    .trim();
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esPrecioGuardado(valor: unknown): valor is number | null {
  return valor === null || (typeof valor === 'number' && Number.isFinite(valor) && valor >= 0);
}

function esLogoGuardado(valor: unknown): valor is LogoConfiguracion | null {
  return (
    valor === null ||
    (esRegistro(valor) &&
      typeof valor.nombre === 'string' &&
      typeof valor.tipoMime === 'string' &&
      typeof valor.datosUrl === 'string' &&
      valor.datosUrl.startsWith('data:image/'))
  );
}

function esListaMetodosPago(valor: unknown): valor is MetodoPagoConfiguracion[] {
  return (
    Array.isArray(valor) &&
    valor.every(
      (metodo) =>
        esRegistro(metodo) &&
        typeof metodo.id === 'string' &&
        typeof metodo.nombre === 'string' &&
        typeof metodo.numeroCuenta === 'string',
    )
  );
}

function esListaRedesSociales(valor: unknown): valor is RedSocialConfiguracion[] {
  return (
    Array.isArray(valor) &&
    valor.every(
      (redSocial) =>
        esRegistro(redSocial) &&
        typeof redSocial.id === 'string' &&
        typeof redSocial.red === 'string' &&
        typeof redSocial.usuarioOEnlace === 'string',
    )
  );
}

function esListaTarifasManoObra(valor: unknown): valor is TarifaManoObraConfiguracion[] {
  return (
    Array.isArray(valor) &&
    valor.length > 0 &&
    valor.every(
      (tarifa) =>
        esRegistro(tarifa) &&
        typeof tarifa.id === 'string' &&
        typeof tarifa.nombre === 'string' &&
        tarifa.nombre.trim() !== '' &&
        esPrecioGuardado(tarifa.precioHora),
    )
  );
}

function obtenerTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}
