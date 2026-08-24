import { ref } from 'vue';
import {
  actualizarConfiguracion,
  crearConfiguracionInicial,
  type Configuracion,
  type DatosConfiguracion,
} from '@/dominio/configuracion';
import { crearRepositorioConfiguracion } from '@/repositorios/configuracion/crearRepositorioConfiguracion';
import { defineStore } from 'pinia';

const repositorioConfiguracion = crearRepositorioConfiguracion();

export const useConfiguracionStore = defineStore('configuracion', () => {
  const configuracion = ref<Configuracion>(crearConfiguracionInicial());
  const configuracionCargada = ref(false);
  const cargando = ref(false);
  const guardando = ref(false);
  const guardadoCorrectamente = ref(false);
  const error = ref<string | null>(null);
  let promesaCarga: Promise<void> | null = null;

  async function cargarConfiguracion(): Promise<void> {
    cargando.value = true;
    guardadoCorrectamente.value = false;
    error.value = null;

    try {
      configuracion.value = await repositorioConfiguracion.obtener();
      configuracionCargada.value = true;
    } catch {
      configuracionCargada.value = false;
      error.value = 'No se pudo cargar la configuración guardada.';
    } finally {
      cargando.value = false;
    }
  }

  function asegurarConfiguracionCargada(): Promise<void> {
    if (configuracionCargada.value) {
      return Promise.resolve();
    }

    if (promesaCarga) {
      return promesaCarga;
    }

    promesaCarga = cargarConfiguracion().finally(() => {
      promesaCarga = null;
    });
    return promesaCarga;
  }

  async function guardarConfiguracion(datos: DatosConfiguracion): Promise<Configuracion> {
    guardando.value = true;
    guardadoCorrectamente.value = false;
    error.value = null;

    try {
      const configuracionActualizada = actualizarConfiguracion(datos);
      await repositorioConfiguracion.guardar(configuracionActualizada);
      configuracion.value = configuracionActualizada;
      configuracionCargada.value = true;
      guardadoCorrectamente.value = true;
      return configuracionActualizada;
    } catch (errorCapturado) {
      error.value =
        errorCapturado instanceof RangeError
          ? errorCapturado.message
          : 'No se pudo guardar la configuración.';
      throw new Error(error.value, { cause: errorCapturado });
    } finally {
      guardando.value = false;
    }
  }

  function limpiarEstadoGuardado(): void {
    guardadoCorrectamente.value = false;
  }

  return {
    configuracion,
    configuracionCargada,
    cargando,
    guardando,
    guardadoCorrectamente,
    error,
    cargarConfiguracion,
    asegurarConfiguracionCargada,
    guardarConfiguracion,
    limpiarEstadoGuardado,
  };
});
