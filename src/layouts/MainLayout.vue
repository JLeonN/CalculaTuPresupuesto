<script setup lang="ts">
import { computed, onMounted, onUnmounted, type WatchStopHandle } from 'vue';
import { useRoute } from 'vue-router';
import LogoEmpresa from '@/components/LogoEmpresa.vue';
import {
  ELEMENTO_MAS,
  estaElementoActivo,
  obtenerElementosNavegacion,
  type ElementoNavegacion,
} from '@/configuracion/navegacion';
import { SUBTITULO_APLICACION } from '@/configuracion/identidadAplicacion';
import { useIdentidadAplicacion } from '@/composables/useIdentidadAplicacion';
import { useAutenticacionStore } from '@/stores/autenticacion';
import { useConfiguracionStore } from '@/stores/configuracion';

const ruta = useRoute();
const autenticacionStore = useAutenticacionStore();
const configuracionStore = useConfiguracionStore();
const { nombreEmpresaVisible, logoVisible, textoAlternativoLogo, sincronizarFavicon } =
  useIdentidadAplicacion();
const elementosMenuEscritorio = obtenerElementosNavegacion('menu-escritorio');
const elementosBarraMovil = [...obtenerElementosNavegacion('barra-movil'), ELEMENTO_MAS];
let detenerSincronizacionFavicon: WatchStopHandle | undefined;

const rutaActual = computed(() => ruta.path);
const etiquetaEnlaceInicio = computed(() => `Ir al inicio de ${nombreEmpresaVisible.value}`);

onMounted(() => {
  detenerSincronizacionFavicon = sincronizarFavicon();
  void configuracionStore.asegurarConfiguracionCargada();
});

onUnmounted(() => {
  detenerSincronizacionFavicon?.();
});

function estaActivo(elemento: ElementoNavegacion): boolean {
  return estaElementoActivo(elemento, rutaActual.value);
}
</script>

<template>
  <q-layout
    view="hHh LpR fFf"
    class="aplicacion-presupuestos"
    :class="{
      'aplicacion-presupuestos--modo-prueba': !autenticacionStore.estaAutenticado,
    }"
  >
    <q-header v-if="$q.screen.lt.md" class="encabezado-movil">
      <q-toolbar class="encabezado-movil__barra">
        <router-link class="marca-movil" to="/" :aria-label="etiquetaEnlaceInicio">
          <LogoEmpresa
            tamano="pequeno"
            :origen="logoVisible"
            :texto-alternativo="textoAlternativoLogo"
          />
          <span>{{ nombreEmpresaVisible }}</span>
        </router-link>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="$q.screen.gt.sm"
      :model-value="true"
      show-if-above
      bordered
      class="menu-escritorio"
    >
      <aside class="menu-escritorio__contenido" aria-label="Navegación principal">
        <router-link class="marca-escritorio" to="/" :aria-label="etiquetaEnlaceInicio">
          <LogoEmpresa
            tamano="mediano"
            :origen="logoVisible"
            :texto-alternativo="textoAlternativoLogo"
          />
          <span class="marca-escritorio__texto">
            <strong>{{ nombreEmpresaVisible }}</strong>
            <small>{{ SUBTITULO_APLICACION }}</small>
          </span>
        </router-link>

        <q-btn
          class="boton-accion-principal menu-escritorio__accion"
          unelevated
          no-caps
          icon="add"
          label="Nuevo presupuesto"
          to="/presupuestos/nuevo"
        />

        <nav class="lista-navegacion" aria-label="Secciones">
          <router-link
            v-for="elemento in elementosMenuEscritorio"
            :key="elemento.nombre"
            :to="elemento.ruta"
            class="enlace-navegacion-escritorio"
            :class="{ 'enlace-navegacion-escritorio--activo': estaActivo(elemento) }"
            :aria-current="estaActivo(elemento) ? 'page' : undefined"
          >
            <q-icon :name="elemento.icono" aria-hidden="true" />
            <span>{{ elemento.etiqueta }}</span>
          </router-link>
        </nav>
      </aside>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer v-if="$q.screen.lt.md" class="navegacion-movil">
      <nav class="navegacion-movil__contenido" aria-label="Navegación principal">
        <router-link
          v-for="elemento in elementosBarraMovil"
          :key="elemento.nombre"
          :to="elemento.ruta"
          class="enlace-navegacion-movil"
          :class="{ 'enlace-navegacion-movil--activo': estaActivo(elemento) }"
          :aria-current="estaActivo(elemento) ? 'page' : undefined"
        >
          <q-icon :name="elemento.icono" aria-hidden="true" />
          <span>{{ elemento.etiqueta }}</span>
        </router-link>
      </nav>
    </q-footer>
  </q-layout>
</template>
