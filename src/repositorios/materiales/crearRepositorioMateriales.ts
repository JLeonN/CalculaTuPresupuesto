import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import { RepositorioMaterialesLocal } from './RepositorioMaterialesLocal';
import type { RepositorioMateriales } from './RepositorioMateriales';

export function crearRepositorioMateriales(): RepositorioMateriales {
  // TODO(firebase): reemplazar esta selección por un repositorio Firestore para materiales.
  return new RepositorioMaterialesLocal(crearAlmacenamientoAplicacion());
}
