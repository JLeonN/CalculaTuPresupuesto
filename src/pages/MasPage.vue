<script setup lang="ts">
import { obtenerElementosNavegacion } from '@/configuracion/navegacion';

const opcionesAdicionales = obtenerElementosNavegacion('pagina-mas');
</script>

<template>
  <q-page class="pagina-contenido pagina-mas">
    <main class="contenedor-principal">
      <header class="encabezado-pagina">
        <p class="etiqueta-seccion">Otras herramientas</p>
        <h1 class="titulo-pagina">Más</h1>
        <p class="texto-secundario">Accedé a materiales y configuración.</p>
      </header>

      <nav class="lista-opciones" aria-label="Otras secciones">
        <router-link
          v-for="elemento in opcionesAdicionales"
          :key="elemento.nombre"
          :to="elemento.ruta"
          class="tarjeta-opcion"
        >
          <span class="tarjeta-opcion__icono" aria-hidden="true">
            <q-icon :name="elemento.icono" />
          </span>
          <span class="tarjeta-opcion__texto">
            <strong>{{ elemento.etiqueta }}</strong>
            <small>Próximamente</small>
          </span>
          <q-icon name="chevron_right" aria-hidden="true" />
        </router-link>
      </nav>
    </main>
  </q-page>
</template>
