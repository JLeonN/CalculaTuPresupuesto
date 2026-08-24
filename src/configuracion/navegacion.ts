export type UbicacionNavegacion =
  'barra-movil' | 'menu-escritorio' | 'pagina-mas' | 'acceso-inicio';

export interface ElementoNavegacion {
  nombre: string;
  etiqueta: string;
  icono: string;
  ruta: string;
  ubicaciones: readonly UbicacionNavegacion[];
  prefijosActivos?: readonly string[];
}

export const ELEMENTOS_NAVEGACION: readonly ElementoNavegacion[] = [
  {
    nombre: 'inicio',
    etiqueta: 'Inicio',
    icono: 'home',
    ruta: '/',
    ubicaciones: ['barra-movil', 'menu-escritorio'],
  },
  {
    nombre: 'presupuestos',
    etiqueta: 'Presupuestos',
    icono: 'request_quote',
    ruta: '/presupuestos',
    ubicaciones: ['barra-movil', 'menu-escritorio', 'acceso-inicio'],
    prefijosActivos: ['/presupuestos'],
  },
  {
    nombre: 'clientes',
    etiqueta: 'Clientes',
    icono: 'groups',
    ruta: '/clientes',
    ubicaciones: ['barra-movil', 'menu-escritorio', 'acceso-inicio'],
    prefijosActivos: ['/clientes'],
  },
  {
    nombre: 'materiales',
    etiqueta: 'Materiales',
    icono: 'inventory_2',
    ruta: '/materiales',
    ubicaciones: ['menu-escritorio', 'pagina-mas', 'acceso-inicio'],
    prefijosActivos: ['/materiales'],
  },
  {
    nombre: 'configuracion',
    etiqueta: 'Configuración',
    icono: 'settings',
    ruta: '/configuracion',
    ubicaciones: ['menu-escritorio', 'pagina-mas'],
    prefijosActivos: ['/configuracion'],
  },
];

export const ELEMENTO_MAS: ElementoNavegacion = {
  nombre: 'mas',
  etiqueta: 'Más',
  icono: 'more_horiz',
  ruta: '/mas',
  ubicaciones: ['barra-movil'],
  prefijosActivos: ['/mas', '/materiales', '/configuracion'],
};

export function obtenerElementosNavegacion(
  ubicacion: UbicacionNavegacion,
): readonly ElementoNavegacion[] {
  return ELEMENTOS_NAVEGACION.filter((elemento) => elemento.ubicaciones.includes(ubicacion));
}

export function estaElementoActivo(elemento: ElementoNavegacion, rutaActual: string): boolean {
  if (elemento.ruta === '/') {
    return rutaActual === '/';
  }

  const rutasActivas = elemento.prefijosActivos ?? [elemento.ruta];
  return rutasActivas.some(
    (prefijo) => rutaActual === prefijo || rutaActual.startsWith(`${prefijo}/`),
  );
}
