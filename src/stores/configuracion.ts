import { computed, ref } from 'vue';
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
  const monedaPrincipal = computed(() => configuracion.value.monedaPrincipal);
  let promesaCarga: Promise<void> | null = null;
  let versionDatos = 0;

  function invalidarDatos(): void {
    versionDatos += 1;
    configuracion.value = crearConfiguracionInicial();
    configuracionCargada.value = false;
    cargando.value = false;
    guardando.value = false;
    guardadoCorrectamente.value = false;
    error.value = null;
    promesaCarga = null;
  }

  async function cargarConfiguracion(): Promise<void> {
    const version = versionDatos;
    cargando.value = true;
    guardadoCorrectamente.value = false;
    error.value = null;

    try {
      const resultado = await repositorioConfiguracion.obtener();
      if (version === versionDatos) {
        configuracion.value = resultado;
        configuracionCargada.value = true;
      }
    } catch {
      if (version === versionDatos) {
        configuracionCargada.value = false;
        error.value = 'No se pudo cargar la configuración guardada.';
      }
    } finally {
      if (version === versionDatos) cargando.value = false;
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
    const version = versionDatos;
    guardando.value = true;
    guardadoCorrectamente.value = false;
    error.value = null;

    try {
      const configuracionActualizada = actualizarConfiguracion(datos);
      await repositorioConfiguracion.guardar(configuracionActualizada);
      if (version !== versionDatos) throw new Error('La sesión cambió durante el guardado.');
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
    monedaPrincipal,
    cargarConfiguracion,
    asegurarConfiguracionCargada,
    guardarConfiguracion,
    limpiarEstadoGuardado,
    invalidarDatos,
  };
});
