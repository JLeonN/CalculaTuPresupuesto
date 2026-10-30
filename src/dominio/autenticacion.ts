export interface CredencialesAcceso {
  usuario: string;
  contrasena: string;
}

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  correo: string | null;
  correoVerificado: boolean;
  proveedores: string[];
  proveedor: 'firebase';
}

export class ErrorSalidaPresupuestoRestringida extends Error {
  constructor() {
    super('Iniciá sesión para descargar, imprimir o enviar presupuestos.');
    this.name = 'ErrorSalidaPresupuestoRestringida';
  }
}
