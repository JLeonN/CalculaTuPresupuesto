<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LOGO_PREDETERMINADO, NOMBRE_APLICACION } from '@/configuracion/identidadAplicacion';
import {
  crearMetodoPagoConfiguracion,
  crearRedSocialConfiguracion,
  crearTarifaManoObraConfiguracion,
  REDES_SOCIALES_DISPONIBLES,
  type Configuracion,
  type DatosConfiguracion,
  type LogoConfiguracion,
  type MetodoPagoConfiguracion,
  type RedSocialConfiguracion,
  type TarifaManoObraConfiguracion,
} from '@/dominio/configuracion';

const TAMANO_MAXIMO_LOGO_BYTES = 1024 * 1024;
const TIPOS_LOGO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

const props = defineProps<{
  configuracion: Configuracion;
  guardando: boolean;
}>();

const emitir = defineEmits<{
  guardar: [datos: DatosConfiguracion];
}>();

const entradaLogo = ref<HTMLInputElement>();
const nombreEmpresa = ref('');
const nombreResponsable = ref('');
const telefono = ref('');
const correo = ref('');
const direccion = ref('');
const rut = ref('');
const logo = ref<LogoConfiguracion | null>(null);
const tarifasManoObra = ref<TarifaManoObraConfiguracion[]>([]);
const precioTrasladoKilometro = ref<number | null>(null);
const mensajeFinal = ref('');
const metodosPago = ref<MetodoPagoConfiguracion[]>([]);
const redesSociales = ref<RedSocialConfiguracion[]>([]);
const errorLogo = ref('');
const logoVistaPrevia = computed(() => logo.value?.datosUrl || LOGO_PREDETERMINADO);
const textoAlternativoLogo = computed(() =>
  logo.value ? `Logo ${logo.value.nombre}` : `Logo de ${NOMBRE_APLICACION}`,
);

watch(
  () => props.configuracion,
  (configuracion) => {
    const metodosGuardados = Array.isArray(configuracion.metodosPago)
      ? configuracion.metodosPago
      : [];
    const redesGuardadas = Array.isArray(configuracion.redesSociales)
      ? configuracion.redesSociales
      : [];
    const tarifasGuardadas = Array.isArray(configuracion.tarifasManoObra)
      ? configuracion.tarifasManoObra
      : [];

    nombreEmpresa.value = configuracion.nombreEmpresa;
    nombreResponsable.value = configuracion.nombreResponsable;
    telefono.value = configuracion.telefono;
    correo.value = configuracion.correo;
    direccion.value = configuracion.direccion;
    rut.value = configuracion.rut;
    logo.value = configuracion.logo ? { ...configuracion.logo } : null;
    tarifasManoObra.value = tarifasGuardadas.length
      ? tarifasGuardadas.map((tarifa) => ({ ...tarifa }))
      : [crearTarifaManoObraConfiguracion()];
    precioTrasladoKilometro.value = configuracion.precioTrasladoKilometro;
    mensajeFinal.value = configuracion.mensajeFinal;
    metodosPago.value = metodosGuardados.length
      ? metodosGuardados.map((metodo) => ({ ...metodo }))
      : [crearMetodoPagoConfiguracion()];
    redesSociales.value = redesGuardadas.length
      ? redesGuardadas.map((redSocial) => ({ ...redSocial }))
      : [crearRedSocialConfiguracion()];
    errorLogo.value = '';
  },
  { immediate: true },
);

function abrirSelectorLogo(): void {
  entradaLogo.value?.click();
}

function procesarLogo(evento: Event): void {
  const elemento = evento.target;

  if (!(elemento instanceof HTMLInputElement)) {
    return;
  }

  const archivo = elemento.files?.[0];
  elemento.value = '';
  errorLogo.value = '';

  if (!archivo) {
    return;
  }

  if (!TIPOS_LOGO_PERMITIDOS.includes(archivo.type)) {
    errorLogo.value = 'Elegí una imagen JPG, PNG o WebP.';
    return;
  }

  if (archivo.size > TAMANO_MAXIMO_LOGO_BYTES) {
    errorLogo.value = 'El logo debe pesar menos de 1 MB.';
    return;
  }

  const lector = new FileReader();
  lector.onload = () => {
    if (typeof lector.result !== 'string') {
      errorLogo.value = 'No se pudo leer la imagen seleccionada.';
      return;
    }

    logo.value = {
      nombre: archivo.name,
      tipoMime: archivo.type,
      datosUrl: lector.result,
    };
  };
  lector.onerror = () => {
    errorLogo.value = 'No se pudo leer la imagen seleccionada.';
  };
  lector.readAsDataURL(archivo);
}

function quitarLogo(): void {
  logo.value = null;
  errorLogo.value = '';
}

function agregarTarifaManoObra(): void {
  tarifasManoObra.value.push(crearTarifaManoObraConfiguracion(''));
}

function quitarTarifaManoObra(idTarifa: string): void {
  if (tarifasManoObra.value.length === 1) {
    return;
  }

  tarifasManoObra.value = tarifasManoObra.value.filter((tarifa) => tarifa.id !== idTarifa);
}

