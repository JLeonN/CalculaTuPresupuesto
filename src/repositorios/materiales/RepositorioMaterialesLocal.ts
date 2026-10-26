import { esMaterialGuardado, recuperarMaterialGuardado, type Material } from '@/dominio/materiales';
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

    let valor: unknown;
    try {
      valor = JSON.parse(datosGuardados) as unknown;
    } catch {
      throw new Error('Los materiales guardados tienen un formato ilegible.');
    }
    const materiales = Array.isArray(valor) ? valor.map(recuperarMaterialGuardado) : null;
    const materialesRecuperados = materiales?.filter((material): material is Material => material !== null);
    if (
      materiales === null ||
      materialesRecuperados === undefined ||
      materialesRecuperados.length !== materiales.length ||
      new Set(materialesRecuperados.map((material) => material.id)).size !== materiales.length
    ) {
      throw new Error('Hay materiales guardados que no se pudieron recuperar de forma segura.');
    }
    return structuredClone(materialesRecuperados);
  }

  async agregarFaltantes(materialesEntrantes: readonly Material[]): Promise<number> {
    if (
      !materialesEntrantes.every(esMaterialGuardado) ||
      new Set(materialesEntrantes.map((material) => material.id)).size !== materialesEntrantes.length
    ) {
      throw new Error('La copia contiene materiales inválidos.');
    }
    const materiales = await this.obtenerTodos();
    const ids = new Set(materiales.map((material) => material.id));
    const faltantes = materialesEntrantes.filter((material) => !ids.has(material.id));
    if (faltantes.length === 0) return 0;
    await this.guardarTodos([...materiales, ...structuredClone(faltantes)]);
    return faltantes.length;
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
    const valor = JSON.stringify(materiales);
    await this.almacenamiento.guardar(CLAVES_ALMACENAMIENTO.materiales, valor);
    if (await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.materiales) !== valor) {
      throw new Error('No se pudo verificar el guardado de materiales.');
    }
  }
}
