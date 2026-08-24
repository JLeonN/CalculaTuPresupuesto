<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { mdiWhatsapp } from '@quasar/extras/mdi-v7';
import { useQuasar } from 'quasar';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import DocumentoPresupuesto from '@/components/presupuestos/DocumentoPresupuesto.vue';
import {
  crearConfiguracionDocumento,
  normalizarDatosPresupuesto,
  type DatosPresupuesto,
} from '@/dominio/presupuestos';
import { normalizarNumeroWhatsapp } from '@/dominio/whatsapp';
import { useConfiguracionStore } from '@/stores/configuracion';
import { usePresupuestosStore } from '@/stores/presupuestos';
import {
  descargarDocumentoPresupuesto,
  enviarDocumentoPresupuesto,
} from '@/servicios/documentos/accionesPresupuesto';

type DocumentoPresupuestoExpuesto = {
  obtenerElemento: () => HTMLElement | null;
};

const ruta = useRoute();
const router = useRouter();
const $q = useQuasar();
const configuracionStore = useConfiguracionStore();
const presupuestosStore = usePresupuestosStore();

const datosPresupuesto = ref<DatosPresupuesto | null>(null);
const cargando = ref(true);
const presupuestoNoEncontrado = ref(false);
const documentoPresupuesto = ref<DocumentoPresupuestoExpuesto | null>(null);
const accionDocumento = ref<'descargar' | 'enviar' | null>(null);
const errorDocumento = ref<string | null>(null);
const esVistaPreviaNueva = computed(() => ruta.name === 'vista-previa-nuevo-presupuesto');
const idPresupuesto = computed(() =>
  esVistaPreviaNueva.value ? null : String(ruta.params.idPresupuesto),
);
const borrador = computed(() => presupuestosStore.obtenerBorradorVistaPrevia(idPresupuesto.value));
const rutaRetorno = computed(
  () =>
    borrador.value?.rutaRetorno ??
    (idPresupuesto.value ? `/presupuestos/${idPresupuesto.value}` : '/presupuestos/nuevo'),
);
const configuracionDocumento = computed(() =>
  datosPresupuesto.value?.configuracionDocumento
    ? datosPresupuesto.value.configuracionDocumento
    : crearConfiguracionDocumento(configuracionStore.configuracion),
);
const numeroWhatsapp = computed(() =>
  normalizarNumeroWhatsapp(datosPresupuesto.value?.destinatario.telefono ?? ''),
);
const nombreClienteWhatsapp = computed(
  () => datosPresupuesto.value?.destinatario.nombre.trim() ?? '',
);
const errorCarga = computed(
  () => errorDocumento.value || presupuestosStore.error || configuracionStore.error,
);

onMounted(() => {
  void cargarVistaPrevia();
});

onBeforeRouteLeave((destino) => {
  if (destino.path === rutaRetorno.value) {
    presupuestosStore.marcarRetornoVistaPrevia(rutaRetorno.value);
  }
});

async function cargarVistaPrevia(): Promise<void> {
  cargando.value = true;
  presupuestoNoEncontrado.value = false;

  try {
    await configuracionStore.asegurarConfiguracionCargada();

    if (borrador.value) {
      datosPresupuesto.value = normalizarDatosPresupuesto(borrador.value.datos);
      return;
    }

    if (idPresupuesto.value === null) {
      presupuestoNoEncontrado.value = true;
      return;
    }

    await presupuestosStore.cargarPresupuestos();
    const presupuesto = presupuestosStore.obtenerPresupuestoPorId(idPresupuesto.value);
    presupuestoNoEncontrado.value = presupuesto === undefined;
    datosPresupuesto.value = presupuesto ? normalizarDatosPresupuesto(presupuesto) : null;
  } finally {
    cargando.value = false;
  }
}

function volver(): void {
  void router.push(rutaRetorno.value);
}

function imprimir(): void {
  window.print();
}

