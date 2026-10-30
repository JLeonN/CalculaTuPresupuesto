<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { useQuasar } from 'quasar';
import type {
  RespaldoDatos,
  ResumenColeccionImportacion,
  ResumenImportacion,
} from '@/dominio/respaldo';
import {
  crearServicioRespaldo,
  ErrorImportacionParcial,
  ErrorResumenImportacionCambiado,
} from '@/servicios/respaldo/ServicioRespaldo';
import { descargarArchivoRespaldo } from '@/servicios/respaldo/archivosRespaldo';
import { useAutenticacionStore } from '@/stores/autenticacion';

const TAMANO_MAXIMO_RESPALDO_BYTES = 50 * 1024 * 1024;
const props = defineProps<{
  cambiosPendientes: boolean;
  actualizarDatos: (recargarConfiguracion: boolean) => Promise<void>;
}>();
const $q = useQuasar();
const autenticacionStore = useAutenticacionStore();
const servicioRespaldo = crearServicioRespaldo();
const entradaArchivo = ref<HTMLInputElement | null>(null);
const operacion = ref<'descarga' | 'lectura' | 'importacion' | null>(null);
const errorAccion = ref<string | null>(null);
const respaldoSeleccionado = shallowRef<RespaldoDatos | null>(null);
const resumenImportacion = ref<ResumenImportacion | null>(null);
const nombreArchivo = ref('');
const confirmacionVisible = ref(false);
watch(
  () => autenticacionStore.usuario?.id,
  () => {
    respaldoSeleccionado.value = null;
    resumenImportacion.value = null;
    confirmacionVisible.value = false;
    errorAccion.value = null;
  },
);
const hayRegistrosNuevos = computed(() => {
  const resumen = resumenImportacion.value;
  return Boolean(
    resumen &&
    (resumen.clientes.nuevos > 0 ||
      resumen.materiales.nuevos > 0 ||
      resumen.presupuestos.nuevos > 0 ||
      resumen.configuracion === 'seAgrega'),
  );
});

onMounted(() => {
  void autenticacionStore.inicializarSesion();
});

async function comprobarAcceso(): Promise<boolean> {
  await autenticacionStore.inicializarSesion();
  if (autenticacionStore.estaAutenticado) return true;
  autenticacionStore.solicitarInicioSesion();
  return false;
}

function comprobarFormulario(): boolean {
  if (!props.cambiosPendientes) return true;
  errorAccion.value =
    'Guardá o descartá los cambios de Configuración antes de descargar o importar una copia.';
  return false;
}

async function descargarCopia(): Promise<void> {
  if (operacion.value || !comprobarFormulario() || !(await comprobarAcceso())) return;
  operacion.value = 'descarga';
  errorAccion.value = null;
  try {
    const respaldo = await servicioRespaldo.generarRespaldo(autenticacionStore.estaAutenticado);
    if (!autenticacionStore.estaAutenticado) {
      autenticacionStore.solicitarInicioSesion();
      return;
    }
    const destino = await descargarArchivoRespaldo(respaldo);
    $q.notify({
      message:
        destino === 'navegador'
          ? 'Se inició la descarga. Comprobá que el archivo se haya guardado.'
          : 'Elegí un destino externo y comprobá allí que la copia se haya guardado.',
      position: 'top',
      classes: 'notificacion-exito',
    });
  } catch (errorCapturado) {
    errorAccion.value = obtenerMensaje(
      errorCapturado,
      'No se pudo preparar la copia de seguridad.',
    );
  } finally {
    operacion.value = null;
  }
}

async function abrirSelectorCopia(): Promise<void> {
  if (operacion.value || !comprobarFormulario() || !(await comprobarAcceso())) return;
  entradaArchivo.value?.click();
}

