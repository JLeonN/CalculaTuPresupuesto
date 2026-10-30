import { computed, ref } from 'vue';
import { estaFirebaseConfigurado } from '@/configuracion/firebase';
import type { CredencialesAcceso, UsuarioAutenticado } from '@/dominio/autenticacion';
import { crearServicioAutenticacion } from '@/servicios/autenticacion/crearServicioAutenticacion';
import { obtenerMensajeErrorAcceso } from '@/servicios/autenticacion/ServicioAutenticacionFirebase';
import { useClientesStore } from './clientes';
import { useMaterialesStore } from './materiales';
import { usePresupuestosStore } from './presupuestos';
import { useConfiguracionStore } from './configuracion';
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
  const firebaseActivo = estaFirebaseConfigurado();
  let promesaInicializacion: Promise<void> | null = null;
  let dejarDeObservar: (() => void) | null = null;

  function actualizarUsuario(usuarioNuevo: UsuarioAutenticado | null): void {
    const idAnterior = usuario.value?.id ?? null;
    const idNuevo = usuarioNuevo?.id ?? null;
    if (idAnterior !== idNuevo) {
      usuario.value = null;
      useClientesStore().invalidarDatos();
      useMaterialesStore().invalidarDatos();
      usePresupuestosStore().invalidarDatos();
      useConfiguracionStore().invalidarDatos();
    }
    usuario.value = usuarioNuevo;
    if (idAnterior !== idNuevo) {
      void Promise.all([
        useClientesStore().cargarClientes(),
        useMaterialesStore().cargarMateriales(),
        usePresupuestosStore().cargarPresupuestos(),
        useConfiguracionStore().cargarConfiguracion(),
      ]);
    }
  }

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
        actualizarUsuario(usuarioRecuperado);
        dejarDeObservar ??= servicioAutenticacion.observarCambios(actualizarUsuario);
      })
      .catch(() => {
        actualizarUsuario(null);
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
      actualizarUsuario(await servicioAutenticacion.iniciarSesion(credenciales));
      modalInicioSesionVisible.value = false;
      return true;
    } catch (errorCapturado) {
      error.value = obtenerMensajeErrorAcceso(errorCapturado);
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
      actualizarUsuario(null);
      return true;
    } catch {
      error.value = 'No se pudo cerrar la sesión.';
      return false;
    } finally {
      cargando.value = false;
    }
  }

  async function ejecutarOperacion(
    operacion: () => Promise<void | UsuarioAutenticado>,
  ): Promise<boolean> {
    if (cargando.value) return false;
    cargando.value = true;
    error.value = null;
    try {
      const resultado = await operacion();
      if (resultado) {
        actualizarUsuario(resultado);
        modalInicioSesionVisible.value = false;
      }
      return true;
    } catch (errorCapturado) {
      error.value = obtenerMensajeErrorAcceso(errorCapturado);
      return false;
    } finally {
      cargando.value = false;
    }
  }

  function registrarConCorreo(
    correo: string,
    contrasena: string,
    nombre: string,
  ): Promise<boolean> {
    return ejecutarOperacion(() =>
      servicioAutenticacion.registrarConCorreo(correo, contrasena, nombre),
    );
  }

  function iniciarSesionConGoogle(): Promise<boolean> {
    return ejecutarOperacion(() => servicioAutenticacion.iniciarSesionConGoogle());
  }

  function vincularGoogle(): Promise<boolean> {
    return ejecutarOperacion(() => servicioAutenticacion.vincularGoogle());
  }

  function enviarRecuperacionContrasena(correo: string): Promise<boolean> {
    return ejecutarOperacion(() => servicioAutenticacion.enviarRecuperacionContrasena(correo));
  }

  function reenviarVerificacion(correo: string, contrasena: string): Promise<boolean> {
    return ejecutarOperacion(() => servicioAutenticacion.reenviarVerificacion(correo, contrasena));
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
    firebaseActivo,
    inicializarSesion,
    iniciarSesion,
    registrarConCorreo,
    iniciarSesionConGoogle,
    vincularGoogle,
    enviarRecuperacionContrasena,
    reenviarVerificacion,
    cerrarSesion,
    solicitarInicioSesion,
    cerrarModalInicioSesion,
  };
});
