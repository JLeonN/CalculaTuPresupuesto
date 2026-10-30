import { esMaterialGuardado, type Material } from '@/dominio/materiales';
import { RepositorioColeccionFirestore } from '@/repositorios/almacenamiento/RepositorioColeccionFirestore';
import type { RepositorioMateriales } from './RepositorioMateriales';

export class RepositorioMaterialesFirestore
  extends RepositorioColeccionFirestore<Material>
  implements RepositorioMateriales
{
  constructor(uid: string) {
    super(uid, 'materiales', esMaterialGuardado);
  }
}
