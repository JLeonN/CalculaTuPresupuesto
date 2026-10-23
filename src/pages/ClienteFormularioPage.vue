<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import FormularioCliente from '@/components/clientes/FormularioCliente.vue';
import type { Cliente, DatosCliente } from '@/dominio/clientes';
import { useClientesStore } from '@/stores/clientes';

const ruta = useRoute();
const router = useRouter();
const $q = useQuasar();
const clientesStore = useClientesStore();
const cliente = ref<Cliente>();
const clienteNoEncontrado = ref(false);
const cargandoCliente = ref(false);
const esEdicion = computed(() => typeof ruta.params.idCliente === 'string');
const agregarLocalAlAbrir = computed(() => ruta.query.agregarLocal === '1');

onMounted(async () => {
  cargandoCliente.value = esEdicion.value;

  try {
    if (clientesStore.clientes.length === 0) {
      await clientesStore.cargarClientes();
    }

    if (!esEdicion.value) {
      return;
    }

    cliente.value = clientesStore.obtenerClientePorId(String(ruta.params.idCliente));
    clienteNoEncontrado.value = cliente.value === undefined;
  } finally {
    cargandoCliente.value = false;
  }
});

async function guardarCliente(datos: DatosCliente): Promise<void> {
  try {
    const clienteGuardado =
      esEdicion.value && cliente.value
        ? await clientesStore.editarCliente(cliente.value.id, datos)
        : await clientesStore.agregarCliente(datos);

    $q.notify({
      message: esEdicion.value
        ? 'Los cambios se guardaron correctamente.'
        : 'Cliente agregado correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
    void router.replace(`/clientes/${clienteGuardado.id}`);
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
    <main class="contenedor-principal contenedor-formulario-cliente">
      <q-btn
        class="boton-secundario"
        flat
        no-caps
        icon="arrow_back"
        label="Volver"
        @click="cancelar"
      />

      <header class="encabezado-formulario-cliente">
        <p class="etiqueta-seccion">{{ esEdicion ? 'Actualizar datos' : 'Nuevo registro' }}</p>
        <h1 class="titulo-pagina">{{ esEdicion ? 'Editar cliente' : 'Agregar cliente nuevo' }}</h1>
        <p class="texto-secundario">
          {{
            esEdicion
              ? 'Modificá los datos que necesites y guardá los cambios.'
              : 'Ingresá el nombre y completá solamente los datos que tengas disponibles.'
          }}
        </p>
      </header>

      <q-banner v-if="clientesStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ clientesStore.error }}
      </q-banner>

      <div v-if="cargandoCliente" class="estado-clientes">
        <q-spinner class="indicador-carga" size="2rem" />
        <span>Cargando datos del cliente…</span>
      </div>

      <section v-else-if="clienteNoEncontrado" class="estado-vacio-clientes">
        <q-icon name="person_off" aria-hidden="true" />
        <h2 class="titulo-seccion">No encontramos este cliente</h2>
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

      <FormularioCliente
        v-else-if="!esEdicion || cliente"
        :key="cliente?.id ?? 'nuevo-cliente'"
        :cliente="cliente"
        :guardando="clientesStore.guardando"
        :agregar-local-al-abrir="agregarLocalAlAbrir"
        @guardar="guardarCliente"
        @cancelar="cancelar"
      />
    </main>
  </q-page>
</template>
