import type { Material } from '@/dominio/materiales';
import { CLAVES_ALMACENAMIENTO } from '@/configuracion/clavesAlmacenamiento';
import type { AlmacenamientoClaveValor } from '@/repositorios/clientes/AlmacenamientoClaveValor';
import type { RepositorioMateriales } from './RepositorioMateriales';

export class RepositorioMaterialesLocal implements RepositorioMateriales {
  // TODO(firebase): sustituir este repositorio por Firestore conservando el contrato asíncrono.
  constructor(private readonly almacenamiento: AlmacenamientoClaveValor) {}

  async obtenerTodos(): Promise<Material[]> {
    const datosGuardados = await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.materiales);

    if (datosGuardados === null) {
      return [];
    }

    try {
      const materiales = JSON.parse(datosGuardados) as unknown;
      return Array.isArray(materiales) ? structuredClone(materiales as Material[]) : [];
    } catch {
      return [];
    }
  }

  async guardar(material: Material): Promise<void> {
    const materiales = await this.obtenerTodos();
    const indiceMaterial = materiales.findIndex((actual) => actual.id === material.id);

    if (indiceMaterial === -1) {
      materiales.push(structuredClone(material));
    } else {
      materiales.splice(indiceMaterial, 1, structuredClone(material));
    }

    await this.guardarTodos(materiales);
  }

  async eliminar(idMaterial: string): Promise<void> {
    const materiales = await this.obtenerTodos();
    await this.guardarTodos(materiales.filter((material) => material.id !== idMaterial));
  }

  private async guardarTodos(materiales: Material[]): Promise<void> {
    await this.almacenamiento.guardar(CLAVES_ALMACENAMIENTO.materiales, JSON.stringify(materiales));
  }
}
