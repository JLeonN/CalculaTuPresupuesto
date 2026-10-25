<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BuscadorListado from '@/components/BuscadorListado.vue';
import TextoDesplazable from '@/components/TextoDesplazable.vue';
import InsigniaEstadoPresupuesto from '@/components/presupuestos/InsigniaEstadoPresupuesto.vue';
import { formatearImporte } from '@/dominio/monedas';
import { calcularTotalPresupuesto } from '@/dominio/presupuestos';
import { useClientesStore } from '@/stores/clientes';
import { usePresupuestosStore } from '@/stores/presupuestos';

const ruta = useRoute();
const presupuestosStore = usePresupuestosStore();
const clientesStore = useClientesStore();
const terminoBusqueda = ref<string | null>('');
const esHistorialCliente = computed(() => ruta.name === 'historial-presupuestos-cliente');
const clienteActual = computed(() =>
  esHistorialCliente.value
    ? clientesStore.obtenerClientePorId(String(ruta.params.idCliente))
    : undefined,
);
const presupuestosFiltrados = computed(() => {
  const encontrados = presupuestosStore.buscarPresupuestos(terminoBusqueda.value ?? '');
  return esHistorialCliente.value
    ? encontrados.filter(
        (presupuesto) =>
          presupuesto.destinatario.tipo === 'guardado' &&
          presupuesto.destinatario.idCliente === clienteActual.value?.id,
      )
    : encontrados;
});
const rutaNuevoPresupuesto = computed(() =>
  esHistorialCliente.value && clienteActual.value
    ? `/presupuestos/nuevo?idCliente=${encodeURIComponent(clienteActual.value.id)}`
    : '/presupuestos/nuevo',
);

watch(
  () => [ruta.name, ruta.params.idCliente],
  () => {
    terminoBusqueda.value = '';
    void presupuestosStore.cargarPresupuestos();
    if (esHistorialCliente.value) void clientesStore.cargarClientes();
  },
  { immediate: true },
);

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
          <h1 class="titulo-pagina">
            {{
              esHistorialCliente && clienteActual
                ? `Presupuestos de ${clienteActual.nombre}`
                : 'Presupuestos'
            }}
          </h1>
          <p class="texto-secundario encabezado-modulo-presupuestos__descripcion">
            {{
              esHistorialCliente
                ? 'Consultá los presupuestos vinculados con este cliente.'
                : 'Consultá los presupuestos guardados y volvé a abrirlos cuando lo necesites.'
            }}
          </p>
        </div>
        <div class="encabezado-modulo-presupuestos__acciones">
          <q-btn
            v-if="esHistorialCliente && clienteActual"
            class="boton-secundario boton-volver-adaptable"
            flat
            no-caps
            icon="arrow_back"
            label="Volver al cliente"
            :to="`/clientes/${encodeURIComponent(clienteActual.id)}`"
          />
          <q-btn
            v-if="!esHistorialCliente || clienteActual"
            class="boton-accion-principal"
            unelevated
            no-caps
            icon="add"
            label="Nuevo presupuesto"
            :to="rutaNuevoPresupuesto"
          />
        </div>
      </header>

      <BuscadorListado
        v-if="!esHistorialCliente || clienteActual"
        v-model="terminoBusqueda"
        class="buscador-presupuestos"
        :etiqueta="
          esHistorialCliente ? 'Buscar en sus presupuestos' : 'Buscar por cliente, teléfono o fecha'
        "
      />

      <q-banner v-if="presupuestosStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ presupuestosStore.error }}
      </q-banner>
      <q-banner v-if="esHistorialCliente && clientesStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ clientesStore.error }}
      </q-banner>

      <div
        v-if="presupuestosStore.cargando || (esHistorialCliente && clientesStore.cargando)"
        class="estado-presupuestos"
      >
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando presupuestos…</span>
      </div>
      <section
        v-else-if="presupuestosStore.error || (esHistorialCliente && clientesStore.error)"
        class="estado-vacio-presupuestos"
      >
        <p class="texto-secundario">No se pudo mostrar la lista de presupuestos.</p>
      </section>
      <section
        v-else-if="esHistorialCliente && !clienteActual"
        class="estado-vacio-presupuestos"
      >
        <q-icon name="person_off" aria-hidden="true" />
        <h2 class="titulo-seccion">No encontramos este cliente</h2>
        <q-btn
          class="boton-secundario"
          flat
          no-caps
          label="Volver a clientes"
          to="/clientes"
        />
      </section>

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
                  calcularTotalPresupuesto(
                    presupuesto.lineas,
                    presupuesto.moneda,
                    presupuesto.porcentajeAdicionalMateriales,
                  ),
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
            <div class="tarjeta-presupuesto-guardado__encabezado">
              <h2>
                <TextoDesplazable :texto="presupuesto.destinatario.nombre || 'Sin nombre'" />
              </h2>
              <span class="texto-secundario tarjeta-presupuesto-guardado__fecha">{{
                formatearFecha(presupuesto.fechaPresupuesto)
              }}</span>
            </div>
            <strong>
              {{
                formatearImporte(
                  calcularTotalPresupuesto(
                    presupuesto.lineas,
                    presupuesto.moneda,
                    presupuesto.porcentajeAdicionalMateriales,
                  ),
                  presupuesto.moneda,
                )
              }}
            </strong>
            <div class="tarjeta-presupuesto-guardado__acciones">
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
            </div>
          </article>
        </div>
      </section>

      <section v-else class="estado-vacio-presupuestos">
        <q-icon name="request_quote" aria-hidden="true" />
        <h2 class="titulo-seccion">
          {{
            terminoBusqueda
              ? 'No encontramos coincidencias'
              : esHistorialCliente
                ? 'Este cliente todavía no tiene presupuestos'
                : 'Todavía no guardaste presupuestos'
          }}
        </h2>
        <p class="texto-secundario">
          {{
            terminoBusqueda
              ? esHistorialCliente
                ? 'Probá con otra búsqueda.'
                : 'Probá buscar por otro cliente, teléfono o fecha.'
              : esHistorialCliente
                ? 'Creá un presupuesto para este cliente.'
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
          :to="rutaNuevoPresupuesto"
        />
      </section>
    </main>
  </q-page>
</template>