async function descargar(): Promise<void> {
  if (
    !datosPresupuesto.value ||
    !documentoPresupuesto.value?.obtenerElemento() ||
    accionDocumento.value
  ) {
    return;
  }

  accionDocumento.value = 'descargar';
  errorDocumento.value = null;

  try {
    const plataforma = await descargarDocumentoPresupuesto({
      datos: datosPresupuesto.value,
      configuracion: configuracionDocumento.value,
      obtenerElemento: () => documentoPresupuesto.value?.obtenerElemento() ?? null,
      antesDeGenerar: async () => {
        await guardarCambiosPendientes();
        await nextTick();
      },
    });
    $q.notify({
      message:
        plataforma === 'nativo'
          ? 'El PDF se guardó en la carpeta Documentos.'
          : 'El PDF se descargó correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
  } catch (errorCapturado) {
    errorDocumento.value = obtenerMensajeError(errorCapturado);
  } finally {
    accionDocumento.value = null;
  }
}

async function enviarPorWhatsapp(): Promise<void> {
  if (
    numeroWhatsapp.value === '' ||
    nombreClienteWhatsapp.value === '' ||
    !datosPresupuesto.value ||
    !documentoPresupuesto.value?.obtenerElemento() ||
    accionDocumento.value
  ) {
    return;
  }

  accionDocumento.value = 'enviar';
  errorDocumento.value = null;

  try {
    const plataforma = await enviarDocumentoPresupuesto({
      datos: datosPresupuesto.value,
      configuracion: configuracionDocumento.value,
      obtenerElemento: () => documentoPresupuesto.value?.obtenerElemento() ?? null,
      antesDeGenerar: async () => {
        await guardarCambiosPendientes();
        await nextTick();
      },
    });

    if (plataforma === 'web') {
      $q.notify({
        message: 'PDF descargado. Adjuntalo en la conversación de WhatsApp que abrimos.',
        position: 'top',
        classes: 'notificacion-exito',
      });
    }
  } catch (errorCapturado) {
    errorDocumento.value = obtenerMensajeError(errorCapturado);
  } finally {
    accionDocumento.value = null;
  }
}

async function guardarCambiosPendientes(): Promise<void> {
  const borradorPendiente = borrador.value;

  if (!borradorPendiente || !datosPresupuesto.value) {
    return;
  }

  let idGuardado = borradorPendiente.idPresupuesto;

  if (idGuardado) {
    await presupuestosStore.cargarPresupuestos();
    const presupuestoActualizado = await presupuestosStore.editarPresupuesto(
      idGuardado,
      datosPresupuesto.value,
    );
    datosPresupuesto.value = normalizarDatosPresupuesto(presupuestoActualizado);
  } else {
    const presupuestoNuevo = await presupuestosStore.agregarPresupuesto(datosPresupuesto.value);
    idGuardado = presupuestoNuevo.id;
    datosPresupuesto.value = normalizarDatosPresupuesto(presupuestoNuevo);
  }

  presupuestosStore.descartarBorradorVistaPrevia();
  await router.replace(`/presupuestos/${idGuardado}/vista-previa`);
}

function obtenerMensajeError(errorCapturado: unknown): string {
  return (
    presupuestosStore.error ||
    (errorCapturado instanceof Error
      ? errorCapturado.message
      : 'No se pudo preparar el archivo PDF.')
  );
}
</script>

<template>
  <q-page class="pagina-vista-previa">
    <main class="vista-previa-presupuesto">
      <header class="encabezado-vista-previa-app">
        <div>
          <p class="etiqueta-seccion">Documento</p>
          <h1 class="titulo-pagina">Vista previa</h1>
          <p class="texto-secundario">Así verá el cliente el presupuesto.</p>
        </div>

        <div class="acciones-vista-previa">
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="arrow_back"
            label="Volver"
            @click="volver"
          />
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="download"
            label="Descargar"
            :disable="datosPresupuesto === null || accionDocumento !== null"
            :loading="accionDocumento === 'descargar'"
            @click="descargar"
          />
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="print"
            label="Imprimir"
            :disable="datosPresupuesto === null || accionDocumento !== null"
            @click="imprimir"
          />
          <q-btn
            class="boton-accion-principal"
            unelevated
            no-caps
            :icon="mdiWhatsapp"
            label="Enviar"
            :disable="
              numeroWhatsapp === '' ||
              nombreClienteWhatsapp === '' ||
              datosPresupuesto === null ||
              accionDocumento !== null
            "
            :loading="accionDocumento === 'enviar'"
            @click="enviarPorWhatsapp"
          />
        </div>
      </header>

      <q-banner v-if="errorCarga" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ errorCarga }}
      </q-banner>

      <div v-if="cargando" class="estado-presupuestos">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Preparando vista previa…</span>
      </div>

      <section v-else-if="presupuestoNoEncontrado" class="estado-vacio-presupuestos">
        <q-icon name="preview" aria-hidden="true" />
        <h2 class="titulo-seccion">No pudimos preparar la vista previa</h2>
        <p class="texto-secundario">Volvé al presupuesto e intentá abrirla nuevamente.</p>
        <q-btn class="boton-accion-principal" unelevated no-caps label="Volver" @click="volver" />
      </section>

      <div v-else-if="datosPresupuesto" class="vista-previa-presupuesto__lienzo">
        <DocumentoPresupuesto
          ref="documentoPresupuesto"
          :datos="datosPresupuesto"
          :configuracion="configuracionDocumento"
        />
      </div>
    </main>
  </q-page>
</template>
