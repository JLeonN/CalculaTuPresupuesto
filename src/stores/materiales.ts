import { ref } from 'vue';
import {
  actualizarMaterial,
  crearMaterial,
  obtenerImporteVisible,
  obtenerPrecioPredeterminado,
  type DatosMaterial,
  type Material,
} from '@/dominio/materiales';
import { crearRepositorioMateriales } from '@/repositorios/materiales/crearRepositorioMateriales';
import { compararMonedas } from '@/dominio/monedas';
import { defineStore } from 'pinia';

export type CriterioOrdenMaterial = 'nombre' | 'precio' | 'local';
export type DireccionOrden = 'ascendente' | 'descendente';

const repositorioMateriales = crearRepositorioMateriales();

export const useMaterialesStore = defineStore('materiales', () => {
  const materiales = ref<Material[]>([]);
  const cargando = ref(false);
  const guardando = ref(false);
  const error = ref<string | null>(null);
  let versionDatos = 0;

  function invalidarDatos(): void {
    versionDatos += 1;
    materiales.value = [];
    error.value = null;
    cargando.value = false;
    guardando.value = false;
  }

  async function cargarMateriales(): Promise<void> {
    const version = versionDatos;
    cargando.value = true;
    error.value = null;

    try {
      const resultado = await repositorioMateriales.obtenerTodos();
      if (version === versionDatos) materiales.value = resultado;
    } catch {
      if (version === versionDatos) error.value = 'No se pudieron cargar los materiales guardados.';
    } finally {
      if (version === versionDatos) cargando.value = false;
    }
  }

  async function agregarMaterial(datos: DatosMaterial): Promise<Material> {
    const version = versionDatos;
    guardando.value = true;
    error.value = null;
    const material = crearMaterial(datos);

    try {
      await repositorioMateriales.guardar(material);
      if (version !== versionDatos) throw new Error('La sesión cambió durante el guardado.');
      materiales.value = [...materiales.value, material];
      return material;
    } catch {
      error.value = 'No se pudo guardar el material.';
      throw new Error(error.value);
    } finally {
      guardando.value = false;
    }
  }

  async function editarMaterial(idMaterial: string, datos: DatosMaterial): Promise<Material> {
    const version = versionDatos;
    const materialActual = obtenerMaterialPorId(idMaterial);

    if (materialActual === undefined) {
      throw new Error('El material que intentás editar ya no existe.');
    }

    guardando.value = true;
    error.value = null;
    const materialActualizado = actualizarMaterial(materialActual, datos);

    try {
      await repositorioMateriales.guardar(materialActualizado);
      if (version !== versionDatos) throw new Error('La sesión cambió durante el guardado.');
      materiales.value = materiales.value.map((material) =>
        material.id === idMaterial ? materialActualizado : material,
      );
      return materialActualizado;
    } catch {
      error.value = 'No se pudieron guardar los cambios del material.';
      throw new Error(error.value);
    } finally {
      guardando.value = false;
    }
  }

  async function eliminarMaterial(idMaterial: string): Promise<void> {
    const version = versionDatos;
    guardando.value = true;
    error.value = null;

    try {
      await repositorioMateriales.eliminar(idMaterial);
      if (version !== versionDatos) throw new Error('La sesión cambió durante el borrado.');
      materiales.value = materiales.value.filter((material) => material.id !== idMaterial);
    } catch {
      error.value = 'No se pudo eliminar el material.';
      throw new Error(error.value);
    } finally {
      guardando.value = false;
    }
  }

  function obtenerMaterialPorId(idMaterial: string): Material | undefined {
    return materiales.value.find((material) => material.id === idMaterial);
  }

  function buscarMateriales(
    termino: string,
    criterio: CriterioOrdenMaterial,
    direccion: DireccionOrden,
  ): Material[] {
    const terminoNormalizado = termino.trim().toLocaleLowerCase('es');
    const filtrados = materiales.value.filter((material) => {
      if (terminoNormalizado === '') {
        return true;
      }

      const coincideNombre = material.nombre.toLocaleLowerCase('es').includes(terminoNormalizado);
      const coincideComercio = material.precios.some((precio) =>
        precio.comercio.toLocaleLowerCase('es').includes(terminoNormalizado),
      );
      return coincideNombre || coincideComercio;
    });

    return [...filtrados].sort((materialA, materialB) =>
      compararMateriales(materialA, materialB, criterio, direccion),
    );
  }

  return {
    materiales,
    cargando,
    guardando,
    error,
    cargarMateriales,
    agregarMaterial,
    editarMaterial,
    eliminarMaterial,
    obtenerMaterialPorId,
    buscarMateriales,
    invalidarDatos,
  };
});

function compararMateriales(
  materialA: Material,
  materialB: Material,
  criterio: CriterioOrdenMaterial,
  direccion: DireccionOrden,
): number {
  const multiplicador = direccion === 'ascendente' ? 1 : -1;
  const precioA = obtenerPrecioPredeterminado(materialA);
  const precioB = obtenerPrecioPredeterminado(materialB);

  if (criterio === 'precio' && precioA && precioB) {
    const diferenciaMoneda = compararMonedas(precioA.moneda, precioB.moneda);
    if (diferenciaMoneda !== 0) {
      return diferenciaMoneda;
    }
    return (obtenerImporteVisible(precioA) - obtenerImporteVisible(precioB)) * multiplicador;
  }

  const textoA = criterio === 'local' ? (precioA?.comercio ?? '') : materialA.nombre;
  const textoB = criterio === 'local' ? (precioB?.comercio ?? '') : materialB.nombre;
  return textoA.localeCompare(textoB, 'es', { sensitivity: 'base' }) * multiplicador;
}
