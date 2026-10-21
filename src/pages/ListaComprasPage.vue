<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FilaListaCompras from '@/components/presupuestos/FilaListaCompras.vue';
import {
  obtenerMaterialesListaCompras,
  type CambiosMaterialListaCompras,
} from '@/dominio/listaCompras';
import type { Presupuesto } from '@/dominio/presupuestos';
import { usePresupuestosStore } from '@/stores/presupuestos';

const ruta = useRoute();
const router = useRouter();
const presupuestosStore = usePresupuestosStore();
const idPresupuesto = computed(() => String(ruta.params.idPresupuesto ?? ''));
const presupuesto = computed<Presupuesto | undefined>(() =>
  presupuestosStore.obtenerPresupuestoPorId(idPresupuesto.value),
);
const materialesOrdenados = computed(() =>
  obtenerMaterialesListaCompras(presupuesto.value?.lineas ?? []),
);
const cantidadPendientes = computed(
  () => materialesOrdenados.value.filter((linea) => !linea.comprado).length,
);
const cantidadComprados = computed(
  () => materialesOrdenados.value.length - cantidadPendientes.value,
);
const errorAccion = ref<string | null>(null);
const idLineaConError = ref<string | null>(null);
const idLineaGuardando = ref<string | null>(null);
const cargandoPagina = ref(true);
const errorCarga = ref<string | null>(null);

watch(
  idPresupuesto,
  async () => {
    cargandoPagina.value = true;
    errorCarga.value = null;
    errorAccion.value = null;
    idLineaConError.value = null;
    try {
      await presupuestosStore.cargarPresupuestos();
      errorCarga.value = presupuestosStore.error;
    } finally {
      cargandoPagina.value = false;
    }
  },
  { immediate: true },
);

async function guardarCambiosMaterial(
  idLinea: string,
  cambios: CambiosMaterialListaCompras,
  restaurarFoco = false,
): Promise<void> {
  if (idLineaGuardando.value) return;
  idLineaGuardando.value = idLinea;
  idLineaConError.value = null;
  errorAccion.value = null;
  try {
    await presupuestosStore.actualizarMaterialListaCompras(idPresupuesto.value, idLinea, cambios);
    if (restaurarFoco) {
      await nextTick();
      const fila = Array.from(document.querySelectorAll<HTMLElement>('.lista-compras__fila')).find(
        (elemento) => elemento.dataset.idLinea === idLinea,
      );
      fila?.querySelector<HTMLElement>('.lista-compras__checkbox')?.focus();
    }
  } catch (errorCapturado) {
    idLineaConError.value = idLinea;
    errorAccion.value =
      errorCapturado instanceof Error ? errorCapturado.message : 'No se pudo guardar el material.';
  } finally {
    idLineaGuardando.value = null;
  }
}

function volverAlPresupuesto(): void {
  void router.push(`/presupuestos/${idPresupuesto.value}`);
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal lista-compras">
      <header class="lista-compras__encabezado">
        <div>
          <p class="etiqueta-seccion">Presupuesto guardado</p>
          <h1 class="titulo-pagina">Lista de compras</h1>
          <template v-if="presupuesto">
            <p class="texto-secundario">
              {{ presupuesto.destinatario.nombre || 'Sin nombre' }} ·
              {{ formatearFecha(presupuesto.fechaPresupuesto) }} · {{ presupuesto.estado }}
            </p>
          </template>
        </div>
        <div class="lista-compras__acciones">
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="arrow_back"
            label="Volver al presupuesto"
            @click="volverAlPresupuesto"
          />
          <q-btn
            v-if="presupuesto"
            class="boton-secundario"
            flat
            no-caps
            icon="edit"
            label="Editar ticket"
            :to="`/presupuestos/${idPresupuesto}/editar`"
          />
        </div>
      </header>

      <div v-if="cargandoPagina" class="estado-presupuestos">
        <q-spinner class="indicador-carga" size="2rem" /><span>Cargando lista…</span>
      </div>
      <q-banner v-else-if="errorCarga" class="aviso-error" rounded>{{ errorCarga }}</q-banner>
      <section v-else-if="!presupuesto" class="estado-vacio-presupuestos">
        <h2 class="titulo-seccion">No encontramos este presupuesto</h2>
        <q-btn
          class="boton-secundario"
          flat
          no-caps
          label="Volver a presupuestos"
          to="/presupuestos"
        />
      </section>
      <section v-else-if="materialesOrdenados.length === 0" class="estado-vacio-presupuestos">
        <h2 class="titulo-seccion">Todavía no hay materiales</h2>
        <p class="texto-secundario">Agregalos desde el ticket.</p>
        <q-btn
          class="boton-secundario"
          flat
          no-caps
          label="Editar ticket"
          :to="`/presupuestos/${idPresupuesto}/editar`"
        />
      </section>
      <div v-else class="lista-compras__grupos">
        <h2 class="titulo-seccion" aria-live="polite">Pendientes ({{ cantidadPendientes }})</h2>
        <p v-if="cantidadPendientes === 0" class="texto-secundario">
          No hay materiales pendientes.
        </p>
        <template v-for="(linea, indice) in materialesOrdenados" :key="linea.id">
          <h2 v-if="indice === cantidadPendientes" class="titulo-seccion" aria-live="polite">
            Comprados ({{ cantidadComprados }})
          </h2>
          <FilaListaCompras
            :data-id-linea="linea.id"
            :linea="linea"
            :guardando="idLineaGuardando !== null"
            :precio-editable="presupuesto.estado === 'pendiente'"
            :error="idLineaConError === linea.id ? errorAccion : null"
            @cambiar-comprado="(comprado) => guardarCambiosMaterial(linea.id, { comprado }, true)"
            @guardar-detalles="(cambios) => guardarCambiosMaterial(linea.id, cambios)"
          />
        </template>
        <template v-if="cantidadComprados === 0">
          <h2 class="titulo-seccion">Comprados (0)</h2>
          <p class="texto-secundario">Todavía no marcaste materiales como comprados.</p>
        </template>
      </div>
    </main>
  </q-page>
</template>
