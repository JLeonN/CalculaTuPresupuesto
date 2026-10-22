import { computed, ref } from 'vue';
import { coincideBusquedaPresupuesto } from '@/dominio/busquedaPresupuestos';
import {
  crearDatosPresupuestoConMaterialActualizado,
  type CambiosMaterialListaCompras,
} from '@/dominio/listaCompras';
import {
  actualizarPresupuesto,
  actualizarEstadoPresupuesto,
  crearPresupuesto,
  normalizarDatosPresupuesto,
  type DatosPresupuesto,
  type EstadoPresupuesto,
  type FormatoDocumentoPresupuesto,
  type Presupuesto,
} from '@/dominio/presupuestos';
import { crearRepositorioPresupuestos } from '@/repositorios/presupuestos/crearRepositorioPresupuestos';
import { acceptHMRUpdate, defineStore } from 'pinia';

const repositorioPresupuestos = crearRepositorioPresupuestos();

interface BorradorVistaPreviaPresupuesto {
  datos: DatosPresupuesto;
  rutaRetorno: string;
  idPresupuesto: string | null;
  estadoInicial: string;
  recuperarAlVolver: boolean;
}

export const usePresupuestosStore = defineStore('presupuestos', () => {
  const presupuestos = ref<Presupuesto[]>([]);
  const cargando = ref(false);
  const guardando = ref(false);
  const error = ref<string | null>(null);
  const borradorVistaPrevia = ref<BorradorVistaPreviaPresupuesto | null>(null);

  const presupuestosOrdenados = computed(() =>
    [...presupuestos.value].sort((presupuestoA, presupuestoB) => {
      const diferenciaFecha = presupuestoB.fechaPresupuesto.localeCompare(
        presupuestoA.fechaPresupuesto,
      );
      return (
        diferenciaFecha || presupuestoB.fechaCreacion.localeCompare(presupuestoA.fechaCreacion)
      );
    }),
  );

  async function cargarPresupuestos(): Promise<void> {
    cargando.value = true;
    error.value = null;

    try {
      presupuestos.value = await repositorioPresupuestos.obtenerTodos();
    } catch (errorCapturado) {
      error.value =
        errorCapturado instanceof Error
          ? errorCapturado.message
          : 'No se pudieron cargar los presupuestos guardados.';
    } finally {
      cargando.value = false;
    }
  }

  async function agregarPresupuesto(datos: DatosPresupuesto): Promise<Presupuesto> {
    guardando.value = true;
    error.value = null;

    try {
      const presupuesto = crearPresupuesto(datos);
      await repositorioPresupuestos.guardar(presupuesto);
      const presupuestosPersistidos = await repositorioPresupuestos.obtenerTodos();
      const presupuestoPersistido = presupuestosPersistidos.find(
        (presupuestoActual) => presupuestoActual.id === presupuesto.id,
      );

      if (presupuestoPersistido === undefined) {
        throw new Error('El presupuesto no apareció en el almacenamiento después de guardarlo.');
      }

      presupuestos.value = presupuestosPersistidos;
      return presupuestoPersistido;
    } catch (errorCapturado) {
      error.value =
        errorCapturado instanceof Error
          ? errorCapturado.message
          : 'No se pudo guardar el presupuesto.';
      throw new Error(error.value, { cause: errorCapturado });
    } finally {
      guardando.value = false;
    }
  }

  async function editarPresupuesto(
    idPresupuesto: string,
    datos: DatosPresupuesto,
  ): Promise<Presupuesto> {
    const presupuestoActual = obtenerPresupuestoPorId(idPresupuesto);

    if (presupuestoActual === undefined) {
      throw new Error('El presupuesto que intentás editar ya no existe.');
    }

    guardando.value = true;
    error.value = null;

    try {
      const presupuestoActualizado = actualizarPresupuesto(presupuestoActual, datos);
      await repositorioPresupuestos.guardar(presupuestoActualizado);
      presupuestos.value = presupuestos.value.map((presupuesto) =>
        presupuesto.id === idPresupuesto ? presupuestoActualizado : presupuesto,
      );
      return presupuestoActualizado;
    } catch (errorCapturado) {
      error.value =
        errorCapturado instanceof Error
          ? errorCapturado.message
          : 'No se pudieron guardar los cambios del presupuesto.';
      throw new Error(error.value, { cause: errorCapturado });
    } finally {
      guardando.value = false;
    }
  }

  async function actualizarMaterialListaCompras(
    idPresupuesto: string,
    idLinea: string,
    cambios: CambiosMaterialListaCompras,
  ): Promise<Presupuesto> {
    const presupuestoActual = obtenerPresupuestoPorId(idPresupuesto);
    if (!presupuestoActual) {
      throw new Error('El presupuesto que intentás actualizar ya no existe.');
    }
    if ('precioUnitario' in cambios && presupuestoActual.estado !== 'pendiente') {
      throw new Error(
        'Falta definir la regla de cambios de precio después de la aceptación del presupuesto.',
      );
    }
    const datos = crearDatosPresupuestoConMaterialActualizado(presupuestoActual, idLinea, cambios);
    return editarPresupuesto(idPresupuesto, datos);
  }

  async function cambiarFormatoDocumento(
    idPresupuesto: string,
    formatoDocumento: FormatoDocumentoPresupuesto,
  ): Promise<Presupuesto> {
    const presupuestoActual = obtenerPresupuestoPorId(idPresupuesto);
    if (!presupuestoActual) {
      throw new Error('El presupuesto cuyo formato intentás cambiar ya no existe.');
    }

    if (presupuestoActual.formatoDocumento === formatoDocumento) {
      return presupuestoActual;
    }

    guardando.value = true;
    error.value = null;
    try {
      const presupuestoActualizado = { ...presupuestoActual, formatoDocumento };
      await repositorioPresupuestos.guardar(presupuestoActualizado);
      presupuestos.value = presupuestos.value.map((actual) =>
        actual.id === idPresupuesto ? presupuestoActualizado : actual,
      );
      actualizarFormatoBorradorVistaPrevia(idPresupuesto, formatoDocumento);
      return presupuestoActualizado;
    } catch (errorCapturado) {
      error.value =
        errorCapturado instanceof Error
          ? errorCapturado.message
          : 'No se pudo guardar el formato del presupuesto.';
      throw new Error(error.value, { cause: errorCapturado });
    } finally {
      guardando.value = false;
    }
  }

  async function cambiarEstadoPresupuesto(
    idPresupuesto: string,
    estado: EstadoPresupuesto,
  ): Promise<Presupuesto> {
    const presupuestoActual = obtenerPresupuestoPorId(idPresupuesto);

    if (presupuestoActual === undefined) {
      throw new Error('El presupuesto cuyo estado intentás cambiar ya no existe.');
    }

    if (presupuestoActual.estado === estado) {
      return presupuestoActual;
    }

    guardando.value = true;
    error.value = null;

    try {
      const presupuestoActualizado = actualizarEstadoPresupuesto(presupuestoActual, estado);
      await repositorioPresupuestos.guardar(presupuestoActualizado);
      presupuestos.value = presupuestos.value.map((presupuesto) =>
        presupuesto.id === idPresupuesto ? presupuestoActualizado : presupuesto,
      );
      return presupuestoActualizado;
    } catch (errorCapturado) {
      error.value =
        errorCapturado instanceof Error
          ? errorCapturado.message
          : 'No se pudo cambiar el estado del presupuesto.';
      throw new Error(error.value, { cause: errorCapturado });
    } finally {
      guardando.value = false;
    }
  }

  function obtenerPresupuestoPorId(idPresupuesto: string): Presupuesto | undefined {
    return presupuestos.value.find((presupuesto) => presupuesto.id === idPresupuesto);
  }

  function buscarPresupuestos(termino: string): Presupuesto[] {
    if (termino.trim() === '') {
      return presupuestosOrdenados.value;
    }

    return presupuestosOrdenados.value.filter((presupuesto) =>
      coincideBusquedaPresupuesto(presupuesto, termino),
    );
  }

  function establecerBorradorVistaPrevia(
    datos: DatosPresupuesto,
    rutaRetorno: string,
    idPresupuesto: string | null,
    estadoInicial: string,
  ): void {
    borradorVistaPrevia.value = {
      datos: normalizarDatosPresupuesto(datos),
      rutaRetorno,
      idPresupuesto,
      estadoInicial,
      recuperarAlVolver: false,
    };
  }

  function obtenerBorradorVistaPrevia(
    idPresupuesto: string | null,
  ): BorradorVistaPreviaPresupuesto | null {
    return borradorVistaPrevia.value?.idPresupuesto === idPresupuesto
      ? borradorVistaPrevia.value
      : null;
  }

  function marcarRetornoVistaPrevia(rutaRetorno: string): void {
    if (borradorVistaPrevia.value?.rutaRetorno === rutaRetorno) {
      borradorVistaPrevia.value.recuperarAlVolver = true;
    }
  }

  function descartarBorradorVistaPrevia(): void {
    borradorVistaPrevia.value = null;
  }

  function actualizarFormatoBorradorVistaPrevia(
    idPresupuesto: string | null,
    formatoDocumento: FormatoDocumentoPresupuesto,
  ): void {
    if (borradorVistaPrevia.value?.idPresupuesto === idPresupuesto) {
      borradorVistaPrevia.value.datos.formatoDocumento = formatoDocumento;
    }
  }

  function consumirBorradorVistaPrevia(
    rutaActual: string,
    idPresupuesto: string | null,
  ): BorradorVistaPreviaPresupuesto | null {
    const borrador = borradorVistaPrevia.value;

    if (
      borrador === null ||
      !borrador.recuperarAlVolver ||
      borrador.rutaRetorno !== rutaActual ||
      borrador.idPresupuesto !== idPresupuesto
    ) {
      return null;
    }

    borradorVistaPrevia.value = null;
    return borrador;
  }

  return {
    presupuestos,
    presupuestosOrdenados,
    cargando,
    guardando,
    error,
    cargarPresupuestos,
    agregarPresupuesto,
    editarPresupuesto,
    actualizarMaterialListaCompras,
    cambiarFormatoDocumento,
    cambiarEstadoPresupuesto,
    obtenerPresupuestoPorId,
    buscarPresupuestos,
    establecerBorradorVistaPrevia,
    obtenerBorradorVistaPrevia,
    marcarRetornoVistaPrevia,
    descartarBorradorVistaPrevia,
    actualizarFormatoBorradorVistaPrevia,
    consumirBorradorVistaPrevia,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePresupuestosStore, import.meta.hot));
}
