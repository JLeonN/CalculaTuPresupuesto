import type { CredencialesAcceso, UsuarioAutenticado } from '@/dominio/autenticacion';

export interface ServicioAutenticacion {
  obtenerUsuarioActual(): Promise<UsuarioAutenticado | null>;
  iniciarSesion(credenciales: CredencialesAcceso): Promise<UsuarioAutenticado>;
  registrarConCorreo(correo: string, contrasena: string, nombre: string): Promise<void>;
  iniciarSesionConGoogle(): Promise<UsuarioAutenticado>;
  vincularGoogle(): Promise<UsuarioAutenticado>;
  enviarRecuperacionContrasena(correo: string): Promise<void>;
  reenviarVerificacion(correo: string, contrasena: string): Promise<void>;
  observarCambios(escuchar: (usuario: UsuarioAutenticado | null) => void): () => void;
  cerrarSesion(): Promise<void>;
}
