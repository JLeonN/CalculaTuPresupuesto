import type { Material } from '@/dominio/materiales';

export interface RepositorioMateriales {
  obtenerTodos(): Promise<Material[]>;
  agregarFaltantes(materiales: readonly Material[]): Promise<number>;
  guardar(material: Material): Promise<void>;
  eliminar(idMaterial: string): Promise<void>;
}
