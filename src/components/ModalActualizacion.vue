<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { CLAVES_ALMACENAMIENTO } from '@/configuracion/clavesAlmacenamiento';

interface GrupoCambios {
  apartado: string;
  novedades: string[];
}

interface InformacionVersion {
  version: string;
  mostrarActualizacion: boolean;
  cambios: Record<string, GrupoCambios[]>;
}

const modalVisible = ref(false);
const gruposVisibles = ref<GrupoCambios[]>([]);
let identificadorActualizacion = '';

function esGrupoCambios(valor: unknown): valor is GrupoCambios {
  if (typeof valor !== 'object' || valor === null) return false;

  const grupo = valor as Partial<GrupoCambios>;
  return (
    typeof grupo.apartado === 'string' &&
    Array.isArray(grupo.novedades) &&
    grupo.novedades.length > 0 &&
    grupo.novedades.every((novedad) => typeof novedad === 'string' && novedad.trim().length > 0)
  );
}

function esInformacionVersion(valor: unknown): valor is InformacionVersion {
  if (typeof valor !== 'object' || valor === null) return false;

  const informacion = valor as Partial<InformacionVersion>;
  return (
    typeof informacion.version === 'string' &&
    typeof informacion.mostrarActualizacion === 'boolean' &&
    typeof informacion.cambios === 'object' &&
    informacion.cambios !== null &&
    Object.values(informacion.cambios).every(
      (grupos) => Array.isArray(grupos) && grupos.every(esGrupoCambios),
    )
  );
}

function seleccionarGrupos(cambios: Record<string, GrupoCambios[]>): GrupoCambios[] {
  const idiomasDisponibles = Object.keys(cambios);
  const idiomaNavegador = navigator.language;
  const idiomaBase = idiomaNavegador.split('-')[0];
  const idiomaSeleccionado =
    idiomasDisponibles.find((idioma) => idioma === idiomaNavegador) ??
    idiomasDisponibles.find((idioma) => idioma.split('-')[0] === idiomaBase) ??
    (idiomasDisponibles.includes('es-AR') ? 'es-AR' : idiomasDisponibles[0]);

  return idiomaSeleccionado ? (cambios[idiomaSeleccionado] ?? []) : [];
}

function obtenerActualizacionVista(): string | null {
  try {
    return localStorage.getItem(CLAVES_ALMACENAMIENTO.actualizacionVista);
  } catch {
    return null;
  }
}

function recordarActualizacionVista(): void {
  if (!identificadorActualizacion) return;

  try {
    localStorage.setItem(CLAVES_ALMACENAMIENTO.actualizacionVista, identificadorActualizacion);
  } catch {
    // El modal puede cerrarse igualmente si el almacenamiento no está disponible.
  }
}

async function cargarActualizacion(): Promise<void> {
  try {
    const respuesta = await fetch(`${import.meta.env.BASE_URL}version.json`, {
      cache: 'no-store',
    });
    if (!respuesta.ok) return;

    const informacion: unknown = await respuesta.json();
    if (!esInformacionVersion(informacion) || !informacion.mostrarActualizacion) return;

    const grupos = seleccionarGrupos(informacion.cambios);
    if (grupos.length === 0) return;

    identificadorActualizacion = `${informacion.version}:${JSON.stringify(grupos)}`;
    if (obtenerActualizacionVista() === identificadorActualizacion) return;

    gruposVisibles.value = grupos;
    modalVisible.value = true;
  } catch {
    // Una falla de red o un JSON inválido no debe impedir el uso de la aplicación.
  }
}

onMounted(() => {
  void cargarActualizacion();
});
</script>

<template>
  <q-dialog v-model="modalVisible" @hide="recordarActualizacionVista">
    <q-card class="modal-actualizacion">
      <q-card-section class="modal-actualizacion__encabezado">
        <q-icon name="new_releases" aria-hidden="true" />
        <div>
          <p class="etiqueta-seccion">Nueva versión</p>
          <h2 class="titulo-seccion">Novedades de la aplicación</h2>
        </div>
      </q-card-section>

      <q-card-section class="modal-actualizacion__contenido">
        <section v-for="grupo in gruposVisibles" :key="grupo.apartado">
          <h3>{{ grupo.apartado }}</h3>
          <ul>
            <li v-for="novedad in grupo.novedades" :key="novedad">{{ novedad }}</li>
          </ul>
        </section>
      </q-card-section>

      <q-card-actions align="right" class="modal-actualizacion__acciones">
        <q-btn v-close-popup class="boton-accion-principal" unelevated no-caps label="Entendido" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
