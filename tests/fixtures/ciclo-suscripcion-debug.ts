import { createPinia } from 'pinia';
import { useSuscripcionStore } from '../../src/stores/suscripcion';
import { Preferences } from '@capacitor/preferences';

const suscripcion = useSuscripcionStore(createPinia());
const ventana = globalThis as typeof globalThis & {
  chEjecutarCiclo?: (accion: string) => Promise<string>;
  chEstadoSimulado?: 'pro' | 'pro-margen' | 'pro-vencido' | 'gratis' | 'sin-conexion';
};

ventana.chEjecutarCiclo = async (accion: string): Promise<string> => {
  if (accion === 'referencia-ausente')
    await Preferences.remove({ key: 'ch:referencia-ciclo-ficticio' });
  if (accion === 'referencia-corrupta')
    await Preferences.set({ key: 'ch:referencia-ciclo-ficticio', value: '{invalido' });
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
  await suscripcion.cargar(
    accion === 'otra-cuenta' ? 'otra-cuenta-ficticia' : 'cuenta-ciclo-ficticia',
  );
  const acceso = suscripcion.acceso.puedeGenerarSalida;
  const correcto = accion === 'iniciar' || accion === 'sin-conexion' ? acceso : !acceso;
  const reinicioDetectado =
    accion !== 'reinicio' || /Conectate para verificar/.test(suscripcion.error ?? '');
  const referenciaRechazada =
    (!accion.startsWith('referencia-') && accion !== 'otra-cuenta') ||
    (suscripcion.estado.tipo === 'pendiente' && !!suscripcion.error);
  return JSON.stringify({
    correcto: correcto && reinicioDetectado && referenciaRechazada,
    accion,
    acceso,
    error: suscripcion.error,
  });
};
