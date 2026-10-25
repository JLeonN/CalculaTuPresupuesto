<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BuscadorListado from '@/components/BuscadorListado.vue';
import PaginacionListado from '@/components/PaginacionListado.vue';
import EnlaceWhatsapp from '@/components/clientes/EnlaceWhatsapp.vue';
import { usePaginacionListado } from '@/composables/usePaginacionListado';
import {
  obtenerLocalesConDatos,
  obtenerTelefonoPrincipal,
  type LocalCliente,
} from '@/dominio/clientes';
import { useClientesStore } from '@/stores/clientes';

const clientesStore = useClientesStore();
const terminoBusqueda = ref<string | null>('');
const clientesFiltrados = computed(() => clientesStore.buscarClientes(terminoBusqueda.value ?? ''));
const { paginaActual, totalPaginas, registrosPagina: clientesPagina } = usePaginacionListado(
  clientesFiltrados,
  [terminoBusqueda],
);

onMounted(() => {
  void clientesStore.cargarClientes();
});

function textoLocales(locales: LocalCliente[]): string {
  const localesConDatos = obtenerLocalesConDatos(locales);
  const primerLocal = localesConDatos[0];

  if (primerLocal === undefined) {
    return 'Sin locales';
  }

  const nombreVisible = primerLocal.nombre || primerLocal.direccion || 'Local sin nombre';
  const cantidadRestante = localesConDatos.length - 1;

  return cantidadRestante > 0 ? `${nombreVisible} +${cantidadRestante} más` : nombreVisible;
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal modulo-clientes">
      <header class="encabezado-modulo-clientes">
        <div>
          <p class="etiqueta-seccion">Organización</p>
          <h1 class="titulo-pagina">Clientes</h1>
          <p class="texto-secundario encabezado-modulo-clientes__descripcion">
            Consultá los datos de cada cliente y los lugares donde trabajás.
          </p>
        </div>
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          icon="person_add"
          label="Agregar cliente nuevo"
          to="/clientes/nuevo"
        />
      </header>

      <BuscadorListado
        v-model="terminoBusqueda"
        class="buscador-clientes"
        etiqueta="Buscar por cliente, local o teléfono"
      />

      <q-banner v-if="clientesStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ clientesStore.error }}
      </q-banner>

      <div v-if="clientesStore.cargando" class="estado-clientes">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando clientes…</span>
      </div>

      <section
        v-else-if="clientesFiltrados.length"
        class="lista-clientes"
        aria-label="Lista de clientes"
      >
        <div class="tabla-clientes" role="table" aria-label="Clientes registrados">
          <div class="tabla-clientes__encabezado" role="row">
            <span role="columnheader">Cliente</span>
            <span role="columnheader">Locales</span>
            <span role="columnheader">Teléfono principal</span>
            <span aria-label="Acciones" role="columnheader" />
          </div>
          <div
            v-for="cliente in clientesPagina"
            :key="cliente.id"
            class="tabla-clientes__fila"
            role="row"
          >
            <strong role="cell">{{ cliente.nombre }}</strong>
            <span role="cell">{{ textoLocales(cliente.locales) }}</span>
            <div role="cell">
              <EnlaceWhatsapp
                v-if="obtenerTelefonoPrincipal(cliente)"
                :nombre-cliente="cliente.nombre"
                :numero="obtenerTelefonoPrincipal(cliente)!.numero"
              />
              <span v-else class="texto-secundario">Sin teléfono</span>
            </div>
            <q-btn
              class="boton-secundario"
              flat
              no-caps
              icon-right="arrow_forward"
              label="Ver cliente"
              :to="`/clientes/${cliente.id}`"
            />
          </div>
        </div>

        <div class="tarjetas-clientes">
          <article v-for="cliente in clientesPagina" :key="cliente.id" class="tarjeta-cliente">
            <div class="tarjeta-cliente__contenido">
              <h2>{{ cliente.nombre }}</h2>
              <div class="tarjeta-cliente__datos">
                <span>
                  <q-icon name="place" aria-hidden="true" />
                  {{ textoLocales(cliente.locales) }}
                </span>
                <span>
                  <q-icon name="phone" aria-hidden="true" />
                  {{ obtenerTelefonoPrincipal(cliente)?.numero ?? 'Sin teléfono' }}
                </span>
              </div>
            </div>
            <div class="tarjeta-cliente__acciones">
              <EnlaceWhatsapp
                v-if="obtenerTelefonoPrincipal(cliente)"
                etiqueta="WhatsApp"
                :nombre-cliente="cliente.nombre"
                :numero="obtenerTelefonoPrincipal(cliente)!.numero"
              />
              <q-btn
                class="boton-secundario"
                flat
                no-caps
                icon-right="arrow_forward"
                label="Ver ficha"
                :to="`/clientes/${cliente.id}`"
              />
            </div>
          </article>
        </div>
        <PaginacionListado v-model="paginaActual" :total-paginas="totalPaginas" />
      </section>

      <section v-else class="estado-vacio-clientes">
        <q-icon name="groups" aria-hidden="true" />
        <h2 class="titulo-seccion">
          {{ terminoBusqueda ? 'No encontramos coincidencias' : 'Todavía no agregaste clientes' }}
        </h2>
        <p class="texto-secundario">
          {{
            terminoBusqueda
              ? 'Probá buscar por otro nombre, local o teléfono.'
              : 'Agregá el primer cliente para empezar a organizar sus locales y contactos.'
          }}
        </p>
        <q-btn
          v-if="!terminoBusqueda"
          class="boton-accion-principal"
          unelevated
          no-caps
          icon="person_add"
          label="Agregar cliente nuevo"
          to="/clientes/nuevo"
        />
      </section>
    </main>
  </q-page>
</template>
