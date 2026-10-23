<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import FormularioCliente from '@/components/clientes/FormularioCliente.vue';
import type { DatosCliente } from '@/dominio/clientes';
import { useClientesStore } from '@/stores/clientes';

const router = useRouter();
const $q = useQuasar();
const clientesStore = useClientesStore();
onMounted(async () => {
  if (clientesStore.clientes.length === 0) {
    await clientesStore.cargarClientes();
  }
});

async function guardarCliente(datos: DatosCliente): Promise<void> {
  try {
    const clienteGuardado = await clientesStore.agregarCliente(datos);

    $q.notify({
      message: 'Cliente agregado correctamente.',
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
        <p class="etiqueta-seccion">Nuevo registro</p>
        <h1 class="titulo-pagina">Agregar cliente nuevo</h1>
        <p class="texto-secundario">
          Ingresá el nombre y completá solamente los datos que tengas disponibles.
        </p>
      </header>

      <q-banner v-if="clientesStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>
        {{ clientesStore.error }}
      </q-banner>

      <FormularioCliente
        :guardando="clientesStore.guardando"
        @guardar="guardarCliente"
        @cancelar="cancelar"
      />
    </main>
  </q-page>
</template>
