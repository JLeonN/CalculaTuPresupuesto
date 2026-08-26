<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { mdiWhatsapp } from '@quasar/extras/mdi-v7';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import AgregadorMaterialPresupuesto from '@/components/presupuestos/AgregadorMaterialPresupuesto.vue';
import ControlEstadoPresupuesto from '@/components/presupuestos/ControlEstadoPresupuesto.vue';
import DocumentoPresupuesto from '@/components/presupuestos/DocumentoPresupuesto.vue';
import FilaPresupuesto from '@/components/presupuestos/FilaPresupuesto.vue';
import ResumenPresupuesto from '@/components/presupuestos/ResumenPresupuesto.vue';
import SelectorDestinatarioPresupuesto from '@/components/presupuestos/SelectorDestinatarioPresupuesto.vue';
import type { Material } from '@/dominio/materiales';
import { MONEDA_INICIAL, type Moneda } from '@/dominio/monedas';
import {
  clonarLineasPresupuesto,
  confirmarConversionManualLinea,
  crearConfiguracionDocumento,
  crearLineaDesdeMaterial,
  crearLineaManoObra,
  crearLineaMaterialManual,
  crearLineasInicialesPresupuesto,
  type DatosPresupuesto,
  type ConfiguracionDocumentoPresupuesto,
  type EstadoPresupuesto,
  type LineaPresupuesto,
  type Presupuesto,
  type TipoDestinatario,
} from '@/dominio/presupuestos';
import { useClientesStore } from '@/stores/clientes';
import { useConfiguracionStore } from '@/stores/configuracion';
import { useMaterialesStore } from '@/stores/materiales';
import { usePresupuestosStore } from '@/stores/presupuestos';
import {
  descargarDocumentoPresupuesto,
  enviarDocumentoPresupuesto,
} from '@/servicios/documentos/accionesPresupuesto';

type AccionDocumentoPresupuesto = 'descargar' | 'enviar';
type DocumentoPresupuestoExpuesto = {
  obtenerElemento: () => HTMLElement | null;
};

const ruta = useRoute();
const router = useRouter();
const $q = useQuasar();
const clientesStore = useClientesStore();
const configuracionStore = useConfiguracionStore();
const materialesStore = useMaterialesStore();
const presupuestosStore = usePresupuestosStore();

const tipoDestinatario = ref<TipoDestinatario>('potencial');
const idCliente = ref<string | null>(null);
const nombreDestinatario = ref('');
const telefonoDestinatario = ref('');
const fechaPresupuesto = ref(obtenerFechaActualLocal());
const monedaPresupuesto = ref<Moneda>(MONEDA_INICIAL);
const lineas = ref<LineaPresupuesto[]>([]);
const presupuesto = ref<Presupuesto>();
const cargandoPagina = ref(true);
const presupuestoNoEncontrado = ref(false);
const mostrarConfirmacionCancelar = ref(false);
const estadoInicial = ref('');
const errorAccion = ref<string | null>(null);
const configuracionDocumento = ref<ConfiguracionDocumentoPresupuesto | null>(null);
const documentoPresupuesto = ref<DocumentoPresupuestoExpuesto | null>(null);
const accionDocumento = ref<AccionDocumentoPresupuesto | null>(null);
const estadoEnProceso = ref<EstadoPresupuesto | null>(null);

const esNuevo = computed(() => ruta.name === 'nuevo-presupuesto');
const esEdicion = computed(() => ruta.name === 'editar-presupuesto');
const soloLectura = computed(() => ruta.name === 'detalle-presupuesto');
const tieneErroresCarga = computed(
  () =>
    errorAccion.value ||
    presupuestosStore.error ||
    clientesStore.error ||
    materialesStore.error ||
    configuracionStore.error,
);
const hayCambios = computed(
  () => estadoInicial.value !== '' && serializarDatosFormulario() !== estadoInicial.value,
);
const datosDocumento = computed(() => obtenerDatosFormulario());
const configuracionDocumentoEfectiva = computed(
  () =>
    configuracionDocumento.value ?? crearConfiguracionDocumento(configuracionStore.configuracion),
);
const tituloPagina = computed(() => {
  if (esNuevo.value) {
    return 'Nuevo presupuesto';
  }

  return esEdicion.value ? 'Editar presupuesto' : 'Presupuesto';
});

watch(
  () => ruta.fullPath,
  () => {
    void inicializarPantalla();
  },
  { immediate: true },
);

