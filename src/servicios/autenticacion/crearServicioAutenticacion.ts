import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import type { ServicioAutenticacion } from './ServicioAutenticacion';
import { ServicioAutenticacionPrueba } from './ServicioAutenticacionPrueba';

export function crearServicioAutenticacion(): ServicioAutenticacion {
  // TODO(firebase): sustituir únicamente este proveedor por Firebase Authentication.
  return new ServicioAutenticacionPrueba(
    crearAlmacenamientoAplicacion(),
    String(import.meta.env.QCLI_USUARIO_PRUEBA ?? ''),
    String(import.meta.env.QCLI_CONTRASENA_PRUEBA ?? ''),
  );
}
