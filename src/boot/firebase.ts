import { defineBoot } from '#q-app';
import { Notify } from 'quasar';
import { estaFirebaseConfigurado, obtenerFirebase } from '@/configuracion/firebase';

export default defineBoot(() => {
  if (!estaFirebaseConfigurado()) return;
  obtenerFirebase();
  window.addEventListener('firebase-sincronizacion', (evento) => {
    const estado = (evento as CustomEvent<'pendiente' | 'sincronizado' | 'error'>).detail;
    const mensaje =
      estado === 'pendiente'
        ? 'Cambio guardado en este dispositivo. Se sincronizará al recuperar conexión.'
        : estado === 'sincronizado'
          ? 'Cambios sincronizados con Firebase.'
          : 'No se pudo sincronizar un cambio. Revisá la conexión y volvé a cargar los datos.';
    Notify.create({
      message: mensaje,
      position: 'top',
      classes: estado === 'error' ? 'notificacion-error' : 'notificacion-exito',
    });
  });
});