async function inicializarPantalla(): Promise<void> {
  cargandoPagina.value = true;
  presupuestoNoEncontrado.value = false;
  mostrarConfirmacionCancelar.value = false;
  errorAccion.value = null;
  estadoEnProceso.value = null;

  try {
    await Promise.all([
      clientesStore.cargarClientes(),
      materialesStore.cargarMateriales(),
      configuracionStore.asegurarConfiguracionCargada(),
      esNuevo.value ? Promise.resolve() : presupuestosStore.cargarPresupuestos(),
    ]);

    const idPresupuestoActual = esNuevo.value ? null : String(ruta.params.idPresupuesto);
    const borradorRecuperado = presupuestosStore.consumirBorradorVistaPrevia(
      ruta.path,
      idPresupuestoActual,
    );

    if (esNuevo.value) {
      if (borradorRecuperado) {
        cargarDatosFormulario(borradorRecuperado.datos);
        estadoInicial.value = borradorRecuperado.estadoInicial;
        return;
      }

      restablecerFormularioNuevo();
      return;
    }

    const presupuestoEncontrado = presupuestosStore.obtenerPresupuestoPorId(
      String(ruta.params.idPresupuesto),
    );
    presupuestoNoEncontrado.value = presupuestoEncontrado === undefined;

    if (presupuestoEncontrado) {
      presupuesto.value = presupuestoEncontrado;
      if (borradorRecuperado) {
        cargarDatosFormulario(borradorRecuperado.datos);
        estadoInicial.value = borradorRecuperado.estadoInicial;
      } else {
        cargarDatosPresupuesto(presupuestoEncontrado);
      }
    }
  } finally {
    cargandoPagina.value = false;
  }
}

function restablecerFormularioNuevo(): void {
  const primeraTarifa = configuracionStore.configuracion.tarifasManoObra[0];
  const monedaPrincipal = configuracionStore.monedaPrincipal;

  presupuesto.value = undefined;
  tipoDestinatario.value = 'potencial';
  idCliente.value = null;
  nombreDestinatario.value = '';
  telefonoDestinatario.value = '';
  fechaPresupuesto.value = obtenerFechaActualLocal();
  monedaPresupuesto.value = monedaPrincipal;
  lineas.value = crearLineasInicialesPresupuesto(monedaPrincipal, {
    nombreManoObra: primeraTarifa?.nombre,
    precioManoObraHora: primeraTarifa?.precioHora,
    precioTrasladoKilometro: configuracionStore.configuracion.precioTrasladoKilometro,
  });
  configuracionDocumento.value = crearConfiguracionDocumento(configuracionStore.configuracion);
  mostrarConfirmacionCancelar.value = false;
  estadoInicial.value = serializarDatosFormulario();
}

function cargarDatosPresupuesto(presupuestoGuardado: Presupuesto): void {
  cargarDatosFormulario(presupuestoGuardado);
  estadoInicial.value = serializarDatosFormulario();
}

function cargarDatosFormulario(datos: DatosPresupuesto): void {
  tipoDestinatario.value = datos.destinatario.tipo;
  idCliente.value = datos.destinatario.idCliente;
  nombreDestinatario.value = datos.destinatario.nombre;
  telefonoDestinatario.value = datos.destinatario.telefono;
  fechaPresupuesto.value = datos.fechaPresupuesto;
  monedaPresupuesto.value = datos.moneda;
  lineas.value = clonarLineasPresupuesto(datos.lineas);
  configuracionDocumento.value =
    datos.configuracionDocumento ?? crearConfiguracionDocumento(configuracionStore.configuracion);
}

function obtenerDatosFormulario(): DatosPresupuesto {
  return {
    destinatario: {
      tipo: tipoDestinatario.value,
      idCliente: idCliente.value,
      nombre: nombreDestinatario.value,
      telefono: telefonoDestinatario.value,
    },
    fechaPresupuesto: fechaPresupuesto.value,
    moneda: monedaPresupuesto.value,
    lineas: clonarLineasPresupuesto(lineas.value),
    configuracionDocumento: configuracionDocumento.value,
  };
}

function serializarDatosFormulario(): string {
  const datos = obtenerDatosFormulario();
  return JSON.stringify({
    destinatario: datos.destinatario,
    fechaPresupuesto: datos.fechaPresupuesto,
    moneda: datos.moneda,
    lineas: datos.lineas,
  });
}

function agregarMaterial(material: Material): void {
  lineas.value.push(crearLineaDesdeMaterial(material, configuracionStore.monedaPrincipal));
}

function agregarMaterialManual(nombre: string): void {
  lineas.value.push(crearLineaMaterialManual(nombre, monedaPresupuesto.value));
}

