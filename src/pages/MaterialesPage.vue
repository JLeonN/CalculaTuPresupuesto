<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BuscadorListado from '@/components/BuscadorListado.vue';
import PaginacionListado from '@/components/PaginacionListado.vue';
import { usePaginacionListado } from '@/composables/usePaginacionListado';
import {
  formatearPrecioVisible,
  obtenerPrecioPredeterminado,
  type Material,
} from '@/dominio/materiales';
import {
  useMaterialesStore,
  type CriterioOrdenMaterial,
  type DireccionOrden,
} from '@/stores/materiales';

const materialesStore = useMaterialesStore();
const terminoBusqueda = ref<string | null>('');
const criterioOrden = ref<CriterioOrdenMaterial>('nombre');
const direccionOrden = ref<DireccionOrden>('ascendente');
const materialesFiltrados = computed(() =>
  materialesStore.buscarMateriales(
    terminoBusqueda.value ?? '',
    criterioOrden.value,
    direccionOrden.value,
  ),
);
const { paginaActual, totalPaginas, registrosPagina: materialesPagina } = usePaginacionListado(
  materialesFiltrados,
  [terminoBusqueda, criterioOrden, direccionOrden],
);

onMounted(() => {
  void materialesStore.cargarMateriales();
});

function ordenarPor(criterio: CriterioOrdenMaterial): void {
  if (criterioOrden.value === criterio) {
    direccionOrden.value = direccionOrden.value === 'ascendente' ? 'descendente' : 'ascendente';
    return;
  }

  criterioOrden.value = criterio;
  direccionOrden.value = 'ascendente';
}

function iconoOrden(criterio: CriterioOrdenMaterial): string | undefined {
  if (criterioOrden.value !== criterio) {
    return undefined;
  }

  return direccionOrden.value === 'ascendente' ? 'arrow_upward' : 'arrow_downward';
}

function precioPrincipal(material: Material): string {
  const precio = obtenerPrecioPredeterminado(material);
  return precio ? formatearPrecioVisible(precio) : 'Sin precio';
}

function localPrincipal(material: Material): string {
  return obtenerPrecioPredeterminado(material)?.comercio || 'Sin local';
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal modulo-materiales">
      <header class="encabezado-modulo-materiales">
        <div>
          <p class="etiqueta-seccion">Precios del material</p>
          <h1 class="titulo-pagina">Materiales</h1>
          <p class="texto-secundario encabezado-modulo-materiales__descripcion">
            Consultá tus materiales y los precios que usás como referencia.
          </p>
        </div>
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          icon="add_box"
          label="Agregar material nuevo"
          to="/materiales/nuevo"
        />
      </header>

      <BuscadorListado
        v-model="terminoBusqueda"
        class="buscador-materiales"
        etiqueta="Buscar por material o local"
      />

      <div class="controles-orden-materiales" aria-label="Ordenar materiales">
        <span class="texto-secundario">Ordenar por</span>
        <q-btn
          v-for="opcion in [
            { criterio: 'nombre' as const, etiqueta: 'Nombre' },
            { criterio: 'precio' as const, etiqueta: 'Precio' },
            { criterio: 'local' as const, etiqueta: 'Local' },
          ]"
          :key="opcion.criterio"
          :class="[
            'boton-orden-material',
            { 'boton-orden-material--activo': criterioOrden === opcion.criterio },
          ]"
          flat
          no-caps
          :label="opcion.etiqueta"
          :icon-right="iconoOrden(opcion.criterio)"
          @click="ordenarPor(opcion.criterio)"
        />
      </div>

      <q-banner v-if="materialesStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ materialesStore.error }}
      </q-banner>

      <div v-if="materialesStore.cargando" class="estado-materiales">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando materiales…</span>
      </div>

      <section
        v-else-if="materialesFiltrados.length"
        class="lista-materiales"
        aria-label="Lista de materiales"
      >
        <div class="tabla-materiales" role="table" aria-label="Materiales registrados">
          <div class="tabla-materiales__encabezado" role="row">
            <span role="columnheader">Material</span>
            <span role="columnheader">Local</span>
            <span role="columnheader">Precio</span>
            <span aria-label="Acciones" role="columnheader" />
          </div>
          <div
            v-for="material in materialesPagina"
            :key="material.id"
            class="tabla-materiales__fila"
            role="row"
          >
            <strong role="cell">{{ material.nombre }}</strong>
            <span role="cell">{{ localPrincipal(material) }}</span>
            <span role="cell">{{ precioPrincipal(material) }}</span>
            <q-btn
              class="boton-secundario boton-ver-material"
              flat
              no-caps
              icon-right="arrow_forward"
              label="Ver material"
              :to="`/materiales/${material.id}`"
            />
          </div>
        </div>

        <div class="tarjetas-materiales">
          <article
            v-for="material in materialesPagina"
            :key="material.id"
            class="tarjeta-material"
          >
            <h2>{{ material.nombre }}</h2>
            <div class="tarjeta-material__datos">
              <span><q-icon name="store" />{{ localPrincipal(material) }}</span>
            </div>
            <div class="tarjeta-material__pie">
              <strong>{{ precioPrincipal(material) }}</strong>
              <q-btn
                class="boton-secundario boton-ver-material tarjeta-material__accion"
                flat
                dense
                no-caps
                icon-right="arrow_forward"
                label="Ver material"
                :to="`/materiales/${material.id}`"
              />
            </div>
          </article>
        </div>
        <PaginacionListado v-model="paginaActual" :total-paginas="totalPaginas" />
      </section>

      <section v-else class="estado-vacio-materiales">
        <q-icon name="inventory_2" aria-hidden="true" />
        <h2 class="titulo-seccion">
          {{ terminoBusqueda ? 'No encontramos coincidencias' : 'Todavía no agregaste materiales' }}
        </h2>
        <p class="texto-secundario">
          {{
            terminoBusqueda
              ? 'Probá buscar por otro material o local.'
              : 'Agregá el primer material para registrar sus precios de referencia.'
          }}
        </p>
        <q-btn
          v-if="!terminoBusqueda"
          class="boton-accion-principal"
          unelevated
          no-caps
          icon="add_box"
          label="Agregar material nuevo"
          to="/materiales/nuevo"
        />
      </section>
    </main>
  </q-page>
</template>
