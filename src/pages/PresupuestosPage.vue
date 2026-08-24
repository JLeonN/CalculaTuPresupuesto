<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BuscadorListado from '@/components/BuscadorListado.vue';
import InsigniaEstadoPresupuesto from '@/components/presupuestos/InsigniaEstadoPresupuesto.vue';
import { calcularTotalPresupuesto } from '@/dominio/presupuestos';
import { formatearImporte } from '@/dominio/materiales';
import { usePresupuestosStore } from '@/stores/presupuestos';

const presupuestosStore = usePresupuestosStore();
const terminoBusqueda = ref<string | null>('');
const presupuestosFiltrados = computed(() =>
  presupuestosStore.buscarPresupuestos(terminoBusqueda.value ?? ''),
);

onMounted(() => {
  if (presupuestosStore.presupuestos.length === 0) {
    void presupuestosStore.cargarPresupuestos();
  }
});

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal modulo-presupuestos">
      <header class="encabezado-modulo-presupuestos">
        <div>
          <p class="etiqueta-seccion">Trabajos cotizados</p>
          <h1 class="titulo-pagina">Presupuestos</h1>
          <p class="texto-secundario encabezado-modulo-presupuestos__descripcion">
            Consultá los presupuestos guardados y volvé a abrirlos cuando lo necesites.
          </p>
        </div>
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          icon="add"
          label="Nuevo presupuesto"
          to="/presupuestos/nuevo"
        />
      </header>

      <BuscadorListado
        v-model="terminoBusqueda"
        class="buscador-presupuestos"
        etiqueta="Buscar por cliente, teléfono o fecha"
      />

      <q-banner v-if="presupuestosStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ presupuestosStore.error }}
      </q-banner>

      <div v-if="presupuestosStore.cargando" class="estado-presupuestos">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando presupuestos…</span>
      </div>

      <section
        v-else-if="presupuestosFiltrados.length"
        class="lista-presupuestos"
        aria-label="Lista de presupuestos"
      >
        <div class="tabla-presupuestos" role="table" aria-label="Presupuestos guardados">
          <div class="tabla-presupuestos__encabezado" role="row">
            <span role="columnheader">Cliente</span>
            <span role="columnheader">Fecha</span>
            <span role="columnheader">Total</span>
            <span role="columnheader">Estado</span>
            <span aria-label="Acciones" role="columnheader" />
          </div>
          <div
            v-for="presupuesto in presupuestosFiltrados"
            :key="presupuesto.id"
            class="tabla-presupuestos__fila"
            role="row"
          >
            <strong role="cell">{{ presupuesto.destinatario.nombre || 'Sin nombre' }}</strong>
            <span role="cell">{{ formatearFecha(presupuesto.fechaPresupuesto) }}</span>
            <strong role="cell">
              {{
                formatearImporte(
                  calcularTotalPresupuesto(presupuesto.lineas, presupuesto.moneda),
                  presupuesto.moneda,
                )
              }}
            </strong>
            <span role="cell">
              <InsigniaEstadoPresupuesto :estado="presupuesto.estado" />
            </span>
            <q-btn
              class="boton-secundario"
              flat
              no-caps
              icon-right="arrow_forward"
              label="Ver presupuesto"
              :to="`/presupuestos/${presupuesto.id}`"
            />
          </div>
        </div>

        <div class="tarjetas-presupuestos">
          <article
            v-for="presupuesto in presupuestosFiltrados"
            :key="presupuesto.id"
            class="tarjeta-presupuesto-guardado"
          >
            <div>
              <h2>{{ presupuesto.destinatario.nombre || 'Sin nombre' }}</h2>
              <span class="texto-secundario">{{
                formatearFecha(presupuesto.fechaPresupuesto)
              }}</span>
            </div>
            <strong>
              {{
                formatearImporte(
                  calcularTotalPresupuesto(presupuesto.lineas, presupuesto.moneda),
                  presupuesto.moneda,
                )
              }}
            </strong>
            <InsigniaEstadoPresupuesto :estado="presupuesto.estado" />
            <q-btn
              class="boton-secundario"
              flat
              dense
              no-caps
              icon-right="arrow_forward"
              label="Ver presupuesto"
              :to="`/presupuestos/${presupuesto.id}`"
            />
          </article>
        </div>
      </section>

      <section v-else class="estado-vacio-presupuestos">
        <q-icon name="request_quote" aria-hidden="true" />
        <h2 class="titulo-seccion">
          {{
            terminoBusqueda ? 'No encontramos coincidencias' : 'Todavía no guardaste presupuestos'
          }}
        </h2>
        <p class="texto-secundario">
          {{
            terminoBusqueda
              ? 'Probá buscar por otro cliente, teléfono o fecha.'
              : 'Creá el primer presupuesto para comenzar tu registro de trabajos.'
          }}
        </p>
        <q-btn
          v-if="!terminoBusqueda"
          class="boton-accion-principal"
          unelevated
          no-caps
          icon="add"
          label="Nuevo presupuesto"
          to="/presupuestos/nuevo"
        />
      </section>
    </main>
  </q-page>
</template>
