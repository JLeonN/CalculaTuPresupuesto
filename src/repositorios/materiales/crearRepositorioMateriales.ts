import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import { RepositorioMaterialesLocal } from './RepositorioMaterialesLocal';
import { RepositorioMaterialesFirestore } from './RepositorioMaterialesFirestore';
import { crearRepositorioSegunSesion } from '@/repositorios/almacenamiento/crearRepositorioSegunSesion';
import type { RepositorioMateriales } from './RepositorioMateriales';

export function crearRepositorioMateriales(): RepositorioMateriales {
  return crearRepositorioSegunSesion<RepositorioMateriales>(
    () => new RepositorioMaterialesLocal(crearAlmacenamientoAplicacion()),
    (uid) => new RepositorioMaterialesFirestore(uid),
  );
}
