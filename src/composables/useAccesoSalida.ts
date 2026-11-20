import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAutenticacionStore } from '@/stores/autenticacion';
import { useSuscripcionStore } from '@/stores/suscripcion';

export function useAccesoSalida() {
  const autenticacion = useAutenticacionStore();
  const suscripcion = useSuscripcionStore();
  const router = useRouter();
  const $q = useQuasar();
  function solicitarAccesoSalida(): void {
    if (!autenticacion.estaAutenticado) {
      autenticacion.solicitarInicioSesion();
      return;
    }
    if (
      suscripcion.estado.tipo === 'pendiente' ||
      (suscripcion.error && !suscripcion.acceso.puedeGenerarSalida)
    ) {
      $q.notify({
        message: 'Conectate para verificar tu suscripción e intentá nuevamente.',
        position: 'top',
        classes: 'notificacion-error',
      });
      return;
    }
    $q.notify({
      message: 'Para descargar, enviar o imprimir presupuestos necesitás Pro.',
      position: 'top',
      actions: [
        {
          label: 'Ver suscripción',
          handler: () => {
            void router.push({ path: '/configuracion', query: { seccion: 'suscripcion' } });
          },
        },
      ],
    });
  }
  return { solicitarAccesoSalida };
}
