import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { resolverAccesoSuscripcion, type EstadoSuscripcion } from '@/dominio/suscripcion';
import {
  confirmarAvisoPrueba,
  consultarEstadoSuscripcion,
  reconciliarSuscripcion,
} from '@/servicios/suscripcion/servicioSuscripcion';
import { Capacitor } from '@capacitor/core';
import { obtenerFirebase } from '@/configuracion/firebase';
import { obtenerReferenciaRelojAndroid } from '@/servicios/suscripcion/relojAndroid';
import { evaluarReferenciaSinConexion } from '@/servicios/suscripcion/referenciaTiempo';
import { resolverAccesoAndroidSinConexion } from '@/servicios/suscripcion/accesoSinConexion';
import {
  eliminarReferenciaSuscripcion,
  guardarReferenciaSuscripcion,
  leerReferenciaSuscripcion,
  type ReferenciaPersistida,
} from '@/servicios/suscripcion/referenciaPersistente';

export const useSuscripcionStore = defineStore('suscripcion', () => {
  const uid = ref<string | null>(null);
  const estado = ref<EstadoSuscripcion>({ tipo: 'pendiente' });
  const horaServidor = ref<number | null>(null);
  const cargando = ref(false);
  const error = ref<string | null>(null);
  const avisoPruebaVisible = ref(false);
  let generacion = 0;
  let referenciaMonotona: number | null = null;
  let intervalo: ReturnType<typeof setInterval> | null = null;
  let referenciaOffline: ReferenciaPersistida | null = null;
  let revisandoReloj = false;
  let operacionesReferencia: Promise<void> = Promise.resolve();
  let cambioPendiente: { tipo: string; vencimiento: number | null; permiteMargen: boolean } | null =
    null;
  const accesoOffline = ref<ReturnType<typeof resolverAccesoSuscripcion> | null>(null);
  const pulso = ref(0);
  function actualizarReferenciaPersistida(
    solicitud: number,
    operacion: () => Promise<void>,
  ): Promise<void> {
    const pendiente = operacionesReferencia.then(async () => {
      if (solicitud === generacion) await operacion();
    });
    operacionesReferencia = pendiente.catch(() => {});
    return pendiente;
  }
  const acceso = computed(() => {
    void pulso.value;
    if (referenciaOffline)
      return accesoOffline.value ?? resolverAccesoSuscripcion({ tipo: 'pendiente' }, NaN);
    const fecha =
      horaServidor.value !== null && referenciaMonotona !== null
        ? horaServidor.value + Math.max(0, performance.now() - referenciaMonotona)
        : NaN;
    return resolverAccesoSuscripcion(estado.value, fecha);
  });

  function limpiar(): void {
    generacion += 1;
    uid.value = null;
    estado.value = { tipo: 'pendiente' };
    horaServidor.value = null;
    referenciaMonotona = null;
    referenciaOffline = null;
    accesoOffline.value = null;
    revisandoReloj = false;
    cambioPendiente = null;
    if (intervalo !== null) clearInterval(intervalo);
    intervalo = null;
    error.value = null;
    avisoPruebaVisible.value = false;
    cargando.value = false;
  }

  function notificarCambio(tipo: string, vencimiento: number | null, permiteMargen: boolean): void {
    const idUsuario = uid.value;
    if (!idUsuario) return;
    if (cargando.value) {
      cambioPendiente = { tipo, vencimiento, permiteMargen };
      return;
    }
    const actual = estado.value;
    const vencimientoActual =
      actual.tipo === 'prueba' || actual.tipo === 'pro' ? actual.vencimiento : null;
    if (
      actual.tipo !== tipo ||
      vencimientoActual !== vencimiento ||
      (actual.tipo === 'pro' && (actual.permiteMargen === true) !== permiteMargen)
    )
      void cargar(idUsuario);
  }

  async function actualizarAccesoOffline(
    referencia: ReferenciaPersistida,
    solicitud: number,
    permitirMargen: boolean,
  ): Promise<void> {
    if (revisandoReloj) return;
    revisandoReloj = true;
    try {
      const reloj = await obtenerReferenciaRelojAndroid();
      if (solicitud !== generacion || uid.value !== referencia.uid) return;
      const evaluacion = evaluarReferenciaSinConexion(
        referencia,
        referencia.uid,
        referencia.proyectoFirebase,
        reloj,
      );
      if (!evaluacion) throw new Error('Referencia temporal no verificable.');
      if (referencia.tipo === 'prueba' || referencia.tipo === 'pro') {
        accesoOffline.value = permitirMargen
          ? resolverAccesoAndroidSinConexion(
              referencia.tipo,
              referencia,
              referencia.uid,
              referencia.proyectoFirebase,
              reloj,
              referencia.permiteMargen === true,
            ).acceso
          : resolverAccesoSuscripcion(
              { tipo: referencia.tipo, vencimiento: referencia.vencimiento },
              evaluacion.fechaEstimada,
            );
      } else {
        accesoOffline.value = resolverAccesoSuscripcion(
          { tipo: referencia.tipo },
          evaluacion.fechaEstimada,
        );
      }
    } catch {
      if (solicitud === generacion) {
        accesoOffline.value = resolverAccesoSuscripcion({ tipo: 'pendiente' }, NaN);
        error.value = 'Conectate para verificar tu suscripción. Tus datos permanecen guardados.';
      }
    } finally {
      revisandoReloj = false;
      if (solicitud === generacion) pulso.value += 1;
    }
  }

  async function cargar(idUsuario: string): Promise<void> {
    const referenciaWebAnterior =
      Capacitor.getPlatform() === 'web' &&
      uid.value === idUsuario &&
      estado.value.tipo !== 'pendiente' &&
      horaServidor.value !== null &&
      referenciaMonotona !== null
        ? {
            estado: estado.value,
            horaServidor: horaServidor.value,
            referenciaMonotona,
          }
        : null;
    limpiar();
    if (!idUsuario) return;
    uid.value = idUsuario;
    const solicitud = generacion;
    const inicio = performance.now();
    cargando.value = true;
    const android = Capacitor.getPlatform() === 'android';
    let proyecto = '';
    let relojInicial: Awaited<ReturnType<typeof obtenerReferenciaRelojAndroid>> | null = null;
    let permitirMargen = false;
    try {
      proyecto = obtenerFirebase().aplicacion.options.projectId ?? '';
      if (android) {
        try {
          relojInicial = await obtenerReferenciaRelojAndroid();
        } catch {
          /* La consulta en línea sigue disponible. */
        }
      }
      let confirmado = await consultarEstadoSuscripcion();
      if (solicitud !== generacion || uid.value !== idUsuario) return;
      if (confirmado.estado.tipo === 'pro') {
        try {
          const resultado = await reconciliarSuscripcion();
          if (solicitud !== generacion || uid.value !== idUsuario) return;
          if (resultado === 'sin-compra') throw new Error('No hay una compra asociada.');
          if (resultado === 'actualizada') confirmado = await consultarEstadoSuscripcion();
        } catch {
          if (solicitud !== generacion || uid.value !== idUsuario) return;
          permitirMargen = true;
          error.value = 'No se pudo actualizar la compra. Se muestra el último estado confirmado.';
        }
      }
      if (solicitud !== generacion || uid.value !== idUsuario) return;
      let referenciaActual: ReferenciaPersistida | null = null;
      if (android) {
        try {
          const estadoConfirmado = confirmado.estado;
          if (relojInicial && estadoConfirmado.tipo !== 'pendiente') {
            referenciaActual = {
              uid: idUsuario,
              tipo: estadoConfirmado.tipo,
              ...(estadoConfirmado.tipo === 'pro'
                ? { permiteMargen: estadoConfirmado.permiteMargen === true }
                : {}),
              proyectoFirebase: proyecto,
              horaServidor: confirmado.horaServidor,
              vencimiento:
                estadoConfirmado.tipo === 'prueba' || estadoConfirmado.tipo === 'pro'
                  ? estadoConfirmado.vencimiento
                  : 0,
              reloj: relojInicial,
            };
            await actualizarReferenciaPersistida(solicitud, () =>
              guardarReferenciaSuscripcion(referenciaActual!),
            );
          } else await actualizarReferenciaPersistida(solicitud, eliminarReferenciaSuscripcion);
        } catch {
          try {
            await actualizarReferenciaPersistida(solicitud, eliminarReferenciaSuscripcion);
          } catch {
            /* No se confía en la referencia local. */
          }
        }
      }
      if (solicitud !== generacion || uid.value !== idUsuario) return;
      estado.value = confirmado.estado;
      avisoPruebaVisible.value = confirmado.mostrarAvisoPrueba;
      horaServidor.value = confirmado.horaServidor;
      referenciaMonotona = inicio;
      if (android && referenciaActual) {
        referenciaOffline = referenciaActual;
        await actualizarAccesoOffline(referenciaActual, solicitud, permitirMargen);
        if (solicitud !== generacion || uid.value !== idUsuario) return;
        intervalo = setInterval(() => {
          void actualizarAccesoOffline(
            referenciaActual,
            solicitud,
            permitirMargen || !navigator.onLine,
          );
        }, 1000);
      } else if (android) {
        estado.value = { tipo: 'pendiente' };
        error.value = 'Conectate para verificar el tiempo de tu suscripción.';
      } else
        intervalo = setInterval(() => {
          pulso.value += 1;
        }, 1000);
    } catch {
      if (solicitud !== generacion || uid.value !== idUsuario) return;
      if (android) {
        try {
          await operacionesReferencia;
          if (solicitud !== generacion || uid.value !== idUsuario) return;
          const guardada = await leerReferenciaSuscripcion(idUsuario, proyecto);
          if (solicitud !== generacion || uid.value !== idUsuario) return;
          if (guardada) {
            referenciaOffline = guardada;
            estado.value =
              guardada.tipo === 'pro' || guardada.tipo === 'prueba'
                ? {
                    tipo: guardada.tipo,
                    vencimiento: guardada.vencimiento,
                    ...(guardada.tipo === 'pro'
                      ? { permiteMargen: guardada.permiteMargen === true }
                      : {}),
                  }
                : { tipo: guardada.tipo };
            await actualizarAccesoOffline(guardada, solicitud, true);
            if (solicitud !== generacion || uid.value !== idUsuario) return;
            intervalo = setInterval(() => {
              void actualizarAccesoOffline(guardada, solicitud, true);
            }, 1000);
          }
        } catch {
          /* Sin referencia válida se mantiene el estado pendiente. */
        }
      } else if (referenciaWebAnterior) {
        // La web abierta conserva solo el último estado de esta cuenta y su reloj monotónico.
        estado.value = referenciaWebAnterior.estado;
        horaServidor.value = referenciaWebAnterior.horaServidor;
        referenciaMonotona = referenciaWebAnterior.referenciaMonotona;
        intervalo = setInterval(() => {
          pulso.value += 1;
        }, 1000);
      }
      if (!error.value)
        error.value =
          'No se pudo verificar la suscripción. Comprobá la conexión e intentá nuevamente.';
    } finally {
      if (solicitud === generacion && uid.value === idUsuario) {
        cargando.value = false;
        const cambio = cambioPendiente;
        cambioPendiente = null;
        if (cambio) notificarCambio(cambio.tipo, cambio.vencimiento, cambio.permiteMargen);
      }
    }
  }

  async function cerrarAvisoPrueba(): Promise<void> {
    const solicitud = generacion;
    avisoPruebaVisible.value = false;
    try {
      await confirmarAvisoPrueba();
    } catch {
      if (solicitud === generacion)
        error.value = 'No se pudo guardar la confirmación. Revisá la conexión.';
    }
  }

  return {
    uid,
    estado,
    horaServidor,
    cargando,
    error,
    acceso,
    avisoPruebaVisible,
    cargar,
    limpiar,
    cerrarAvisoPrueba,
    notificarCambio,
  };
});
