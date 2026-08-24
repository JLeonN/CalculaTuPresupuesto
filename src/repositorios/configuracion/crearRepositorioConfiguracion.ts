import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import { RepositorioConfiguracionLocal } from './RepositorioConfiguracionLocal';
import type { RepositorioConfiguracion } from './RepositorioConfiguracion';

export function crearRepositorioConfiguracion(): RepositorioConfiguracion {
  // TODO(firebase): reemplazar esta selección por un repositorio Firestore para la configuración.
  return new RepositorioConfiguracionLocal(crearAlmacenamientoAplicacion());
}