function agregarManoObra(): void {
  const indicePrimeraLineaDistinta = lineas.value.findIndex((linea) => linea.tipo !== 'manoObra');
  const indiceInsercion =
    indicePrimeraLineaDistinta === -1 ? lineas.value.length : indicePrimeraLineaDistinta;

  lineas.value.splice(indiceInsercion, 0, crearLineaManoObra(monedaPresupuesto.value));
}

function eliminarLinea(idLinea: string): void {
  lineas.value = lineas.value.filter((linea) => linea.id !== idLinea);
}

function confirmarConversionLinea(indiceLinea: number): void {
  const linea = lineas.value[indiceLinea];

  if (!linea) {
    return;
  }

  lineas.value.splice(
    indiceLinea,
    1,
    confirmarConversionManualLinea(linea, monedaPresupuesto.value),
  );
}

function abrirVistaPrevia(): void {
  const idPresupuesto = presupuesto.value?.id ?? null;
  presupuestosStore.establecerBorradorVistaPrevia(
    obtenerDatosFormulario(),
    ruta.path,
    idPresupuesto,
    estadoInicial.value,
  );

  const rutaVistaPrevia = idPresupuesto
    ? `/presupuestos/${idPresupuesto}/vista-previa`
    : '/presupuestos/nuevo/vista-previa';
  void router.push(rutaVistaPrevia);
}

function solicitarCancelacion(): void {
  if (!hayCambios.value) {
    confirmarCancelacion();
    return;
  }

  mostrarConfirmacionCancelar.value = true;
}

function confirmarCancelacion(): void {
  if (esNuevo.value) {
    void router.replace('/');
    return;
  }

  void router.replace('/presupuestos');
}

