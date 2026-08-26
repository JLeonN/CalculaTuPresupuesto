<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import SelectorMoneda from '@/components/monedas/SelectorMoneda.vue';
import {
  calcularCostoUnitario,
  crearPrecioMaterial,
  obtenerUnidadMedida,
  PRESENTACIONES,
  UNIDADES_MEDIDA,
  type DatosMaterial,
  type DatosPrecioMaterial,
  type Material,
} from '@/dominio/materiales';
import { crearOpcionesMonedaOperacion, formatearImporte, type Moneda } from '@/dominio/monedas';

const props = defineProps<{
  material: Material | undefined;
  guardando: boolean;
  monedaPrincipal: Moneda;
}>();

const emitir = defineEmits<{
  guardar: [datos: DatosMaterial];
  cancelar: [];
}>();

const OPCIONES_MODALIDAD = [
  { label: 'Precio directo', value: 'directo' },
  { label: 'Por presentación', value: 'presentacion' },
];
const nombre = ref('');
const precios = ref<DatosPrecioMaterial[]>([]);
const idPrecioPredeterminado = ref('');
const esEdicion = computed(() => props.material !== undefined);

watch(() => props.material, cargarDatosMaterial, { immediate: true });

function cargarDatosMaterial(material: Material | undefined): void {
  nombre.value = material?.nombre ?? '';
  precios.value = material
    ? material.precios.map((precio) => ({
        id: precio.id,
        comercio: precio.comercio,
        moneda: precio.moneda,
        modalidad: precio.modalidad,
        importe: precio.importe,
        unidadMedida: precio.unidadMedida,
        unidadPersonalizada: precio.unidadPersonalizada,
        presentacion: precio.presentacion,
        presentacionPersonalizada: precio.presentacionPersonalizada,
        cantidadContenido: precio.cantidadContenido,
        precioCantidadParcial: precio.precioCantidadParcial ?? null,
        valorVisible: precio.valorVisible,
      }))
    : [crearPrecioMaterial(props.monedaPrincipal)];
  idPrecioPredeterminado.value = material?.idPrecioPredeterminado ?? precios.value[0]?.id ?? '';
}

function agregarPrecio(): void {
  const precio = crearPrecioMaterial(props.monedaPrincipal);
  precios.value.push(precio);
  idPrecioPredeterminado.value ||= precio.id;
}

function eliminarPrecio(idPrecio: string): void {
  if (precios.value.length === 1) {
    return;
  }

  precios.value = precios.value.filter((precio) => precio.id !== idPrecio);
  if (idPrecioPredeterminado.value === idPrecio) {
    idPrecioPredeterminado.value = precios.value[0]?.id ?? '';
  }
}

function textoCostoCalculado(precio: DatosPrecioMaterial): string {
  const costo = calcularCostoUnitario(precio);
  if (costo === null) {
    return 'Ingresá el precio total y el contenido para calcular el costo aproximado.';
  }

  return `${formatearImporte(costo, precio.moneda)} por ${obtenerUnidadMedida(precio).toLocaleLowerCase('es')}`;
}

function textoPrecioCantidadParcial(precio: DatosPrecioMaterial): string {
  const importe = precio.precioCantidadParcial ?? 0;
  if (importe <= 0) {
    return 'Ingresá el precio para una cantidad parcial.';
  }

  return `${formatearImporte(importe, precio.moneda)} por ${obtenerUnidadMedida(precio).toLocaleLowerCase('es')}`;
}

function tituloReferencia(precio: DatosPrecioMaterial): string {
  return `Referencia por ${obtenerUnidadMedida(precio).toLocaleLowerCase('es')}`;
}

function opcionesValorVisible(precio: DatosPrecioMaterial) {
  return [
    { label: 'Mostrar total', value: 'total' },
    {
      label: `Mostrar por ${obtenerUnidadMedida(precio).toLocaleLowerCase('es')}`,
      value: 'unitario',
    },
  ];
}

