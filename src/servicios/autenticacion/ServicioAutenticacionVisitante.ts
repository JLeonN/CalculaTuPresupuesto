import type { UsuarioAutenticado } from '@/dominio/autenticacion';
import type { ServicioAutenticacion } from './ServicioAutenticacion';

const MENSAJE = 'El acceso todavía no está configurado para este entorno.';

export class ServicioAutenticacionVisitante implements ServicioAutenticacion {
  obtenerUsuarioActual(): Promise<null> {
    return Promise.resolve(null);
  }
  iniciarSesion(): Promise<UsuarioAutenticado> {
    return Promise.reject(new Error(MENSAJE));
  }
  registrarConCorreo(): Promise<void> {
    return Promise.reject(new Error(MENSAJE));
  }
  iniciarSesionConGoogle(): Promise<UsuarioAutenticado> {
    return Promise.reject(new Error(MENSAJE));
  }
  vincularGoogle(): Promise<UsuarioAutenticado> {
    return Promise.reject(new Error(MENSAJE));
  }
  enviarRecuperacionContrasena(): Promise<void> {
    return Promise.reject(new Error(MENSAJE));
  }
  reenviarVerificacion(): Promise<void> {
    return Promise.reject(new Error(MENSAJE));
  }
  observarCambios(): () => void {
    return () => undefined;
  }
  cerrarSesion(): Promise<void> {
    return Promise.resolve();
  }
}
