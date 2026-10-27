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
type CategoriaConfiguracion = 'empresa' | 'valores' | 'cobros' | 'comunicacion' | 'copias';
const categoriaActiva = ref<CategoriaConfiguracion>('empresa');
const CATEGORIAS_CONFIGURACION: {
  id: CategoriaConfiguracion;
  nombre: string;
  descripcion: string;
  icono: string;
}[] = [
  { id: 'empresa', nombre: 'Empresa', descripcion: 'Identidad y contacto', icono: 'business' },
  { id: 'valores', nombre: 'Valores', descripcion: 'Tarifas y moneda', icono: 'payments' },
  {
    id: 'cobros',
    nombre: 'Cobros y redes',
    descripcion: 'Pagos y perfiles',
    icono: 'account_balance_wallet',
  },
  {
    id: 'comunicacion',
    nombre: 'Comunicación',
    descripcion: 'Mensaje final',
    icono: 'chat_bubble_outline',
  },
  {
    id: 'copias',
    nombre: 'Copias de seguridad',
    descripcion: 'Exportar e importar',
    icono: 'backup',
  },
];

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
    throw new Error(
      'Los datos se guardaron, pero no se pudieron actualizar todos los listados. Recargá la aplicación.',
    );
  }
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal contenedor-configuracion">
      <header class="encabezado-configuracion">
        <h1 class="titulo-pagina">Configuración</h1>
        <p class="texto-secundario">Administrá los datos de tu empresa y sus valores habituales.</p>
        <span v-if="cambiosPendientes" class="configuracion-cambios-pendientes" role="status">
          <q-icon name="edit_note" aria-hidden="true" /> Cambios sin guardar
        </span>
      </header>

      <q-banner v-if="configuracionStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ configuracionStore.error }}
      </q-banner>

      <div v-if="configuracionStore.cargando" class="estado-configuracion">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando configuración…</span>
      </div>

      <div v-else class="espacio-configuracion">
        <nav class="navegacion-configuracion" aria-label="Categorías de configuración">
          <button
            v-for="categoria in CATEGORIAS_CONFIGURACION"
            :key="categoria.id"
            type="button"
            class="navegacion-configuracion__item"
            :class="{ 'navegacion-configuracion__item--activo': categoriaActiva === categoria.id }"
            :aria-pressed="categoriaActiva === categoria.id"
            @click="categoriaActiva = categoria.id"
          >
            <q-icon :name="categoria.icono" aria-hidden="true" />
            <span class="navegacion-configuracion__texto">
              <strong>{{ categoria.nombre }}</strong>
              <small>{{ categoria.descripcion }}</small>
            </span>
          </button>
        </nav>

        <div class="espacio-configuracion__contenido">
          <FormularioConfiguracion
            v-show="categoriaActiva !== 'copias'"
            v-model:categoria-activa="categoriaActiva"
            :configuracion="configuracionStore.configuracion"
            :guardando="configuracionStore.guardando"
            @guardar="guardarConfiguracion"
            @cambios-pendientes="cambiosPendientes = $event"
          />
          <div v-show="categoriaActiva === 'copias'">
            <PanelCopiasSeguridad
              :cambios-pendientes="cambiosPendientes"
              :actualizar-datos="actualizarDatosImportados"
            />
          </div>
        </div>
      </div>
    </main>
  </q-page>
</template>
