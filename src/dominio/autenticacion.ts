export interface CredencialesAcceso {
  usuario: string;
  contrasena: string;
}

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  proveedor: 'prueba';
}

export type CodigoErrorAccesoProvisional = 'credenciales-invalidas' | 'configuracion-ausente';

const MENSAJES_ERROR_ACCESO: Readonly<Record<CodigoErrorAccesoProvisional, string>> = {
  'credenciales-invalidas': 'El usuario o la contraseña no son correctos.',
  'configuracion-ausente': 'El acceso de prueba todavía no está configurado.',
};

export class ErrorAccesoProvisional extends Error {
  readonly codigo: CodigoErrorAccesoProvisional;

  constructor(codigo: CodigoErrorAccesoProvisional) {
    super(MENSAJES_ERROR_ACCESO[codigo]);
    this.name = 'ErrorAccesoProvisional';
    this.codigo = codigo;
  }
}

export class ErrorSalidaPresupuestoRestringida extends Error {
  constructor() {
    super('Iniciá sesión para descargar, imprimir o enviar presupuestos.');
    this.name = 'ErrorSalidaPresupuestoRestringida';
  }
}