function agregarMetodoPago(): void {
  metodosPago.value.push(crearMetodoPagoConfiguracion());
}

function quitarMetodoPago(idMetodo: string): void {
  if (metodosPago.value.length === 1) {
    return;
  }

  metodosPago.value = metodosPago.value.filter((metodo) => metodo.id !== idMetodo);
}

function agregarRedSocial(): void {
  redesSociales.value.push(crearRedSocialConfiguracion());
}

function quitarRedSocial(idRedSocial: string): void {
  if (redesSociales.value.length === 1) {
    return;
  }

  redesSociales.value = redesSociales.value.filter((redSocial) => redSocial.id !== idRedSocial);
}

function validarCorreo(valor: unknown): true | string {
  if (valor === null || valor === '') {
    return true;
  }

  if (typeof valor !== 'string') {
    return 'Ingresá un correo válido.';
  }

  const correoIngresado = valor.trim();

  if (correoIngresado === '') {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoIngresado) || 'Ingresá un correo válido.';
}

function validarPrecio(valor: unknown): true | string {
  if (valor === null || valor === '') {
    return true;
  }

  return (Number.isFinite(Number(valor)) && Number(valor) >= 0) || 'Ingresá un precio válido.';
}

function validarPrecioObligatorio(valor: unknown): true | string {
  if (valor === null || valor === '') {
    return 'Ingresá el precio por hora.';
  }

  return validarPrecio(valor);
}

function guardarConfiguracion(): void {
  emitir('guardar', {
    nombreEmpresa: nombreEmpresa.value,
    nombreResponsable: nombreResponsable.value,
    telefono: telefono.value,
    correo: correo.value,
    direccion: direccion.value,
    rut: rut.value,
    logo: logo.value ? { ...logo.value } : null,
    tarifasManoObra: tarifasManoObra.value.map((tarifa) => ({ ...tarifa })),
    precioTrasladoKilometro: precioTrasladoKilometro.value,
    mensajeFinal: mensajeFinal.value,
    metodosPago: metodosPago.value.map((metodo) => ({ ...metodo })),
    redesSociales: redesSociales.value.map((redSocial) => ({ ...redSocial })),
  });
}
</script>

