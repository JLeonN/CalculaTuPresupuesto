import { createPinia } from 'pinia';
import { useSuscripcionStore } from '../../src/stores/suscripcion';

const suscripcion = useSuscripcionStore(createPinia());
const ventana = globalThis as typeof globalThis & {
  chEjecutarCiclo?: (accion: string) => Promise<string>;
  chEstadoSimulado?: 'pro' | 'pro-margen' | 'pro-vencido' | 'gratis' | 'sin-conexion';
};

ventana.chEjecutarCiclo = async (accion: string): Promise<string> => {
  ventana.chEstadoSimulado =
    accion === 'iniciar'
      ? 'pro'
      : accion === 'iniciar-margen'
        ? 'pro-margen'
        : accion === 'iniciar-vencido'
          ? 'pro-vencido'
          : accion === 'reconectar'
            ? 'gratis'
            : 'sin-conexion';
  await suscripcion.cargar('cuenta-ciclo-ficticia');
  const acceso = suscripcion.acceso.puedeGenerarSalida;
  const correcto = accion === 'iniciar' || accion === 'sin-conexion' ? acceso : !acceso;
  const reinicioDetectado =
    accion !== 'reinicio' || /Conectate para verificar/.test(suscripcion.error ?? '');
  return JSON.stringify({
    correcto: correcto && reinicioDetectado,
    accion,
    acceso,
    error: suscripcion.error,
  });
};
