export interface AlmacenamientoClaveValor {
  obtener(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string): Promise<void>;
  eliminar(clave: string): Promise<void>;
}