<template>
  <q-form class="formulario-configuracion" greedy @submit="guardarConfiguracion">
    <div class="formulario-configuracion__contenedor">
      <section class="seccion-formulario" aria-labelledby="titulo-empresa-configuracion">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Identidad y contacto</p>
            <h2 id="titulo-empresa-configuracion" class="titulo-seccion">Empresa y responsable</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Guardá la información profesional y de contacto de tu empresa.
            </p>
          </div>
        </div>

        <div class="grilla-configuracion">
          <q-input
            v-model="nombreEmpresa"
            dark
            outlined
            label="Nombre de la empresa"
            :rules="[
              (valor) => Boolean(String(valor).trim()) || 'Ingresá el nombre de la empresa.',
            ]"
          />
          <q-input
            v-model="nombreResponsable"
            dark
            outlined
            label="Nombre del responsable"
            :rules="[
              (valor) => Boolean(String(valor).trim()) || 'Ingresá el nombre del responsable.',
            ]"
          />
          <q-input v-model="telefono" dark outlined type="tel" label="Teléfono" />
          <q-input
            v-model="correo"
            dark
            outlined
            type="email"
            label="Correo electrónico"
            :rules="[validarCorreo]"
          />
          <q-input v-model="direccion" dark outlined label="Dirección" />
          <q-input v-model="rut" dark outlined label="RUT" />
        </div>

        <div class="selector-logo-configuracion">
          <div class="selector-logo-configuracion__vista">
            <img :src="logoVistaPrevia" :alt="textoAlternativoLogo" />
          </div>
          <div class="selector-logo-configuracion__acciones">
            <div>
              <strong>Logo de la empresa</strong>
              <p class="texto-secundario">Imagen JPG, PNG o WebP de hasta 1 MB.</p>
              <span class="selector-logo-configuracion__nombre">
                {{ logo ? logo.nombre : 'Usando el logo predeterminado de la aplicación' }}
              </span>
              <span v-if="errorLogo" class="selector-logo-configuracion__error" role="alert">
                {{ errorLogo }}
              </span>
            </div>
            <div class="selector-logo-configuracion__botones">
              <q-btn
                class="boton-secundario"
                flat
                no-caps
                icon="upload"
                :label="logo ? 'Reemplazar logo' : 'Elegir logo'"
                @click="abrirSelectorLogo"
              />
              <q-btn
                v-if="logo"
                class="boton-icono-secundario"
                flat
                round
                icon="delete_outline"
                aria-label="Quitar logo"
                @click="quitarLogo"
              />
            </div>
          </div>
          <input
            ref="entradaLogo"
            class="selector-logo-configuracion__entrada"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="procesarLogo"
          />
        </div>
      </section>

      <section class="seccion-formulario" aria-labelledby="titulo-mano-obra-configuracion">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Valores habituales</p>
            <h2 id="titulo-mano-obra-configuracion" class="titulo-seccion">Mano de obra</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Definí un nombre y un precio por hora para cada tipo de trabajo.
            </p>
          </div>
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="add"
            label="Agregar mano de obra"
            @click="agregarTarifaManoObra"
          />
        </div>

        <div class="lista-campos-repetibles">
          <article
            v-for="(tarifa, indice) in tarifasManoObra"
            :key="tarifa.id"
            class="bloque-repetible"
          >
            <div class="bloque-repetible__campos campos-tarifa-mano-obra">
              <q-input
                v-model="tarifa.nombre"
                dark
                outlined
                label="Nombre de la mano de obra"
                :rules="[(valor) => Boolean(String(valor).trim()) || 'Ingresá un nombre.']"
              />
              <q-input
                v-model.number="tarifa.precioHora"
                dark
                outlined
                type="number"
                min="0"
                step="0.01"
                label="Precio"
                suffix="por hora"
                :rules="[validarPrecioObligatorio]"
              />
            </div>
            <q-btn
              v-if="tarifasManoObra.length > 1"
              class="boton-icono-secundario"
              flat
              round
              dense
              icon="delete_outline"
              :aria-label="`Quitar mano de obra ${indice + 1}`"
              @click="quitarTarifaManoObra(tarifa.id)"
            />
          </article>
        </div>
      </section>

      <section class="seccion-formulario" aria-labelledby="titulo-traslado-configuracion">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Valores habituales</p>
            <h2 id="titulo-traslado-configuracion" class="titulo-seccion">Traslado</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Guardá un único precio de referencia por kilómetro.
            </p>
          </div>
        </div>

        <div class="grilla-configuracion grilla-configuracion--un-campo">
          <q-input
            v-model.number="precioTrasladoKilometro"
            dark
            outlined
            type="number"
            min="0"
            step="0.01"
            label="Precio de traslado"
            suffix="por kilómetro"
            :rules="[validarPrecio]"
          />
        </div>
      </section>

      <section class="seccion-formulario" aria-labelledby="titulo-pagos-configuracion">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Cobros</p>
            <h2 id="titulo-pagos-configuracion" class="titulo-seccion">Métodos de pago</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Agregá los bancos o medios de pago que estén disponibles.
            </p>
          </div>
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="add"
            label="Agregar método"
            @click="agregarMetodoPago"
          />
        </div>

        <div class="lista-campos-repetibles">
          <article
            v-for="(metodo, indice) in metodosPago"
            :key="metodo.id"
            class="bloque-repetible"
          >
            <div class="bloque-repetible__campos campos-metodo-pago">
              <q-input v-model="metodo.nombre" dark outlined label="Nombre del banco o método" />
              <q-input v-model="metodo.numeroCuenta" dark outlined label="Número de cuenta" />
            </div>
            <q-btn
              v-if="metodosPago.length > 1"
              class="boton-icono-secundario"
              flat
              round
              dense
              icon="delete_outline"
              :aria-label="`Quitar método de pago ${indice + 1}`"
              @click="quitarMetodoPago(metodo.id)"
            />
          </article>
        </div>
      </section>

      <section class="seccion-formulario" aria-labelledby="titulo-redes-configuracion">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Presencia digital</p>
            <h2 id="titulo-redes-configuracion" class="titulo-seccion">Redes sociales</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Guardá los perfiles o enlaces públicos de la empresa.
            </p>
          </div>
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="add"
            label="Agregar red"
            @click="agregarRedSocial"
          />
        </div>

        <div class="lista-campos-repetibles">
          <article
            v-for="(redSocial, indice) in redesSociales"
            :key="redSocial.id"
            class="bloque-repetible"
          >
            <div class="bloque-repetible__campos campos-red-social">
              <q-select
                v-model="redSocial.red"
                dark
                outlined
                use-input
                new-value-mode="add-unique"
                label="Red social"
                :options="[...REDES_SOCIALES_DISPONIBLES]"
              />
              <q-input
                v-model="redSocial.usuarioOEnlace"
                dark
                outlined
                :label="`${redSocial.red || 'Red social'}: usuario o enlace`"
              />
            </div>
            <q-btn
              v-if="redesSociales.length > 1"
              class="boton-icono-secundario"
              flat
              round
              dense
              icon="delete_outline"
              :aria-label="`Quitar red social ${indice + 1}`"
              @click="quitarRedSocial(redSocial.id)"
            />
          </article>
        </div>
      </section>

      <section class="seccion-formulario" aria-labelledby="titulo-mensaje-configuracion">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Comunicación</p>
            <h2 id="titulo-mensaje-configuracion" class="titulo-seccion">Mensaje</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Definí el texto general que se podrá reutilizar más adelante.
            </p>
          </div>
        </div>

        <q-input
          v-model="mensajeFinal"
          class="campo-notas-generales"
          dark
          outlined
          type="textarea"
          autogrow
          label="Mensaje final predeterminado"
        />
      </section>

      <div class="acciones-formulario">
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          type="submit"
          icon="save"
          label="Guardar configuración"
          :loading="guardando"
          :disable="guardando"
        />
      </div>
    </div>
  </q-form>
</template>
