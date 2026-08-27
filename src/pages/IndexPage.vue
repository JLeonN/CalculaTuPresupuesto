<script setup lang="ts">
import BotonSesion from '@/components/autenticacion/BotonSesion.vue';
import LogoEmpresa from '@/components/LogoEmpresa.vue';
import { obtenerElementosNavegacion } from '@/configuracion/navegacion';
import { useIdentidadAplicacion } from '@/composables/useIdentidadAplicacion';

const accesosRapidos = obtenerElementosNavegacion('acceso-inicio');
const { logoVisible, textoAlternativoLogo } = useIdentidadAplicacion();
</script>

<template>
  <q-page class="pagina-contenido pagina-inicio">
    <main class="contenedor-principal">
      <section class="presentacion-inicio" aria-labelledby="titulo-principal">
        <BotonSesion />

        <div class="presentacion-inicio__contenido">
          <p class="etiqueta-seccion">Gestión de presupuestos</p>
          <h1 id="titulo-principal" class="presentacion-inicio__titulo">
            Tu trabajo, bien presupuestado.
          </h1>
          <p class="texto-secundario presentacion-inicio__descripcion">
            Prepará cada presupuesto con claridad y mantené tu trabajo organizado desde un solo
            lugar.
          </p>
          <q-btn
            class="boton-accion-principal presentacion-inicio__accion"
            unelevated
            no-caps
            icon="add"
            label="Nuevo presupuesto"
            to="/presupuestos/nuevo"
          />
        </div>

        <div class="presentacion-inicio__marca">
          <LogoEmpresa
            tamano="grande"
            :origen="logoVisible"
            :texto-alternativo="textoAlternativoLogo"
          />
        </div>
      </section>

      <section class="seccion-accesos" aria-labelledby="titulo-accesos">
        <div class="encabezado-seccion">
          <div>
            <p class="etiqueta-seccion">Accesos rápidos</p>
            <h2 id="titulo-accesos" class="titulo-seccion">¿Qué necesitás hacer?</h2>
          </div>
        </div>

        <div class="grilla-accesos">
          <router-link
            v-for="elemento in accesosRapidos"
            :key="elemento.nombre"
            :to="elemento.ruta"
            class="tarjeta-acceso"
          >
            <span class="tarjeta-acceso__icono" aria-hidden="true">
              <q-icon :name="elemento.icono" />
            </span>
            <span class="tarjeta-acceso__contenido">
              <strong>{{ elemento.etiqueta }}</strong>
              <small>Abrir sección</small>
            </span>
            <q-icon class="tarjeta-acceso__flecha" name="arrow_forward" aria-hidden="true" />
          </router-link>
        </div>
      </section>
    </main>
  </q-page>
</template>
