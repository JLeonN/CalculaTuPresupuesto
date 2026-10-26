<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import FormularioConfiguracion from '@/components/configuracion/FormularioConfiguracion.vue';
import PanelCopiasSeguridad from '@/components/configuracion/PanelCopiasSeguridad.vue';
import type { DatosConfiguracion } from '@/dominio/configuracion';
import { useConfiguracionStore } from '@/stores/configuracion';
import { useClientesStore } from '@/stores/clientes';
import { useMaterialesStore } from '@/stores/materiales';
import { usePresupuestosStore } from '@/stores/presupuestos';

const $q = useQuasar();
const configuracionStore = useConfiguracionStore();
const clientesStore = useClientesStore();
const materialesStore = useMaterialesStore();
const presupuestosStore = usePresupuestosStore();
const cambiosPendientes = ref(false);

onMounted(() => {
  void configuracionStore.asegurarConfiguracionCargada();
});

async function guardarConfiguracion(datos: DatosConfiguracion): Promise<void> {
  try {
    await configuracionStore.guardarConfiguracion(datos);
    $q.notify({
      message: 'La configuración se guardó correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
  } catch {
    // El store mantiene un mensaje listo para mostrar en esta pantalla.
  }
}

async function actualizarDatosImportados(recargarConfiguracion: boolean): Promise<void> {
  await Promise.all([
    clientesStore.cargarClientes(),
    materialesStore.cargarMateriales(),
    presupuestosStore.cargarPresupuestos(),
    recargarConfiguracion ? configuracionStore.cargarConfiguracion() : Promise.resolve(),
  ]);
  if (
    clientesStore.error ||
    materialesStore.error ||
    presupuestosStore.error ||
    (recargarConfiguracion && configuracionStore.error)
  ) {
    throw new Error('Los datos se guardaron, pero no se pudieron actualizar todos los listados. Recargá la aplicación.');
  }
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal contenedor-configuracion">
      <header class="encabezado-configuracion">
        <p class="etiqueta-seccion">Preferencias generales</p>
        <h1 class="titulo-pagina">Configuración</h1>
        <p class="texto-secundario">Administrá los datos de tu empresa y sus valores habituales.</p>
      </header>

      <q-banner v-if="configuracionStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ configuracionStore.error }}
      </q-banner>

      <div v-if="configuracionStore.cargando" class="estado-configuracion">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando configuración…</span>
      </div>

      <FormularioConfiguracion
        v-else
        :configuracion="configuracionStore.configuracion"
        :guardando="configuracionStore.guardando"
        @guardar="guardarConfiguracion"
        @cambios-pendientes="cambiosPendientes = $event"
      />
      <PanelCopiasSeguridad
        :cambios-pendientes="cambiosPendientes"
        :actualizar-datos="actualizarDatosImportados"
      />
    </main>
  </q-page>
</template>
