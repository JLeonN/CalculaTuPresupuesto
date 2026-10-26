import type { Cliente } from '@/dominio/clientes';

export interface RepositorioClientes {
  obtenerTodos(): Promise<Cliente[]>;
  agregarFaltantes(clientes: readonly Cliente[]): Promise<number>;
  guardar(cliente: Cliente): Promise<void>;
  eliminar(idCliente: string): Promise<void>;
}
