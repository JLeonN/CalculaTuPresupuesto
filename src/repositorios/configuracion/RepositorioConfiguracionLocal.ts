import {
  crearConfiguracionInicial,
  esConfiguracionGuardada,
  migrarConfiguracionAnterior,
  migrarConfiguracionSinMonedaPrincipal,
  migrarConfiguracionSinPorcentajeAdicionalMateriales,
  migrarMensajeFinalPredeterminado,
  type Configuracion,
} from '@/dominio/configuracion';
import { CLAVES_ALMACENAMIENTO } from '@/configuracion/clavesAlmacenamiento';
import type { AlmacenamientoClaveValor } from '@/repositorios/clientes/AlmacenamientoClaveValor';
import type { RepositorioConfiguracion } from './RepositorioConfiguracion';

export class RepositorioConfiguracionLocal implements RepositorioConfiguracion {
  // TODO(firebase): sustituir este repositorio por Firestore conservando el contrato asíncrono.
  constructor(private readonly almacenamiento: AlmacenamientoClaveValor) {}

  async obtener(): Promise<Configuracion> {
    return (await this.obtenerGuardada()) ?? crearConfiguracionInicial();
  }

  async obtenerGuardada(): Promise<Configuracion | null> {
    const datosGuardados = await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.configuracion);

    if (datosGuardados === null) {
      return null;
    }

    let configuracionGuardada: unknown;

    try {
      configuracionGuardada = JSON.parse(datosGuardados) as unknown;
    } catch {
      throw new Error('La configuración guardada tiene un formato ilegible.');
    }

    let configuracionRecuperada: Configuracion;
    let configuracionNecesitaMigracion = false;

    if (esConfiguracionGuardada(configuracionGuardada)) {
      configuracionRecuperada = structuredClone(configuracionGuardada);
    } else {
      const configuracionSinPorcentajeMigrada =
        migrarConfiguracionSinPorcentajeAdicionalMateriales(configuracionGuardada);
      const configuracionModernaMigrada = configuracionSinPorcentajeMigrada
        ? null
        : migrarConfiguracionSinMonedaPrincipal(configuracionGuardada);
      const configuracionAnteriorMigrada =
        configuracionSinPorcentajeMigrada || configuracionModernaMigrada
          ? null
          : migrarConfiguracionAnterior(configuracionGuardada);

      configuracionNecesitaMigracion =
        configuracionSinPorcentajeMigrada !== null ||
        configuracionModernaMigrada !== null ||
        configuracionAnteriorMigrada !== null;
      const configuracionMigrada =
        configuracionSinPorcentajeMigrada ??
        configuracionModernaMigrada ??
        configuracionAnteriorMigrada;
      if (configuracionMigrada === null) {
        throw new Error('La configuración guardada no se pudo recuperar de forma segura.');
      }
      configuracionRecuperada = configuracionMigrada;
    }

    const configuracionMigrada = migrarMensajeFinalPredeterminado(configuracionRecuperada);
    if (!esConfiguracionGuardada(configuracionMigrada)) {
      throw new Error('La configuración guardada no se pudo recuperar de forma segura.');
    }

    if (configuracionNecesitaMigracion || configuracionMigrada !== configuracionRecuperada) {
      try {
        await this.guardar(configuracionMigrada);
      } catch {
        // La migración sigue disponible en memoria y se volverá a intentar en la próxima carga.
      }
    }

    return configuracionMigrada;
  }

  async guardar(configuracion: Configuracion): Promise<void> {
    if (!esConfiguracionGuardada(configuracion)) {
      throw new Error('La configuración que intentás guardar es inválida.');
    }
    const valor = JSON.stringify(configuracion);
    await this.almacenamiento.guardar(
      CLAVES_ALMACENAMIENTO.configuracion,
      valor,
    );
    if (await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.configuracion) !== valor) {
      throw new Error('No se pudo verificar el guardado de la configuración.');
    }
  }

  async guardarSiAusente(configuracion: Configuracion): Promise<boolean> {
    if (await this.obtenerGuardada() !== null) return false;
    await this.guardar(configuracion);
    return true;
  }
}
