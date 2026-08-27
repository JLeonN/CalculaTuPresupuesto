import { CLAVES_ALMACENAMIENTO } from '@/configuracion/clavesAlmacenamiento';
import {
  ErrorAccesoProvisional,
  type CredencialesAcceso,
  type UsuarioAutenticado,
} from '@/dominio/autenticacion';
import type { AlmacenamientoClaveValor } from '@/repositorios/clientes/AlmacenamientoClaveValor';
import type { ServicioAutenticacion } from './ServicioAutenticacion';

const ID_USUARIO_PRUEBA = 'usuario-prueba';

export class ServicioAutenticacionPrueba implements ServicioAutenticacion {
  constructor(
    private readonly almacenamiento: AlmacenamientoClaveValor,
    private readonly usuarioConfigurado: string,
    private readonly contrasenaConfigurada: string,
  ) {}

  async obtenerUsuarioActual(): Promise<UsuarioAutenticado | null> {
    if (!this.tieneConfiguracionCompleta()) {
      await this.almacenamiento.eliminar(CLAVES_ALMACENAMIENTO.sesionPrueba);
      return null;
    }

    const valorGuardado = await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.sesionPrueba);

    if (!valorGuardado) {
      return null;
    }

    try {
      const usuario = JSON.parse(valorGuardado) as unknown;

      if (this.esUsuarioPersistidoValido(usuario)) {
        return usuario;
      }
    } catch {
      // Una sesión dañada se elimina y se recupera como visitante.
    }

    await this.almacenamiento.eliminar(CLAVES_ALMACENAMIENTO.sesionPrueba);
    return null;
  }

  async iniciarSesion(credenciales: CredencialesAcceso): Promise<UsuarioAutenticado> {
    if (!this.tieneConfiguracionCompleta()) {
      throw new ErrorAccesoProvisional('configuracion-ausente');
    }

    const usuarioCoincide =
      credenciales.usuario.trim().toLocaleLowerCase('es') ===
      this.usuarioConfigurado.trim().toLocaleLowerCase('es');
    const contrasenaCoincide = credenciales.contrasena === this.contrasenaConfigurada;

    if (!usuarioCoincide || !contrasenaCoincide) {
      throw new ErrorAccesoProvisional('credenciales-invalidas');
    }

    const usuario: UsuarioAutenticado = {
      id: ID_USUARIO_PRUEBA,
      nombre: this.usuarioConfigurado.trim(),
      proveedor: 'prueba',
    };

    await this.almacenamiento.guardar(CLAVES_ALMACENAMIENTO.sesionPrueba, JSON.stringify(usuario));
    return usuario;
  }

  cerrarSesion(): Promise<void> {
    return this.almacenamiento.eliminar(CLAVES_ALMACENAMIENTO.sesionPrueba);
  }

  private tieneConfiguracionCompleta(): boolean {
    return this.usuarioConfigurado.trim() !== '' && this.contrasenaConfigurada !== '';
  }

  private esUsuarioPersistidoValido(valor: unknown): valor is UsuarioAutenticado {
    if (typeof valor !== 'object' || valor === null) {
      return false;
    }

    const usuario = valor as Partial<UsuarioAutenticado>;
    return (
      usuario.id === ID_USUARIO_PRUEBA &&
      usuario.proveedor === 'prueba' &&
      typeof usuario.nombre === 'string' &&
      usuario.nombre.toLocaleLowerCase('es') ===
        this.usuarioConfigurado.trim().toLocaleLowerCase('es')
    );
  }
}
