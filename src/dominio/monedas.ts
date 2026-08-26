export const MONEDA_INICIAL = 'UYU' as const;
export const MONEDA_ALTERNATIVA = 'USD' as const;
export const LOCALE_NUMERICO = 'es-419';

export const MONEDAS_DISPONIBLES = [
  { codigo: 'UYU', nombre: 'Peso uruguayo' },
  { codigo: 'USD', nombre: 'Dólar estadounidense' },
  { codigo: 'ARS', nombre: 'Peso argentino' },
  { codigo: 'BOB', nombre: 'Boliviano' },
  { codigo: 'CLP', nombre: 'Peso chileno' },
  { codigo: 'COP', nombre: 'Peso colombiano' },
  { codigo: 'CRC', nombre: 'Colón costarricense' },
  { codigo: 'CUP', nombre: 'Peso cubano' },
  { codigo: 'DOP', nombre: 'Peso dominicano' },
  { codigo: 'EUR', nombre: 'Euro' },
  { codigo: 'GTQ', nombre: 'Quetzal guatemalteco' },
  { codigo: 'HNL', nombre: 'Lempira hondureño' },
  { codigo: 'MXN', nombre: 'Peso mexicano' },
  { codigo: 'NIO', nombre: 'Córdoba nicaragüense' },
  { codigo: 'PAB', nombre: 'Balboa panameño' },
  { codigo: 'PYG', nombre: 'Guaraní paraguayo' },
  { codigo: 'PEN', nombre: 'Sol peruano' },
  { codigo: 'VES', nombre: 'Bolívar venezolano' },
  { codigo: 'XAF', nombre: 'Franco CFA de África Central' },
  { codigo: 'BRL', nombre: 'Real brasileño' },
  { codigo: 'CAD', nombre: 'Dólar canadiense' },
  { codigo: 'GBP', nombre: 'Libra esterlina' },
  { codigo: 'CHF', nombre: 'Franco suizo' },
] as const;

export type Moneda = (typeof MONEDAS_DISPONIBLES)[number]['codigo'];

export interface OpcionMoneda {
  codigo: Moneda;
  nombre: string;
  etiqueta: string;
}

const CODIGOS_MONEDA = new Set<string>(MONEDAS_DISPONIBLES.map((moneda) => moneda.codigo));
const INDICES_MONEDA = new Map<Moneda, number>(
  MONEDAS_DISPONIBLES.map((moneda, indice) => [moneda.codigo, indice]),
);

export function esMoneda(valor: unknown): valor is Moneda {
  return typeof valor === 'string' && CODIGOS_MONEDA.has(valor);
}

export function obtenerOpcionMoneda(codigo: Moneda): OpcionMoneda {
  const moneda = MONEDAS_DISPONIBLES.find((opcion) => opcion.codigo === codigo);
  const nombre = moneda?.nombre ?? codigo;

  return {
    codigo,
    nombre,
    etiqueta: `${nombre} (${codigo})`,
  };
}

export function obtenerOpcionesMonedasDisponibles(): OpcionMoneda[] {
  return MONEDAS_DISPONIBLES.map((moneda) => obtenerOpcionMoneda(moneda.codigo));
}

export function crearOpcionesMonedaOperacion(
  monedaPrincipal: Moneda,
  monedaActual?: Moneda,
): OpcionMoneda[] {
  const codigos = [monedaPrincipal, MONEDA_ALTERNATIVA, monedaActual].filter(
    (codigo): codigo is Moneda => codigo !== undefined,
  );
  const codigosUnicos = codigos.filter((codigo, indice) => codigos.indexOf(codigo) === indice);

  return codigosUnicos.map(obtenerOpcionMoneda);
}

export function buscarOpcionesMoneda(
  opciones: readonly OpcionMoneda[],
  termino: string,
): OpcionMoneda[] {
  const terminoNormalizado = normalizarTextoBusquedaMoneda(termino);

  if (terminoNormalizado === '') {
    return [...opciones];
  }

  return opciones.filter((opcion) =>
    normalizarTextoBusquedaMoneda(`${opcion.nombre} ${opcion.codigo}`).includes(terminoNormalizado),
  );
}

export function compararMonedas(monedaA: Moneda, monedaB: Moneda): number {
  const indiceA = INDICES_MONEDA.get(monedaA);
  const indiceB = INDICES_MONEDA.get(monedaB);

  if (indiceA !== undefined && indiceB !== undefined) {
    return indiceA - indiceB;
  }

  return monedaA.localeCompare(monedaB, 'es', { sensitivity: 'base' });
}

export function formatearImporte(importe: number, moneda: Moneda): string {
  const importeFormateado = new Intl.NumberFormat(LOCALE_NUMERICO, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(importe);

  return `${moneda} ${importeFormateado}`;
}

export function formatearNumero(cantidad: number): string {
  return new Intl.NumberFormat(LOCALE_NUMERICO, { maximumFractionDigits: 2 }).format(cantidad);
}

function normalizarTextoBusquedaMoneda(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es');
}