async function seleccionarCopia(evento: Event): Promise<void> {
  const entrada = evento.target;
  if (!(entrada instanceof HTMLInputElement)) return;
  const archivo = entrada.files?.[0];
  entrada.value = '';
  if (!archivo || operacion.value) return;
  if (!(await comprobarAcceso()) || !comprobarFormulario()) return;

  respaldoSeleccionado.value = null;
  resumenImportacion.value = null;
  errorAccion.value = null;
  if (archivo.size > TAMANO_MAXIMO_RESPALDO_BYTES) {
    errorAccion.value = 'La copia supera el límite de 50 MB. No se leyó ni importó ningún dato.';
    return;
  }

  operacion.value = 'lectura';
  try {
    const texto = await archivo.text();
    const vista = await servicioRespaldo.previsualizarImportacion(
      texto,
      autenticacionStore.estaAutenticado,
    );
    respaldoSeleccionado.value = vista.respaldo;
    resumenImportacion.value = vista.resumen;
    nombreArchivo.value = archivo.name;
  } catch (errorCapturado) {
    errorAccion.value = obtenerMensaje(errorCapturado, 'No se pudo leer la copia seleccionada.');
  } finally {
    operacion.value = null;
  }
}

async function prepararConfirmacion(): Promise<void> {
  if (
    operacion.value ||
    !respaldoSeleccionado.value ||
    !resumenImportacion.value ||
    !hayRegistrosNuevos.value ||
    !comprobarFormulario() ||
    !(await comprobarAcceso())
  )
    return;
  confirmacionVisible.value = true;
}

async function confirmarImportacion(): Promise<void> {
  if (
    operacion.value ||
    !respaldoSeleccionado.value ||
    !resumenImportacion.value ||
    !comprobarFormulario() ||
    !(await comprobarAcceso())
  ) {
    confirmacionVisible.value = false;
    return;
  }
  confirmacionVisible.value = false;
  operacion.value = 'importacion';
  errorAccion.value = null;
  try {
    const resultado = await servicioRespaldo.importarFaltantes(
      respaldoSeleccionado.value,
      resumenImportacion.value,
      autenticacionStore.estaAutenticado,
    );
    await props.actualizarDatos(resultado.configuracion === 'seAgrega');
    respaldoSeleccionado.value = null;
    resumenImportacion.value = null;
    $q.notify({
      message: 'La importación terminó. Solo se agregaron los registros faltantes.',
      position: 'top',
      classes: 'notificacion-exito',
    });
  } catch (errorCapturado) {
    if (errorCapturado instanceof ErrorResumenImportacionCambiado) {
      resumenImportacion.value = errorCapturado.resumenActual;
    } else if (errorCapturado instanceof ErrorImportacionParcial) {
      try {
        await props.actualizarDatos(true);
      } catch {
        // El mensaje de importación parcial sigue siendo la instrucción para reintentar.
      }
      respaldoSeleccionado.value = null;
      resumenImportacion.value = null;
    }
    errorAccion.value = obtenerMensaje(errorCapturado, 'No se pudo completar la importación.');
  } finally {
    operacion.value = null;
  }
}

function descartarCopia(): void {
  if (operacion.value) return;
  respaldoSeleccionado.value = null;
  resumenImportacion.value = null;
  nombreArchivo.value = '';
  errorAccion.value = null;
}

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(fecha),
  );
}

function textoResumen(resumen: ResumenColeccionImportacion): string {
  return `${resumen.nuevos} nuevos · ${resumen.existentesIguales} ya existentes · ${resumen.existentesDistintos} distintos conservados`;
}

function textoConfiguracion(estado: ResumenImportacion['configuracion']): string {
  if (estado === 'seAgrega') return 'Se agregará la configuración de la copia.';
  if (estado === 'yaExisteDistinta') return 'La configuración actual es distinta y se conservará.';
  if (estado === 'yaExisteIgual') return 'La configuración ya existe y se conservará.';
  return 'Esta copia no contiene configuración guardada.';
}

function obtenerMensaje(errorCapturado: unknown, mensajePredeterminado: string): string {
  return errorCapturado instanceof Error ? errorCapturado.message : mensajePredeterminado;
}
</script>

