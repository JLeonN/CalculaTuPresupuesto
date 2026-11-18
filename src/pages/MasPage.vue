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
          </span>
          <q-icon name="chevron_right" aria-hidden="true" />
        </router-link>
      </nav>

      <q-expansion-item label="Licencias de código abierto" icon="description">
        <div class="texto-secundario">
          <p>
            La aplicación incluye @capgo/native-purchases 8.9.6, distribuido bajo la licencia
            Mozilla Public License 2.0.
          </p>
          <p>
            <a
              href="https://www.mozilla.org/en-US/MPL/2.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar licencia MPL 2.0
            </a>
            ·
            <a
              href="https://github.com/Cap-go/capacitor-native-purchases/tree/085c482dc0b8be0c407e56b909b801164a9ba5ed"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar código fuente del plugin
            </a>
          </p>
        </div>
      </q-expansion-item>
    </main>
  </q-page>
</template>
