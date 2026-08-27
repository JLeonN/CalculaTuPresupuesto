export const CLAVES_ALMACENAMIENTO = {
  configuracion: 'calcula-tu-presupuesto:configuracion:v1',
  clientes: 'calcula-tu-presupuesto:clientes:v1',
  materiales: 'calcula-tu-presupuesto:materiales:v1',
  presupuestos: 'calcula-tu-presupuesto:presupuestos:v1',
  actualizacionVista: 'calcula-tu-presupuesto:actualizacion-vista:v1',
  sesionPrueba: 'calcula-tu-presupuesto:sesion-prueba:v1',
} as const;

const CLAVES_ALMACENAMIENTO_ANTERIORES: Readonly<Record<string, string>> = {
  [CLAVES_ALMACENAMIENTO.configuracion]: 'mallic-tesla:configuracion:v1',
  [CLAVES_ALMACENAMIENTO.clientes]: 'mallic-tesla:clientes:v1',
  [CLAVES_ALMACENAMIENTO.materiales]: 'mallic-tesla:materiales:v1',
  [CLAVES_ALMACENAMIENTO.presupuestos]: 'mallic-tesla:presupuestos:v1',
};

export function obtenerClaveAlmacenamientoAnterior(claveActual: string): string | null {
  return CLAVES_ALMACENAMIENTO_ANTERIORES[claveActual] ?? null;
}