<template>
  <section class="seccion-formulario panel-copias" aria-labelledby="titulo-copias-seguridad">
    <div class="encabezado-seccion-formulario">
      <div>
        <p class="etiqueta-seccion">Seguridad</p>
        <h2 id="titulo-copias-seguridad" class="titulo-seccion">Copias de seguridad</h2>
        <p class="texto-secundario texto-ayuda-formulario">
          Guardá una copia JSON fuera de la aplicación y recuperá registros faltantes cuando lo
          necesites.
        </p>
      </div>
    </div>

    <q-banner v-if="errorAccion" class="aviso-error" rounded role="alert">
      <template #avatar><q-icon name="error_outline" /></template>
      {{ errorAccion }}
    </q-banner>

    <div class="panel-copias__acciones">
      <q-btn
        class="boton-accion-principal"
        unelevated
        no-caps
        icon="download"
        label="Descargar copia"
        :icon-right="autenticacionStore.estaAutenticado ? undefined : 'lock'"
        :loading="operacion === 'descarga'"
        :disable="operacion !== null"
        @click="descargarCopia"
      />
      <q-btn
        class="boton-secundario"
        flat
        no-caps
        icon="upload_file"
        label="Importar copia"
        :icon-right="autenticacionStore.estaAutenticado ? undefined : 'lock'"
        :loading="operacion === 'lectura'"
        :disable="operacion !== null"
        @click="abrirSelectorCopia"
      />
    </div>
    <p class="texto-secundario panel-copias__ayuda">
      La importación no reemplaza datos actuales. La copia puede contener teléfonos y datos de
      cobro; guardala en un lugar privado.
    </p>
    <input
      ref="entradaArchivo"
      class="panel-copias__entrada"
      type="file"
      accept=".json,application/json"
      aria-label="Elegir copia de seguridad JSON"
      @change="seleccionarCopia"
    />

    <div v-if="respaldoSeleccionado && resumenImportacion" class="panel-copias__vista">
      <h3 class="titulo-seccion">Revisar importación</h3>
      <p class="panel-copias__archivo">{{ nombreArchivo }}</p>
      <p class="texto-secundario">
        Copia del {{ formatearFecha(respaldoSeleccionado.fechaExportacion) }}
      </p>
      <div class="panel-copias__resumen">
        <div>
          <strong>Clientes ({{ respaldoSeleccionado.datos.clientes.length }})</strong>
          <span>{{ textoResumen(resumenImportacion.clientes) }}</span>
        </div>
        <div>
          <strong>Materiales ({{ respaldoSeleccionado.datos.materiales.length }})</strong>
          <span>{{ textoResumen(resumenImportacion.materiales) }}</span>
        </div>
        <div>
          <strong>Presupuestos ({{ respaldoSeleccionado.datos.presupuestos.length }})</strong>
          <span>{{ textoResumen(resumenImportacion.presupuestos) }}</span>
        </div>
        <div>
          <strong>Configuración</strong>
          <span>{{ textoConfiguracion(resumenImportacion.configuracion) }}</span>
        </div>
      </div>
      <div class="panel-copias__acciones">
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          icon="playlist_add"
          label="Agregar faltantes"
          :disable="!hayRegistrosNuevos || operacion !== null"
          :loading="operacion === 'importacion'"
          @click="prepararConfirmacion"
        />
        <q-btn
          class="boton-secundario"
          flat
          no-caps
          label="Cancelar"
          :disable="operacion !== null"
          @click="descartarCopia"
        />
      </div>
      <p v-if="!hayRegistrosNuevos" class="texto-secundario">
        No hay registros faltantes para agregar.
      </p>
    </div>

    <q-dialog v-model="confirmacionVisible" persistent>
      <q-card class="panel-copias__confirmacion">
        <q-card-section>
          <h3 class="titulo-seccion">Confirmar importación</h3>
          <p>
            Se agregarán solo registros faltantes. No se modificarán ni borrarán datos actuales.
          </p>
          <p v-if="autenticacionStore.usuario" class="texto-secundario">
            Cuenta de destino:
            {{ autenticacionStore.usuario.correo ?? autenticacionStore.usuario.nombre }} (UID:
            {{ autenticacionStore.usuario.id }}).
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" @click="confirmacionVisible = false" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Agregar faltantes"
            @click="confirmarImportacion"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </section>
</template>
