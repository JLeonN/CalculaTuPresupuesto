import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import { RepositorioClientesLocal } from './RepositorioClientesLocal';
import type { RepositorioClientes } from './RepositorioClientes';

export function crearRepositorioClientes(): RepositorioClientes {
  // TODO(firebase): reemplazar esta selección por un repositorio Firestore que conserve el contrato asíncrono.
  return new RepositorioClientesLocal(crearAlmacenamientoAplicacion());
}