function opcionesMonedaPrecio(precio: DatosPrecioMaterial) {
  return crearOpcionesMonedaOperacion(props.monedaPrincipal, precio.moneda);
}

function validarPositivo(valor: unknown, mensaje: string): true | string {
  return Number(valor) > 0 || mensaje;
}

function guardarMaterial(): void {
  emitir('guardar', {
    nombre: nombre.value,
    precios: precios.value,
    idPrecioPredeterminado: idPrecioPredeterminado.value,
  });
}
</script>

<template>
  <q-form class="formulario-material" greedy @submit="guardarMaterial">
    <div class="formulario-material__contenedor">
      <section class="seccion-formulario" aria-labelledby="titulo-datos-material">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Datos principales</p>
            <h2 id="titulo-datos-material" class="titulo-seccion">Material</h2>
          </div>
        </div>

        <q-input
          v-model="nombre"
          dark
          outlined
          label="Nombre del material"
          :rules="[(valor) => Boolean(String(valor).trim()) || 'Ingresá el nombre del material.']"
        />
      </section>

      <section class="seccion-formulario" aria-labelledby="titulo-precios-material">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Precios del material</p>
            <h2 id="titulo-precios-material" class="titulo-seccion">Precios</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Marcá como predeterminado el precio que querés ver en la lista.
            </p>
          </div>
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="add"
            label="Agregar precio"
            @click="agregarPrecio"
          />
        </div>

        <div class="lista-campos-repetibles">
          <article
            v-for="(precio, indice) in precios"
            :key="precio.id"
            class="bloque-repetible bloque-precio"
          >
            <div class="bloque-repetible__campos campos-precio-material">
              <div class="encabezado-precio-material">
                <strong>Precio {{ indice + 1 }}</strong>
                <q-radio
                  v-model="idPrecioPredeterminado"
                  class="selector-principal"
                  :val="precio.id"
                  label="Predeterminado"
                />
              </div>

              <q-input
                v-model="precio.comercio"
                dark
                outlined
                label="Comercio o proveedor"
                :rules="[
                  (valor) => Boolean(String(valor).trim()) || 'Ingresá el comercio o proveedor.',
                ]"
              />

              <q-btn-toggle
                v-model="precio.modalidad"
                class="selector-modalidad-precio"
                no-caps
                spread
                unelevated
                toggle-color="primary"
                :options="OPCIONES_MODALIDAD"
              />

              <div v-if="precio.modalidad === 'directo'" class="grilla-campos-precio">
                <div class="grupo-precio-moneda">
                  <q-input
                    v-model.number="precio.importe"
                    dark
                    outlined
                    type="number"
                    min="0"
                    step="0.01"
                    label="Precio"
                    :prefix="precio.moneda"
                    :rules="[
                      (valor) => validarPositivo(valor, 'Ingresá un precio mayor que cero.'),
                    ]"
                  />
                  <SelectorMoneda
                    v-model="precio.moneda"
                    class="selector-moneda-precio"
                    :opciones="opcionesMonedaPrecio(precio)"
                    etiqueta="Moneda"
                    denso
                  />
                </div>
                <q-select
                  v-model="precio.unidadMedida"
                  dark
                  outlined
                  label="Unidad de medida"
                  :options="UNIDADES_MEDIDA"
                />
                <q-input
                  v-if="precio.unidadMedida === 'Otro'"
                  v-model="precio.unidadPersonalizada"
                  dark
                  outlined
                  label="Nombre de la unidad"
                  :rules="[
                    (valor) => Boolean(String(valor).trim()) || 'Ingresá la unidad de medida.',
                  ]"
                />
              </div>

              <template v-else>
                <div class="grilla-campos-precio">
                  <q-select
                    v-model="precio.presentacion"
                    dark
                    outlined
                    label="Presentación"
                    :options="PRESENTACIONES"
                  />
                  <q-input
                    v-if="precio.presentacion === 'Otro'"
                    v-model="precio.presentacionPersonalizada"
                    dark
                    outlined
                    label="Nombre de la presentación"
                    :rules="[
                      (valor) => Boolean(String(valor).trim()) || 'Ingresá la presentación.',
                    ]"
                  />
                </div>

                <div class="grupo-precio-moneda">
                  <q-input
                    v-model.number="precio.importe"
                    dark
                    outlined
                    type="number"
                    min="0"
                    step="0.01"
                    label="Precio de la presentación"
                    :prefix="precio.moneda"
                    :rules="[
                      (valor) => validarPositivo(valor, 'Ingresá un precio mayor que cero.'),
                    ]"
                  />
                  <SelectorMoneda
                    v-model="precio.moneda"
                    class="selector-moneda-precio"
                    :opciones="opcionesMonedaPrecio(precio)"
                    etiqueta="Moneda"
                    denso
                  />
                </div>

                <div class="grilla-campos-precio">
                  <q-input
                    v-model.number="precio.cantidadContenido"
                    dark
                    outlined
                    type="number"
                    min="0"
                    step="0.01"
                    label="Cantidad que contiene"
                    :rules="[
                      (valor) => validarPositivo(valor, 'Ingresá una cantidad mayor que cero.'),
                    ]"
                  />
                  <q-select
                    v-model="precio.unidadMedida"
                    dark
                    outlined
                    label="Unidad del contenido"
                    :options="UNIDADES_MEDIDA"
                  />
                  <q-input
                    v-if="precio.unidadMedida === 'Otro'"
                    v-model="precio.unidadPersonalizada"
                    dark
                    outlined
                    label="Nombre de la unidad"
                    :rules="[
                      (valor) => Boolean(String(valor).trim()) || 'Ingresá la unidad de medida.',
                    ]"
                  />
                </div>

                <q-input
                  v-model.number="precio.precioCantidadParcial"
                  dark
                  outlined
                  type="number"
                  min="0"
                  step="0.01"
                  :label="`Precio por ${obtenerUnidadMedida(precio).toLocaleLowerCase('es')}`"
                  :prefix="precio.moneda"
                  hint="Este precio se usará cuando el cliente necesite menos de una presentación completa."
                  :rules="[
                    (valor) =>
                      validarPositivo(valor, 'Ingresá el precio para una cantidad parcial.'),
                  ]"
                />

                <section class="resumen-precios-parciales" aria-live="polite">
                  <p class="etiqueta-seccion">{{ tituloReferencia(precio) }}</p>
                  <div
                    class="resumen-precios-parciales__fila resumen-precios-parciales__fila--destacada"
                  >
                    <span>Precio para cantidad parcial</span>
                    <strong>{{ textoPrecioCantidadParcial(precio) }}</strong>
                  </div>
                  <div class="resumen-precios-parciales__fila">
                    <span>Costo calculado</span>
                    <strong>{{ textoCostoCalculado(precio) }}</strong>
                  </div>
                  <p class="resumen-precios-parciales__ayuda">
                    El costo calculado es únicamente informativo.
                  </p>
                </section>

                <div>
                  <span class="etiqueta-control-precio">Precio que se mostrará</span>
                  <q-btn-toggle
                    v-model="precio.valorVisible"
                    class="selector-modalidad-precio"
                    no-caps
                    spread
                    unelevated
                    toggle-color="primary"
                    :options="opcionesValorVisible(precio)"
                  />
                </div>
              </template>
            </div>

            <q-btn
              v-if="precios.length > 1"
              class="boton-icono-secundario"
              flat
              round
              dense
              icon="delete_outline"
              :aria-label="`Quitar precio ${indice + 1}`"
              @click="eliminarPrecio(precio.id)"
            />
          </article>
        </div>
      </section>

      <div class="acciones-formulario">
        <q-btn class="boton-secundario" flat no-caps label="Cancelar" @click="emitir('cancelar')" />
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          type="submit"
          :loading="guardando"
          :label="esEdicion ? 'Guardar cambios' : 'Guardar material'"
        />
      </div>
    </div>
  </q-form>
</template>
