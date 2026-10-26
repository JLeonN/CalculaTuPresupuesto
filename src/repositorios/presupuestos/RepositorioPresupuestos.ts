import type { Presupuesto } from '@/dominio/presupuestos';

export interface RepositorioPresupuestos {
  obtenerTodos(): Promise<Presupuesto[]>;
  agregarFaltantes(presupuestos: readonly Presupuesto[]): Promise<number>;
  guardar(presupuesto: Presupuesto): Promise<void>;
}
