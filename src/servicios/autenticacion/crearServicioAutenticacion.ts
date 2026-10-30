import { estaFirebaseConfigurado } from '@/configuracion/firebase';
import type { ServicioAutenticacion } from './ServicioAutenticacion';
import { ServicioAutenticacionFirebase } from './ServicioAutenticacionFirebase';
import { ServicioAutenticacionVisitante } from './ServicioAutenticacionVisitante';

export function crearServicioAutenticacion(): ServicioAutenticacion {
  if (estaFirebaseConfigurado()) return new ServicioAutenticacionFirebase();
  return new ServicioAutenticacionVisitante();
}
