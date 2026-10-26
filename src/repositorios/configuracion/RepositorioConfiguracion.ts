import type { Configuracion } from '@/dominio/configuracion';

export interface RepositorioConfiguracion {
  obtener(): Promise<Configuracion>;
  obtenerGuardada(): Promise<Configuracion | null>;
  guardar(configuracion: Configuracion): Promise<void>;
  guardarSiAusente(configuracion: Configuracion): Promise<boolean>;
}
