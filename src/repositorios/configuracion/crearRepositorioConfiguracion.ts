import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import { RepositorioConfiguracionLocal } from './RepositorioConfiguracionLocal';
import { RepositorioConfiguracionFirestore } from './RepositorioConfiguracionFirestore';
import { crearRepositorioSegunSesion } from '@/repositorios/almacenamiento/crearRepositorioSegunSesion';
import type { RepositorioConfiguracion } from './RepositorioConfiguracion';

export function crearRepositorioConfiguracion(): RepositorioConfiguracion {
  return crearRepositorioSegunSesion<RepositorioConfiguracion>(
    () => new RepositorioConfiguracionLocal(crearAlmacenamientoAplicacion()),
    (uid) => new RepositorioConfiguracionFirestore(uid),
  );
}
