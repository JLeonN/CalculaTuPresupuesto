<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import EnlaceWhatsapp from '@/components/clientes/EnlaceWhatsapp.vue';
import {
  obtenerLocalesConDatos,
  obtenerTelefonoPrincipal,
  obtenerTelefonosConNumero,
  type Cliente,
} from '@/dominio/clientes';
import { useClientesStore } from '@/stores/clientes';

const ruta = useRoute();
const router = useRouter();
const $q = useQuasar();
const clientesStore = useClientesStore();
const cliente = ref<Cliente>();
const mostrarConfirmacionEliminar = ref(false);
const idLocalActivo = ref<string | null>(null);
const telefonoPrincipal = computed(() =>
  cliente.value ? obtenerTelefonoPrincipal(cliente.value) : undefined,
);
const telefonosVisibles = computed(() =>
  cliente.value ? obtenerTelefonosConNumero(cliente.value.telefonos) : [],
);
const localesVisibles = computed(() =>
  cliente.value ? obtenerLocalesConDatos(cliente.value.locales) : [],
);
const descripcionEliminacion = computed(() => {
  const cantidadLocales = localesVisibles.value.length;
  if (cantidadLocales === 0) {
    return 'Esta acción no se puede deshacer.';
  }
  if (cantidadLocales === 1) {
    return 'Se eliminará también su local asociado.';
  }
  return `Se eliminarán también sus ${cantidadLocales} locales asociados.`;
});
const inicialesCliente = computed(() =>
  (cliente.value?.nombre.trim().split(/\s+/).slice(0, 2) ?? [])
    .map((palabra) => palabra.charAt(0).toLocaleUpperCase())
    .join(''),
);

