<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, type WatchStopHandle } from 'vue';
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
import { usePublicidad } from '@/composables/usePublicidad';
import { useAutenticacionStore } from '@/stores/autenticacion';
import { useConfiguracionStore } from '@/stores/configuracion';
import { SUSCRIPCION_HABILITADA } from '@/configuracion/configuracionSuscripcion';
import { useSuscripcionStore } from '@/stores/suscripcion';

const ruta = useRoute();
const autenticacionStore = useAutenticacionStore();
const configuracionStore = useConfiguracionStore();
const suscripcionStore = useSuscripcionStore();
const { nombreEmpresaVisible, logoVisible, textoAlternativoLogo, sincronizarFavicon } =
  useIdentidadAplicacion();
const { altoBanner, iniciarPublicidad, detenerPublicidad } = usePublicidad();
const elementosMenuEscritorio = obtenerElementosNavegacion('menu-escritorio');
const elementosBarraMovil = [...obtenerElementosNavegacion('barra-movil'), ELEMENTO_MAS];
let detenerSincronizacionFavicon: WatchStopHandle | undefined;

const rutaActual = computed(() => ruta.path);
const etiquetaEnlaceInicio = computed(() => `Ir al inicio de ${nombreEmpresaVisible.value}`);

function actualizarPublicidad(): void {
  if (!autenticacionStore.mostrarPublicidad || window.innerWidth < 320) {
    void detenerPublicidad();
  } else {
    void iniciarPublicidad();
  }
}

function revisarPublicidadAlVolver(): void {
  if (document.visibilityState === 'visible') {
    actualizarPublicidad();
    actualizarSuscripcion();
  }
}

function actualizarSuscripcion(): void {
  const uid = autenticacionStore.usuario?.id;
  if (SUSCRIPCION_HABILITADA && uid && navigator.onLine && !suscripcionStore.cargando) {
    void suscripcionStore.cargar(uid);
  }
}

watch(() => autenticacionStore.mostrarPublicidad, actualizarPublicidad, { immediate: true });

onMounted(() => {
  window.addEventListener('resize', actualizarPublicidad);
  document.addEventListener('visibilitychange', revisarPublicidadAlVolver);
  window.addEventListener('online', actualizarSuscripcion);
  detenerSincronizacionFavicon = sincronizarFavicon();
  void configuracionStore.asegurarConfiguracionCargada();
});

onUnmounted(() => {
  window.removeEventListener('resize', actualizarPublicidad);
  document.removeEventListener('visibilitychange', revisarPublicidadAlVolver);
  window.removeEventListener('online', actualizarSuscripcion);
  void detenerPublicidad();
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
      'aplicacion-presupuestos--modo-prueba': autenticacionStore.mostrarMarcaPresupuesto,
    }"
    :style="{
      '--alto-banner-publicidad': `${altoBanner}px`,
      '--separacion-banner-publicidad': altoBanner > 0 ? 'var(--espaciado-pequeno)' : '0px',
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
      <router-view :key="autenticacionStore.usuario?.id ?? 'visitante'" />
    </q-page-container>

    <q-dialog
      :model-value="SUSCRIPCION_HABILITADA && suscripcionStore.avisoPruebaVisible"
      @update:model-value="
        (visible) => {
          if (!visible) void suscripcionStore.cerrarAvisoPrueba();
        }
      "
    >
      <q-card>
        <q-card-section>
          <h2 class="titulo-seccion">Tu prueba Pro comenzó</h2>
          <p>
            Tenés 10 días para usar Pro sin ingresar una tarjeta. Al terminar, pasarás al plan
            Gratis si no te suscribís. Tus datos se conservarán.
          </p>
          <p v-if="suscripcionStore.error" role="alert">{{ suscripcionStore.error }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Entendido" @click="suscripcionStore.cerrarAvisoPrueba" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-footer v-if="$q.screen.lt.md || altoBanner > 0" class="navegacion-movil">
      <nav
        v-if="$q.screen.lt.md"
        class="navegacion-movil__contenido"
        aria-label="Navegación principal"
      >
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
      <div v-if="altoBanner > 0" class="separacion-publicidad" aria-hidden="true"></div>
      <div v-if="altoBanner > 0" class="reserva-publicidad" aria-hidden="true"></div>
    </q-footer>
  </q-layout>
</template>
