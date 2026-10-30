import {
  compararRespaldo,
  crearRespaldo,
  validarRespaldo,
  type DatosRespaldo,
  type RespaldoDatos,
  type ResumenImportacion,
} from '@/dominio/respaldo';
import type { RepositorioClientes } from '@/repositorios/clientes/RepositorioClientes';
import { crearRepositorioClientes } from '@/repositorios/clientes/crearRepositorioClientes';
import type { RepositorioMateriales } from '@/repositorios/materiales/RepositorioMateriales';
import { crearRepositorioMateriales } from '@/repositorios/materiales/crearRepositorioMateriales';
import type { RepositorioPresupuestos } from '@/repositorios/presupuestos/RepositorioPresupuestos';
import { crearRepositorioPresupuestos } from '@/repositorios/presupuestos/crearRepositorioPresupuestos';
import type { RepositorioConfiguracion } from '@/repositorios/configuracion/RepositorioConfiguracion';
import { crearRepositorioConfiguracion } from '@/repositorios/configuracion/crearRepositorioConfiguracion';
import { estaFirebaseConfigurado, obtenerFirebase } from '@/configuracion/firebase';

export class ErrorResumenImportacionCambiado extends Error {
  constructor(readonly resumenActual: ResumenImportacion) {
    super('Los datos actuales cambiaron. Revisá el resumen antes de continuar.');
  }
}

export class ErrorImportacionParcial extends Error {
  constructor(
    readonly gruposCompletados: readonly string[],
    causa: unknown,
  ) {
    super(
      gruposCompletados.length > 0
        ? `La importación se interrumpió después de completar ${gruposCompletados.join(', ')}. El grupo siguiente también pudo guardarse. Volvé a importar el mismo archivo para completar lo pendiente.`
        : 'La importación se interrumpió. Algunos datos pueden haberse guardado. Volvé a importar el mismo archivo para completar lo pendiente.',
      { cause: causa },
    );
  }
}

export class ServicioRespaldo {
  constructor(
    private readonly repositorioClientes: RepositorioClientes,
    private readonly repositorioMateriales: RepositorioMateriales,
    private readonly repositorioPresupuestos: RepositorioPresupuestos,
    private readonly repositorioConfiguracion: RepositorioConfiguracion,
  ) {}

  async generarRespaldo(permitirAcceso: boolean): Promise<RespaldoDatos> {
    exigirAcceso(permitirAcceso);
    const cuenta = obtenerCuentaActual();
    const datos = await this.leerDatos(cuenta);
    exigirCuentaVigente(cuenta);
    return crearRespaldo(datos);
  }

  async previsualizarImportacion(
    archivo: string,
    permitirAcceso: boolean,
  ): Promise<{ respaldo: RespaldoDatos; resumen: ResumenImportacion }> {
    exigirAcceso(permitirAcceso);
    const cuenta = obtenerCuentaActual();
    let contenido: unknown;
    try {
      contenido = JSON.parse(archivo) as unknown;
    } catch {
      throw new Error('El archivo JSON está incompleto o es ilegible.');
    }
    const respaldo = validarRespaldo(contenido);
    const resumen = compararRespaldo(respaldo, await this.leerDatos(cuenta));
    exigirCuentaVigente(cuenta);
    return { respaldo, resumen };
  }

  async importarFaltantes(
    respaldo: RespaldoDatos,
    resumenConfirmado: ResumenImportacion,
    permitirAcceso: boolean,
  ): Promise<ResumenImportacion> {
    exigirAcceso(permitirAcceso);
    const cuenta = obtenerCuentaActual();
    const respaldoValidado = validarRespaldo(respaldo);
    const resumenActual = compararRespaldo(respaldoValidado, await this.leerDatos(cuenta));
    exigirCuentaVigente(cuenta);
    if (JSON.stringify(resumenActual) !== JSON.stringify(resumenConfirmado)) {
      throw new ErrorResumenImportacionCambiado(resumenActual);
    }

    const gruposCompletados: string[] = [];
    try {
      const clientesAgregados = await this.repositorioClientes.agregarFaltantes(
        respaldoValidado.datos.clientes,
      );
      exigirCuentaVigente(cuenta);
      gruposCompletados.push('clientes');
      const materialesAgregados = await this.repositorioMateriales.agregarFaltantes(
        respaldoValidado.datos.materiales,
      );
      exigirCuentaVigente(cuenta);
      gruposCompletados.push('materiales');
      const presupuestosAgregados = await this.repositorioPresupuestos.agregarFaltantes(
        respaldoValidado.datos.presupuestos,
      );
      exigirCuentaVigente(cuenta);
      gruposCompletados.push('presupuestos');
      const configuracionAgregada = respaldoValidado.datos.configuracion
        ? await this.repositorioConfiguracion.guardarSiAusente(respaldoValidado.datos.configuracion)
        : false;
      exigirCuentaVigente(cuenta);
      gruposCompletados.push('configuración');

      return {
        clientes: { ...resumenActual.clientes, nuevos: clientesAgregados },
        materiales: { ...resumenActual.materiales, nuevos: materialesAgregados },
        presupuestos: { ...resumenActual.presupuestos, nuevos: presupuestosAgregados },
        configuracion: configuracionAgregada ? 'seAgrega' : resumenActual.configuracion,
      };
    } catch (causa) {
      throw new ErrorImportacionParcial(gruposCompletados, causa);
    }
  }

  private async leerDatos(cuenta: string): Promise<DatosRespaldo> {
    const clientes = await this.repositorioClientes.obtenerTodos();
    exigirCuentaVigente(cuenta);
    const materiales = await this.repositorioMateriales.obtenerTodos();
    exigirCuentaVigente(cuenta);
    const presupuestos = await this.repositorioPresupuestos.obtenerTodos();
    exigirCuentaVigente(cuenta);
    const configuracion = await this.repositorioConfiguracion.obtenerGuardada();
    exigirCuentaVigente(cuenta);
    return { configuracion, clientes, materiales, presupuestos };
  }
}

function obtenerCuentaActual(): string {
  return estaFirebaseConfigurado()
    ? (obtenerFirebase().autenticacion.currentUser?.uid ?? 'visitante')
    : 'local';
}

function exigirCuentaVigente(cuenta: string): void {
  if (obtenerCuentaActual() !== cuenta) {
    throw new Error('La sesión cambió durante la operación. Volvé a empezar con la cuenta actual.');
  }
}

export function crearServicioRespaldo(): ServicioRespaldo {
  return new ServicioRespaldo(
    crearRepositorioClientes(),
    crearRepositorioMateriales(),
    crearRepositorioPresupuestos(),
    crearRepositorioConfiguracion(),
  );
}

function exigirAcceso(permitirAcceso: boolean): void {
  if (
    !permitirAcceso ||
    (estaFirebaseConfigurado() && !obtenerFirebase().autenticacion.currentUser)
  ) {
    throw new Error('Iniciá sesión para gestionar copias de seguridad.');
  }
}
