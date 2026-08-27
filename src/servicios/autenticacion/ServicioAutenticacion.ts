import type { CredencialesAcceso, UsuarioAutenticado } from '@/dominio/autenticacion';

export interface ServicioAutenticacion {
  obtenerUsuarioActual(): Promise<UsuarioAutenticado | null>;
  iniciarSesion(credenciales: CredencialesAcceso): Promise<UsuarioAutenticado>;
  cerrarSesion(): Promise<void>;
}