async function guardarNuevoYFinalizar(): Promise<void> {
  errorAccion.value = null;

  try {
    if (!presupuesto.value) {
      presupuesto.value = await presupuestosStore.agregarPresupuesto(obtenerDatosFormulario());
    }

    $q.notify({
      message: 'Presupuesto guardado correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
    await router.replace('/presupuestos');
  } catch (errorCapturado) {
    errorAccion.value = obtenerMensajeErrorGuardado(errorCapturado);
  }
}

async function guardarCambios(): Promise<void> {
  if (!presupuesto.value) {
    return;
  }

  errorAccion.value = null;

  try {
    const presupuestoActualizado = await presupuestosStore.editarPresupuesto(
      presupuesto.value.id,
      obtenerDatosFormulario(),
    );
    $q.notify({
      message: 'Los cambios del presupuesto se guardaron correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
    await router.replace(`/presupuestos/${presupuestoActualizado.id}`);
  } catch (errorCapturado) {
    errorAccion.value = obtenerMensajeErrorGuardado(errorCapturado);
  }
}

async function cambiarEstado(estado: EstadoPresupuesto): Promise<void> {
  if (!presupuesto.value || estadoEnProceso.value !== null) {
    return;
  }

  estadoEnProceso.value = estado;
  errorAccion.value = null;

  try {
    presupuesto.value = await presupuestosStore.cambiarEstadoPresupuesto(
      presupuesto.value.id,
      estado,
    );

    $q.notify({
      message: `Presupuesto marcado como ${estado}.`,
      position: 'top',
      classes: 'notificacion-exito',
    });
  } catch (errorCapturado) {
    errorAccion.value = obtenerMensajeErrorGuardado(errorCapturado);
    $q.notify({
      message: errorAccion.value,
      position: 'top',
      classes: 'notificacion-error',
    });
  } finally {
    estadoEnProceso.value = null;
  }
}

function obtenerMensajeErrorGuardado(errorCapturado: unknown): string {
  return (
    presupuestosStore.error ||
    (errorCapturado instanceof Error
      ? errorCapturado.message
      : 'No se pudo guardar el presupuesto.')
  );
}

function descargarPresupuesto(): void {
  void ejecutarAccionDocumento('descargar');
}

function enviarPresupuesto(): void {
  void ejecutarAccionDocumento('enviar');
}

async function ejecutarAccionDocumento(accion: AccionDocumentoPresupuesto): Promise<void> {
  if (esEdicion.value || accionDocumento.value || !documentoPresupuesto.value?.obtenerElemento()) {
    return;
  }

  const datos = obtenerDatosFormulario();
  accionDocumento.value = accion;
  errorAccion.value = null;

  try {
    const opciones = {
      datos,
      configuracion: configuracionDocumentoEfectiva.value,
      obtenerElemento: () => documentoPresupuesto.value?.obtenerElemento() ?? null,
      antesDeGenerar: async () => {
        if (esNuevo.value && !presupuesto.value) {
          presupuesto.value = await presupuestosStore.agregarPresupuesto(datos);
        }
        await nextTick();
      },
    };

    if (accion === 'descargar') {
      const plataforma = await descargarDocumentoPresupuesto(opciones);
      $q.notify({
        message:
          plataforma === 'nativo'
            ? 'El PDF se guardó en la carpeta Documentos.'
            : 'El PDF se descargó correctamente.',
        position: 'top',
        classes: 'notificacion-exito',
      });
    } else {
      const plataforma = await enviarDocumentoPresupuesto(opciones);
      if (plataforma === 'web') {
        $q.notify({
          message: 'PDF descargado. Adjuntalo en la conversación de WhatsApp que abrimos.',
          position: 'top',
          classes: 'notificacion-exito',
        });
      }
    }

    if (esNuevo.value) {
      await router.replace('/presupuestos');
    }
  } catch (errorCapturado) {
    errorAccion.value = obtenerMensajeErrorGuardado(errorCapturado);
  } finally {
    accionDocumento.value = null;
  }
}

function obtenerFechaActualLocal(): string {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function restablecerFechaPresupuesto(): void {
  fechaPresupuesto.value = obtenerFechaActualLocal();
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal nuevo-presupuesto">
      <q-btn
        v-if="!esNuevo"
        class="boton-secundario"
        flat
        no-caps
        icon="arrow_back"
        label="Volver a presupuestos"
        to="/presupuestos"
      />

      <header class="encabezado-nuevo-presupuesto">
        <div>
          <p class="etiqueta-seccion">Presupuestos</p>
          <h1 class="titulo-pagina">{{ tituloPagina }}</h1>
          <p class="texto-secundario encabezado-nuevo-presupuesto__descripcion">
            {{
              soloLectura
                ? 'Consultá la copia guardada, descargala o enviala cuando lo necesites.'
                : 'Agregá los conceptos, ajustá sus importes y revisá el total en el mismo ticket.'
            }}
          </p>
        </div>
      </header>

      <q-banner v-if="tieneErroresCarga" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ tieneErroresCarga }}
      </q-banner>

      <div v-if="cargandoPagina" class="estado-presupuestos">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando presupuesto…</span>
      </div>

      <section v-else-if="presupuestoNoEncontrado" class="estado-vacio-presupuestos">
        <q-icon name="receipt_long" aria-hidden="true" />
        <h2 class="titulo-seccion">No encontramos este presupuesto</h2>
        <p class="texto-secundario">
          Puede no estar disponible en este dispositivo o haber cambiado su almacenamiento.
        </p>
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          label="Volver a presupuestos"
          to="/presupuestos"
        />
      </section>

      <div v-else class="nuevo-presupuesto__contenido">
        <SelectorDestinatarioPresupuesto
          v-model:tipo="tipoDestinatario"
          v-model:id-cliente="idCliente"
          v-model:nombre="nombreDestinatario"
          v-model:telefono="telefonoDestinatario"
          :clientes="clientesStore.clientesOrdenados"
          :cargando="clientesStore.cargando"
          :solo-lectura="soloLectura"
        />

        <AgregadorMaterialPresupuesto
          v-if="!soloLectura"
          :materiales="materialesStore.materiales"
          :cargando="materialesStore.cargando"
          @agregar-material="agregarMaterial"
          @agregar-manual="agregarMaterialManual"
        />

        <section class="ticket-presupuesto" aria-labelledby="titulo-ticket-presupuesto">
          <div class="ticket-presupuesto__encabezado">
            <div class="ticket-presupuesto__encabezado-superior">
              <div>
                <p class="etiqueta-seccion">Detalle {{ soloLectura ? 'guardado' : 'editable' }}</p>
                <h2 id="titulo-ticket-presupuesto" class="titulo-seccion">Ticket</h2>
                <q-btn
                  v-if="!soloLectura"
                  class="boton-secundario ticket-presupuesto__agregar-mano-obra"
                  flat
                  dense
                  no-caps
                  icon="add"
                  label="Mano de obra"
                  aria-label="Agregar otra mano de obra"
                  @click="agregarManoObra"
                />
              </div>

              <div class="ticket-presupuesto__fecha-controles">
                <q-input
                  v-model="fechaPresupuesto"
                  class="ticket-presupuesto__fecha"
                  dark
                  outlined
                  dense
                  type="date"
                  label="Fecha"
                  :readonly="soloLectura"
                />
                <q-btn
                  v-if="!soloLectura"
                  class="boton-icono-secundario"
                  flat
                  round
                  dense
                  icon="today"
                  aria-label="Restablecer la fecha al día actual"
                  @click="restablecerFechaPresupuesto"
                />
              </div>
            </div>
          </div>

          <div v-if="lineas.length" class="ticket-presupuesto__lineas">
            <FilaPresupuesto
              v-for="(linea, indice) in lineas"
              :key="linea.id"
              v-model="lineas[indice]!"
              :moneda-presupuesto="monedaPresupuesto"
              :tarifas-mano-obra="configuracionStore.configuracion.tarifasManoObra"
              :solo-lectura="soloLectura"
              @eliminar="eliminarLinea(linea.id)"
              @confirmar-conversion="confirmarConversionLinea(indice)"
            />
          </div>

          <div v-else class="ticket-presupuesto__vacio">
            <q-icon name="receipt_long" aria-hidden="true" />
            <strong>El ticket está vacío</strong>
            <span>{{
              soloLectura ? 'Este presupuesto no tiene conceptos.' : 'Agregá un material.'
            }}</span>
          </div>

          <ResumenPresupuesto
            v-model:moneda="monedaPresupuesto"
            :lineas="lineas"
            :moneda-principal="configuracionStore.monedaPrincipal"
            :solo-lectura="soloLectura"
          />
        </section>

        <section class="acciones-presupuesto" aria-label="Acciones del presupuesto">
          <div class="acciones-presupuesto__edicion">
            <q-btn
              v-if="soloLectura && presupuesto"
              class="boton-accion-principal"
              unelevated
              no-caps
              icon="edit"
              label="Editar"
              :disable="presupuestosStore.guardando || accionDocumento !== null"
              :to="`/presupuestos/${presupuesto.id}/editar`"
            />
            <template v-else>
              <q-btn
                class="boton-accion-principal"
                unelevated
                no-caps
                icon="save"
                :label="esEdicion ? 'Guardar cambios' : 'Guardar'"
                :loading="presupuestosStore.guardando"
                :disable="presupuestosStore.guardando || accionDocumento !== null"
                @click="esEdicion ? guardarCambios() : guardarNuevoYFinalizar()"
              />

              <Transition name="confirmacion-cancelacion" mode="out-in">
                <div
                  v-if="mostrarConfirmacionCancelar"
                  key="confirmacion"
                  class="confirmacion-cancelacion-presupuesto"
                  role="alert"
                >
                  <q-btn
                    class="boton-peligro"
                    flat
                    no-caps
                    icon="warning_amber"
                    label="Hay cambios sin guardar. ¿Descartar?"
                    @click="confirmarCancelacion"
                  />
                  <q-btn
                    class="boton-icono-secundario"
                    flat
                    round
                    dense
                    icon="close"
                    aria-label="Anular la cancelación"
                    @click="mostrarConfirmacionCancelar = false"
                  />
                </div>
                <q-btn
                  v-else
                  key="cancelar"
                  class="boton-secundario"
                  flat
                  no-caps
                  icon="close"
                  :label="esEdicion ? 'Cancelar cambios' : 'Cancelar'"
                  :disable="presupuestosStore.guardando || accionDocumento !== null"
                  @click="solicitarCancelacion"
                />
              </Transition>
            </template>
          </div>

          <div class="acciones-presupuesto__salida">
            <q-btn
              class="boton-secundario"
              no-caps
              flat
              icon="visibility"
              label="Vista previa"
              :disable="presupuestosStore.guardando || accionDocumento !== null"
              @click="abrirVistaPrevia"
            />
            <q-btn
              v-if="!esEdicion"
              class="boton-secundario"
              flat
              no-caps
              icon="download"
              label="Descargar PDF"
              :loading="accionDocumento === 'descargar'"
              :disable="presupuestosStore.guardando || accionDocumento !== null"
              @click="descargarPresupuesto"
            />
            <q-btn
              v-if="!esEdicion"
              class="boton-secundario"
              flat
              no-caps
              :icon="mdiWhatsapp"
              label="Enviar"
              :loading="accionDocumento === 'enviar'"
              :disable="
                presupuestosStore.guardando ||
                accionDocumento !== null ||
                telefonoDestinatario.trim() === '' ||
                nombreDestinatario.trim() === ''
              "
              @click="enviarPresupuesto"
            />
          </div>
        </section>

        <ControlEstadoPresupuesto
          v-if="soloLectura && presupuesto"
          :estado="presupuesto.estado"
          :fecha-cambio-estado="presupuesto.fechaCambioEstado"
          :estado-en-proceso="estadoEnProceso"
          @cambiar="cambiarEstado"
        />

        <DocumentoPresupuesto
          v-if="!esEdicion"
          ref="documentoPresupuesto"
          :datos="datosDocumento"
          :configuracion="configuracionDocumentoEfectiva"
          oculto
        />
      </div>
    </main>
  </q-page>
</template>
