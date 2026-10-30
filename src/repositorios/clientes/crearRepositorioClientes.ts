import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import { RepositorioClientesLocal } from './RepositorioClientesLocal';
import { RepositorioClientesFirestore } from './RepositorioClientesFirestore';
import { crearRepositorioSegunSesion } from '@/repositorios/almacenamiento/crearRepositorioSegunSesion';
import type { RepositorioClientes } from './RepositorioClientes';

export function crearRepositorioClientes(): RepositorioClientes {
  return crearRepositorioSegunSesion<RepositorioClientes>(
    () => new RepositorioClientesLocal(crearAlmacenamientoAplicacion()),
    (uid) => new RepositorioClientesFirestore(uid),
  );
}
