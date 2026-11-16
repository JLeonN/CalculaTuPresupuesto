import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { EstadoSuscripcion } from '@/dominio/suscripcion';
import { consultarEstadoSuscripcion } from '@/servicios/suscripcion/servicioSuscripcion';

/** Aún no se conecta a autenticación hasta completar el servidor y el uso sin conexión. */
export const useSuscripcionStore = defineStore('suscripcion', () => {
  const uid = ref<string | null>(null);
  const estado = ref<EstadoSuscripcion>({ tipo: 'pendiente' });
  const horaServidor = ref<number | null>(null);
  const cargando = ref(false);
  const error = ref<string | null>(null);
  let generacion = 0;

  function limpiar(): void {
    generacion += 1;
    uid.value = null;
    estado.value = { tipo: 'pendiente' };
    horaServidor.value = null;
    error.value = null;
    cargando.value = false;
  }

  async function cargar(idUsuario: string): Promise<void> {
    limpiar();
    if (!idUsuario) return;
    uid.value = idUsuario;
    const solicitud = generacion;
    cargando.value = true;
    try {
      const confirmado = await consultarEstadoSuscripcion();
      if (solicitud !== generacion || uid.value !== idUsuario) return;
      estado.value = confirmado.estado;
      horaServidor.value = confirmado.horaServidor;
    } catch {
      if (solicitud !== generacion || uid.value !== idUsuario) return;
      error.value = 'No se pudo verificar la suscripción. Comprobá la conexión e intentá nuevamente.';
    } finally {
      if (solicitud === generacion && uid.value === idUsuario) cargando.value = false;
    }
  }

  return { uid, estado, horaServidor, cargando, error, cargar, limpiar };
});
