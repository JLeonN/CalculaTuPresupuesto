import { computed, ref } from 'vue';
import {
  ErrorAccesoProvisional,
  type CredencialesAcceso,
  type UsuarioAutenticado,
} from '@/dominio/autenticacion';
import { crearServicioAutenticacion } from '@/servicios/autenticacion/crearServicioAutenticacion';
import { defineStore } from 'pinia';

const servicioAutenticacion = crearServicioAutenticacion();

export const useAutenticacionStore = defineStore('autenticacion', () => {
  const usuario = ref<UsuarioAutenticado | null>(null);
  const cargando = ref(false);
  const inicializada = ref(false);
  const error = ref<string | null>(null);
  const modalInicioSesionVisible = ref(false);
  const estaAutenticado = computed(() => usuario.value !== null);
  const puedeGenerarSalidaPresupuesto = computed(() => estaAutenticado.value);
  let promesaInicializacion: Promise<void> | null = null;

  function inicializarSesion(): Promise<void> {
    if (inicializada.value) {
      return Promise.resolve();
    }

    if (promesaInicializacion) {
      return promesaInicializacion;
    }

    cargando.value = true;
    error.value = null;
    promesaInicializacion = servicioAutenticacion
      .obtenerUsuarioActual()
      .then((usuarioRecuperado) => {
        usuario.value = usuarioRecuperado;
      })
      .catch(() => {
        usuario.value = null;
        error.value = 'No se pudo recuperar la sesión. Podés continuar como visitante.';
      })
      .finally(() => {
        cargando.value = false;
        inicializada.value = true;
        promesaInicializacion = null;
      });

    return promesaInicializacion;
  }

  async function iniciarSesion(credenciales: CredencialesAcceso): Promise<boolean> {
    cargando.value = true;
    error.value = null;

    try {
      usuario.value = await servicioAutenticacion.iniciarSesion(credenciales);
      modalInicioSesionVisible.value = false;
      return true;
    } catch (errorCapturado) {
      error.value =
        errorCapturado instanceof ErrorAccesoProvisional
          ? errorCapturado.message
          : 'No se pudo iniciar sesión. Intentá nuevamente.';
      return false;
    } finally {
      cargando.value = false;
    }
  }

  async function cerrarSesion(): Promise<boolean> {
    cargando.value = true;
    error.value = null;

    try {
      await servicioAutenticacion.cerrarSesion();
      usuario.value = null;
      return true;
    } catch {
      error.value = 'No se pudo cerrar la sesión.';
      return false;
    } finally {
      cargando.value = false;
    }
  }

  function solicitarInicioSesion(): void {
    error.value = null;
    modalInicioSesionVisible.value = true;
  }

  function cerrarModalInicioSesion(): void {
    error.value = null;
    modalInicioSesionVisible.value = false;
  }

  return {
    usuario,
    cargando,
    inicializada,
    error,
    modalInicioSesionVisible,
    estaAutenticado,
    puedeGenerarSalidaPresupuesto,
    inicializarSesion,
    iniciarSesion,
    cerrarSesion,
    solicitarInicioSesion,
    cerrarModalInicioSesion,
  };
});
