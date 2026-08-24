import {
  crearConfiguracionInicial,
  esConfiguracionGuardada,
  migrarConfiguracionAnterior,
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
    const datosGuardados = await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.configuracion);

    if (datosGuardados === null) {
      return crearConfiguracionInicial();
    }

    let configuracionGuardada: unknown;

    try {
      configuracionGuardada = JSON.parse(datosGuardados) as unknown;
    } catch {
      return crearConfiguracionInicial();
    }

    const configuracionRecuperada = esConfiguracionGuardada(configuracionGuardada)
      ? structuredClone(configuracionGuardada)
      : (migrarConfiguracionAnterior(configuracionGuardada) ?? crearConfiguracionInicial());
    const configuracionMigrada = migrarMensajeFinalPredeterminado(configuracionRecuperada);

    if (configuracionMigrada !== configuracionRecuperada) {
      try {
        await this.guardar(configuracionMigrada);
      } catch {
        // La migración sigue disponible en memoria y se volverá a intentar en la próxima carga.
      }
    }

    return configuracionMigrada;
  }

  async guardar(configuracion: Configuracion): Promise<void> {
    await this.almacenamiento.guardar(
      CLAVES_ALMACENAMIENTO.configuracion,
      JSON.stringify(configuracion),
    );
  }
}
