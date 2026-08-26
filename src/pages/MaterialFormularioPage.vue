<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import FormularioMaterial from '@/components/materiales/FormularioMaterial.vue';
import type { DatosMaterial, Material } from '@/dominio/materiales';
import { useMaterialesStore } from '@/stores/materiales';
import { useConfiguracionStore } from '@/stores/configuracion';

const ruta = useRoute();
const router = useRouter();
const $q = useQuasar();
const materialesStore = useMaterialesStore();
const configuracionStore = useConfiguracionStore();
const material = ref<Material>();
const materialNoEncontrado = ref(false);
const cargandoPagina = ref(true);
const esEdicion = computed(() => typeof ruta.params.idMaterial === 'string');

onMounted(async () => {
  cargandoPagina.value = true;

  try {
    await Promise.all([
      configuracionStore.asegurarConfiguracionCargada(),
      materialesStore.materiales.length === 0
        ? materialesStore.cargarMateriales()
        : Promise.resolve(),
    ]);

    if (!esEdicion.value) {
      return;
    }

    material.value = materialesStore.obtenerMaterialPorId(String(ruta.params.idMaterial));
    materialNoEncontrado.value = material.value === undefined;
  } finally {
    cargandoPagina.value = false;
  }
});

async function guardarMaterial(datos: DatosMaterial): Promise<void> {
  try {
    const materialGuardado =
      esEdicion.value && material.value
        ? await materialesStore.editarMaterial(material.value.id, datos)
        : await materialesStore.agregarMaterial(datos);

    $q.notify({
      message: esEdicion.value
        ? 'Los cambios se guardaron correctamente.'
        : 'Material agregado correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
    void router.replace(`/materiales/${materialGuardado.id}`);
  } catch {
    // El store mantiene un mensaje listo para mostrar en esta pantalla.
  }
}

function cancelar(): void {
  void router.back();
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal contenedor-formulario-material">
      <q-btn
        class="boton-secundario"
        flat
        no-caps
        icon="arrow_back"
        label="Volver"
        @click="cancelar"
      />

      <header class="encabezado-formulario-material">
        <p class="etiqueta-seccion">{{ esEdicion ? 'Actualizar costos' : 'Nuevo registro' }}</p>
        <h1 class="titulo-pagina">
          {{ esEdicion ? 'Editar material' : 'Agregar material nuevo' }}
        </h1>
        <p class="texto-secundario">
          {{
            esEdicion
              ? 'Modificá el material o sus precios y guardá los cambios.'
              : 'Ingresá el material y al menos un precio de compra.'
          }}
        </p>
      </header>

      <q-banner
        v-if="materialesStore.error || configuracionStore.error"
        class="aviso-error"
        rounded
      >
        <template #avatar><q-icon name="error_outline" /></template>
        {{ materialesStore.error || configuracionStore.error }}
      </q-banner>

      <div v-if="cargandoPagina" class="estado-materiales">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando datos del material…</span>
      </div>

      <section v-else-if="materialNoEncontrado" class="estado-vacio-materiales">
        <q-icon name="inventory_2" aria-hidden="true" />
        <h2 class="titulo-seccion">No encontramos este material</h2>
        <p class="texto-secundario">
          Puede haber sido eliminado o no estar disponible en este dispositivo.
        </p>
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          label="Volver a materiales"
          to="/materiales"
        />
      </section>

      <FormularioMaterial
        v-else-if="!esEdicion || material"
        :key="material?.id ?? 'nuevo-material'"
        :material="material"
        :guardando="materialesStore.guardando"
        :moneda-principal="configuracionStore.monedaPrincipal"
        @guardar="guardarMaterial"
        @cancelar="cancelar"
      />
    </main>
  </q-page>
</template>