watch(
  localesVisibles,
  (locales) => {
    if (!locales.some((local) => local.id === idLocalActivo.value)) {
      idLocalActivo.value = locales[0]?.id ?? null;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  if (clientesStore.clientes.length === 0) {
    await clientesStore.cargarClientes();
  }

  cliente.value = clientesStore.obtenerClientePorId(String(ruta.params.idCliente));
});

async function eliminarCliente(): Promise<void> {
  if (cliente.value === undefined) {
    return;
  }

  try {
    await clientesStore.eliminarCliente(cliente.value.id);
    $q.notify({
      message: 'Cliente eliminado correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
    void router.replace('/clientes');
  } catch {
    mostrarConfirmacionEliminar.value = false;
  }
}
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal contenedor-detalle-cliente">
      <q-btn
        v-if="!cliente"
        class="boton-secundario"
        flat
        no-caps
        icon="arrow_back"
        label="Volver a clientes"
        to="/clientes"
      />

      <section v-if="cliente" class="detalle-cliente">
        <header class="encabezado-detalle-cliente">
          <div class="encabezado-detalle-cliente__fila-superior">
            <p class="etiqueta-seccion">Ficha del cliente</p>
            <q-btn
              class="boton-secundario boton-volver-adaptable"
              flat
              no-caps
              icon="arrow_back"
              aria-label="Volver a clientes"
              to="/clientes"
            >
              <span class="boton-volver-adaptable__completo">Volver a clientes</span>
              <span class="boton-volver-adaptable__corto">Volver</span>
            </q-btn>
          </div>
          <div class="encabezado-detalle-cliente__principal">
            <div class="encabezado-detalle-cliente__perfil">
              <div class="encabezado-detalle-cliente__avatar" aria-hidden="true">
                {{ inicialesCliente }}
              </div>
              <div class="encabezado-detalle-cliente__datos">
                <h1 class="titulo-pagina">{{ cliente.nombre }}</h1>
                <p v-if="telefonoPrincipal" class="encabezado-detalle-cliente__telefono">
                  <q-icon name="phone" aria-hidden="true" />
                  {{ telefonoPrincipal.numero }}
                </p>
                <p v-else class="texto-secundario encabezado-detalle-cliente__telefono">
                  Sin teléfono principal
                </p>
              </div>
            </div>
            <q-btn
              class="boton-accion-principal encabezado-detalle-cliente__editar"
              unelevated
              no-caps
              icon="edit"
              label="Editar cliente"
              :to="`/clientes/${cliente.id}/editar`"
            />
          </div>
        </header>

        <div class="detalle-cliente__columnas">
          <section
            class="tarjeta-detalle-cliente tarjeta-detalle-cliente--contacto"
            aria-labelledby="titulo-telefonos-cliente"
          >
            <p class="etiqueta-seccion">Contacto</p>
            <h2 id="titulo-telefonos-cliente" class="titulo-seccion">
              {{
                telefonosVisibles.length === 1 && telefonosVisibles[0]?.etiqueta === 'Personal'
                  ? 'Teléfono personal'
                  : 'Teléfonos'
              }}
            </h2>
            <p class="texto-secundario tarjeta-detalle-cliente__descripcion">
              {{
                telefonosVisibles.length === 0
                  ? 'Sin teléfonos registrados.'
                  : 'Contactá al cliente por WhatsApp.'
              }}
            </p>
            <div v-if="telefonosVisibles.length > 0" class="lista-detalle-cliente">
              <article
                v-for="telefono in telefonosVisibles"
                :key="telefono.id"
                class="fila-detalle-cliente fila-detalle-cliente--telefono"
              >
                <q-icon name="phone" class="fila-detalle-cliente__icono" aria-hidden="true" />
                <div class="fila-detalle-cliente__datos">
                  <strong>{{ telefono.numero }}</strong>
                  <span>{{ telefono.etiqueta }}</span>
                </div>
                <q-badge v-if="telefono.esPrincipal" class="insignia-principal">
                  Principal
                </q-badge>
                <EnlaceWhatsapp
                  class="fila-detalle-cliente__accion"
                  :nombre-cliente="cliente.nombre"
                  :numero="telefono.numero"
                  etiqueta="Abrir WhatsApp"
                />
              </article>
            </div>
          </section>

          <section
            class="tarjeta-detalle-cliente tarjeta-detalle-cliente--locales"
            aria-labelledby="titulo-locales-cliente"
          >
            <p class="etiqueta-seccion">Lugar de trabajo</p>
            <h2 id="titulo-locales-cliente" class="titulo-seccion">Locales</h2>
            <div v-if="localesVisibles.length === 0" class="locales-cliente__vacio">
              <q-icon name="storefront" aria-hidden="true" />
              <p>Sin locales registrados</p>
              <q-btn
                class="boton-secundario locales-cliente__agregar"
                flat
                no-caps
                icon="add"
                label="Agregar local"
                :to="{ path: `/clientes/${cliente.id}/editar`, query: { agregarLocal: '1' } }"
              />
            </div>
            <template v-else>
              <q-tabs
                v-model="idLocalActivo"
                class="locales-cliente__pestanas"
                align="left"
                no-caps
                outside-arrows
                mobile-arrows
                active-color="primary"
                indicator-color="primary"
                aria-label="Locales del cliente"
              >
                <q-tab
                  v-for="(local, indice) in localesVisibles"
                  :key="local.id"
                  :name="local.id"
                  :label="local.nombre || `Local ${indice + 1}`"
                  :title="local.nombre || `Local ${indice + 1}`"
                />
              </q-tabs>
              <q-tab-panels v-model="idLocalActivo" class="locales-cliente__paneles">
                <q-tab-panel v-for="local in localesVisibles" :key="local.id" :name="local.id">
                  <q-icon name="place" aria-hidden="true" />
                  <div>
                    <strong>{{ local.nombre || 'Local sin nombre' }}</strong>
                    <p>{{ local.direccion || 'Sin dirección registrada.' }}</p>
                  </div>
                </q-tab-panel>
              </q-tab-panels>
              <q-btn
                class="boton-secundario locales-cliente__agregar"
                flat
                no-caps
                icon="add"
                label="Agregar local"
                :to="{ path: `/clientes/${cliente.id}/editar`, query: { agregarLocal: '1' } }"
              />
            </template>
          </section>
        </div>

        <section v-if="cliente.correo || cliente.notas" class="tarjeta-detalle-cliente">
          <p class="etiqueta-seccion">Datos adicionales</p>
          <div v-if="cliente.correo" class="dato-adicional-cliente">
            <span>Correo electrónico</span>
            <strong>{{ cliente.correo }}</strong>
          </div>
          <div v-if="cliente.notas" class="dato-adicional-cliente">
            <span>Notas generales</span>
            <p>{{ cliente.notas }}</p>
          </div>
        </section>

        <section class="zona-peligro-cliente" aria-label="Eliminar cliente">
          <p class="texto-secundario">{{ descripcionEliminacion }}</p>
          <q-btn
            class="boton-peligro"
            flat
            no-caps
            icon="delete_outline"
            label="Eliminar cliente"
            @click="mostrarConfirmacionEliminar = true"
          />
        </section>
      </section>

      <section v-else class="estado-vacio-clientes">
        <q-icon name="person_off" aria-hidden="true" />
        <h1 class="titulo-seccion">No encontramos este cliente</h1>
        <p class="texto-secundario">
          Puede haber sido eliminado o no estar disponible en este dispositivo.
        </p>
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          label="Volver a clientes"
          to="/clientes"
        />
      </section>
    </main>
  </q-page>

  <q-dialog v-model="mostrarConfirmacionEliminar" persistent>
    <q-card class="dialogo-confirmacion">
      <q-card-section>
        <p class="etiqueta-seccion">Acción irreversible</p>
        <h2 class="titulo-seccion">¿Eliminar a {{ cliente?.nombre }}?</h2>
        <p class="texto-secundario">{{ descripcionEliminacion }}</p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn class="boton-secundario" flat no-caps label="Cancelar" v-close-popup />
        <q-btn
          class="boton-peligro"
          flat
          no-caps
          :loading="clientesStore.guardando"
          label="Eliminar cliente"
          @click="eliminarCliente"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
