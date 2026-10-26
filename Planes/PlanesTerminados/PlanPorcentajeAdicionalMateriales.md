# PLAN DEL PORCENTAJE ADICIONAL SOBRE MATERIALES

## Descripción del plan

Agregar un porcentaje general editable en Configuración y copiarlo a cada presupuesto nuevo. Pablo podrá cambiar la copia dentro del ticket sin alterar Configuración ni otros presupuestos. El porcentaje se aplicará únicamente al precio real de los materiales para calcular los importes destinados al cliente. El precio real del catálogo y el de cada línea del ticket conservarán su valor original.

## Objetivo principal

- Guardar un único porcentaje predeterminado en Configuración, dentro de «Valores habituales», inmediatamente debajo de Traslado.
- Mostrar y editar el porcentaje propio del ticket inmediatamente arriba del selector «Moneda del presupuesto».
- Mantener independientes el porcentaje general y el porcentaje guardado en cada presupuesto.
- Mostrar importes de materiales con el adicional incluido en el documento, PDF, mensaje de WhatsApp, resumen y lista de presupuestos, sin exponer el porcentaje al cliente.
- Mantener el campo de porcentaje únicamente en Configuración y en el ticket interno; la vista previa para el cliente, impresión, PDF y mensaje de WhatsApp deben mostrar solo los precios e importes finales.

## Contexto técnico verificado

- El proyecto usa Quasar, Vue 3, TypeScript estricto, Pinia y una interfaz responsive para SPA y Android. `AGENTS.md` exige nombres en español y valores visuales reutilizables en `src/css/Variables.css`.
- `FormularioConfiguracion.vue` ya tiene bloques separados de «Mano de obra» y «Traslado» bajo la etiqueta «Valores habituales». `DatosConfiguracion` conserva un único valor de traslado.
- `NuevoPresupuestoPage.vue` copia la configuración al iniciar un presupuesto nuevo, recupera presupuestos guardados y borradores de vista previa, y usa `ResumenPresupuesto.vue` para moneda y totales.
- `LineaPresupuesto.precioUnitario` es el precio real editable, copiado del catálogo o ingresado manualmente. `calcularSubtotalLinea` lo usa en el ticket. Los totales actuales se calculan sin porcentaje.
- `DocumentoPresupuesto.vue` alimenta vista previa, impresión y PDF. `whatsapp.ts` produce un resumen textual, y `PresupuestosPage.vue` calcula los totales de la lista.
- La persistencia de Configuración y Presupuestos ya admite datos históricos mediante funciones de recuperación. Una configuración anterior sin el campo nuevo debe conservar todos sus datos y recibir 0 %. Un presupuesto anterior debe conservar sus precios y recibir 0 %.
- `formatearImporte` muestra dos decimales. No hay infraestructura actual de pruebas unitarias; existen `npm run lint:check`, `npm run typecheck`, `npm run build` y `npm run build:android`.
- `NuevoPresupuestoPage.vue` no usa `q-form`: sus acciones de guardar, vista previa, descarga y envío deben bloquear explícitamente un porcentaje vacío o inválido. Su `datosDocumento` calculado alimenta un documento oculto, por lo que tampoco debe construir datos inválidos durante la escritura del campo.
- `RepositorioConfiguracionLocal.obtener()` intenta recuperar configuraciones modernas antes de la migración antigua. Si una moderna sin el campo nuevo llega a `migrarConfiguracionAnterior()`, perdería la lista actual de tarifas; la migración nueva tiene que ejecutarse antes.

## Alcance

### Incluye

- Un porcentaje general y un porcentaje independiente por presupuesto.
- Materiales del catálogo y materiales manuales, incluidos precios por presentación o unidad seleccionada.
- Cálculo coherente de precio unitario visible, subtotal de cada material, total de materiales y total general.
- Compatibilidad de Configuración y presupuestos creados antes de incorporar el campo.

### No incluye

- Listas de porcentajes, porcentajes distintos por material, ni modificación del precio del catálogo.
- Aplicar el adicional a mano de obra o traslado.
- Mostrar al cliente el porcentaje, el costo real o el importe agregado como conceptos separados.

## Mapa de cambios

| Archivo                                                           | Acción    | Símbolos principales                                                                                                                                                                                                                                                                                                                       | Propósito                                                       |
| ----------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `src/dominio/porcentajeAdicionalMateriales.ts`                    | Crear     | `esPorcentajeAdicionalMateriales`, `convertirEntradaPorcentajeAdicionalMateriales`, `exigirPorcentajeAdicionalMateriales`                                                                                                                                                                                                                  | Regla numérica compartida por Configuración y ticket.           |
| `src/dominio/configuracion.ts`                                    | Modificar | campo `porcentajeAdicionalMateriales`; tipos `ConfiguracionSinPorcentajeAdicionalMateriales`, `ConfiguracionModernaRecuperable`; guard `esConfiguracionGuardadaSinPorcentajeAdicionalMateriales`; migración `migrarConfiguracionSinPorcentajeAdicionalMateriales`; funciones existentes de creación, normalización, validación y migración | Guardar el porcentaje y preservar configuraciones anteriores.   |
| `src/repositorios/configuracion/RepositorioConfiguracionLocal.ts` | Modificar | `obtener`; local `configuracionSinPorcentajeMigrada`                                                                                                                                                                                                                                                                                       | Ejecutar la migración nueva antes de la antigua.                |
| `src/components/configuracion/FormularioConfiguracion.vue`        | Modificar | `porcentajeAdicionalMaterialesEntrada`, `validarPorcentajeAdicionalMaterialesEntrada`, `guardarConfiguracion`; bloque `titulo-porcentaje-materiales-configuracion`                                                                                                                                                                         | Editar un solo porcentaje debajo de Traslado.                   |
| `src/dominio/presupuestos.ts`                                     | Modificar | campo `porcentajeAdicionalMateriales`; `redondearImporteCliente`, `calcularPrecioMaterialCliente`, `calcularSubtotalMaterialCliente`; normalización, recuperación, validación y totales existentes                                                                                                                                         | Guardar la copia por presupuesto y calcular precios al cliente. |
| `src/pages/NuevoPresupuestoPage.vue`                              | Modificar | `porcentajeAdicionalMaterialesEntrada`, `porcentajeAdicionalMaterialesValido`, `validarPorcentajeFormulario`, `datosDocumento`; funciones existentes de creación, carga, serialización, guardado y salida                                                                                                                                  | Copiar, editar, recuperar y validar el porcentaje del ticket.   |
| `src/components/presupuestos/ResumenPresupuesto.vue`              | Modificar | modelo `porcentajeAdicionalMaterialesEntrada`, cálculo `porcentajeAdicionalMateriales`, `validarPorcentajeAdicionalMaterialesEntrada`; totales existentes                                                                                                                                                                                  | Ubicar el campo arriba de Moneda y actualizar totales.          |
| `src/components/presupuestos/DocumentoPresupuesto.vue`            | Modificar | celdas de precio y subtotal de material, `totalMateriales`, `total`                                                                                                                                                                                                                                                                        | Mostrar exclusivamente importes finales al cliente.             |
| `src/pages/PresupuestosPage.vue`                                  | Modificar | dos llamadas a `calcularTotalPresupuesto`                                                                                                                                                                                                                                                                                                  | Mostrar el mismo total final que el documento.                  |
| `src/dominio/whatsapp.ts`                                         | Modificar | campo `porcentajeAdicionalMateriales`, `crearMensajePresupuestoWhatsapp`                                                                                                                                                                                                                                                                   | Usar el total final en el mensaje.                              |
| `src/servicios/documentos/accionesPresupuesto.ts`                 | Modificar | `enviarDocumentoPresupuesto`                                                                                                                                                                                                                                                                                                               | Pasar al mensaje el porcentaje del presupuesto.                 |
| `src/css/app.css`                                                 | Modificar | `.resumen-presupuesto__grupo-controles`, `.resumen-presupuesto__campo-porcentaje`                                                                                                                                                                                                                                                          | Poner el campo en una fila propia sobre la moneda.              |

No se crearán otros archivos. `src/css/Variables.css`, `src/stores/configuracion.ts`, `src/stores/presupuestos.ts`, `src/pages/VistaPreviaPresupuestoPage.vue` y `src/components/presupuestos/FilaPresupuesto.vue` mantienen sus contratos: los datos nuevos viajan por los tipos existentes, y la fila interna sigue mostrando el costo real.

## Contratos y decisiones cerradas

- El campo persistido en Configuración y Presupuestos se llama exactamente `porcentajeAdicionalMateriales: number`. Su valor inicial e histórico es `0`; se admiten valores decimales finitos desde `0` inclusive, también superiores a `100`. No se guardan `null`, texto, vacío, negativos ni infinitos.
- El archivo nuevo `src/dominio/porcentajeAdicionalMateriales.ts` exportará `esPorcentajeAdicionalMateriales(valor: unknown): valor is number`, `convertirEntradaPorcentajeAdicionalMateriales(entrada: unknown): number | null` y `exigirPorcentajeAdicionalMateriales(valor: unknown): number`. La conversión acepta cadena o número, devuelve `null` para `null`, `undefined`, cadena vacía después de `trim()` y cualquier valor inválido; la función `exigir` lanza `RangeError('Ingresá un porcentaje adicional sobre materiales válido.')` si falla. No depende de Vue ni Quasar.
- Ambos `q-input` se enlazarán a `porcentajeAdicionalMaterialesEntrada` mediante `v-model` **sin** `.number`. Su estado será `string | number | null`, porque Quasar puede entregar número, cadena o `null`; la conversión compartida tratará el vacío como inválido. El valor se convierte a número únicamente al crear `DatosConfiguracion` o `DatosPresupuesto`. En Configuración y en ticket se mostrará `0` en nuevas instalaciones o presupuestos históricos.
- Al cambiar el porcentaje general, solo los presupuestos creados después reciben el nuevo valor. Abrir, editar, consultar o volver desde la vista previa de uno existente siempre recupera el porcentaje guardado en ese presupuesto.
- En el ticket, `FilaPresupuesto.vue` conservará `linea.precioUnitario` y `calcularSubtotalLinea()` como costo real. `ResumenPresupuesto.vue` mostrará materiales y total final con el adicional. El documento visible para el cliente, PDF y WhatsApp mostrarán únicamente precios finales, sin porcentaje ni recargo separado.
- Confirmación de Leo: el porcentaje se aplica a **todas las líneas de material** del ticket y a ninguna línea de mano de obra o traslado. Si hay materiales por `100`, mano de obra por `200`, traslado por `30` y porcentaje de `10 %`, el cliente debe ver materiales por `110`, mano de obra y traslado por `230` y total por `340`; el porcentaje no figura en su documento ni en el mensaje.
- El campo porcentual se renderiza solo en `FormularioConfiguracion.vue` y `ResumenPresupuesto.vue`. `DocumentoPresupuesto.vue` no debe renderizar ni la etiqueta «Porcentaje adicional sobre materiales», ni el número del porcentaje, ni una fila de recargo. `VistaPreviaPresupuestoPage.vue`, la impresión y el PDF reutilizan ese documento; `crearMensajePresupuestoWhatsapp()` debe omitir el porcentaje del texto. El dato numérico viaja internamente en `DatosPresupuesto` solo para calcular los importes.
- Con porcentaje `0`, las nuevas funciones de cálculo devolverán exactamente los importes actuales sin redondeo adicional. Con porcentaje positivo, redondearán el **precio unitario final a dos decimales**, multiplicarán por la cantidad y redondearán el **subtotal de esa línea a dos decimales**. Total de materiales = suma de los subtotales finales compatibles; total general = esos subtotales más los subtotales actuales de mano de obra y traslado compatibles. Así, el precio unitario, su subtotal y el total del documento coinciden visualmente. La moneda incompatible conserva la exclusión actual de totales. Para el redondeo, declarar `const FACTOR_REDONDEO_IMPORTES = 100` y calcular `Math.round((importe + Number.EPSILON) * FACTOR_REDONDEO_IMPORTES) / FACTOR_REDONDEO_IMPORTES`.

## FASE 1: Guardar el porcentaje general

### Objetivo

Permitir configurar un único porcentaje no negativo y conservar configuraciones históricas.

### Pasos de ejecución

- [x] Crear `src/dominio/porcentajeAdicionalMateriales.ts` con las tres funciones y firmas del apartado «Contratos y decisiones cerradas». `esPorcentajeAdicionalMateriales` debe usar `typeof valor === 'number'`, `Number.isFinite(valor)` y `valor >= 0`. `convertirEntradaPorcentajeAdicionalMateriales` debe devolver el número recibido si pasa el guard; si recibe una cadena, debe rechazar `trim() === ''` antes de llamar a `Number(entrada)` y validar el resultado con el mismo guard; para otros tipos debe devolver `null`. `exigirPorcentajeAdicionalMateriales` debe reutilizar el guard.
- [x] En `src/dominio/configuracion.ts`, añadir `porcentajeAdicionalMateriales: number` a `DatosConfiguracion`, `0` en `crearConfiguracionInicial()` y `exigirPorcentajeAdicionalMateriales(datos.porcentajeAdicionalMateriales)` en `normalizarDatosConfiguracion()`. `esConfiguracionGuardada()` debe exigir un porcentaje válido además de la estructura común y la moneda.
- [x] En `src/dominio/configuracion.ts`, definir `type ConfiguracionSinPorcentajeAdicionalMateriales = Omit<Configuracion, 'porcentajeAdicionalMateriales'> & { porcentajeAdicionalMateriales?: unknown }` y el guard privado `esConfiguracionGuardadaSinPorcentajeAdicionalMateriales(valor: unknown): valor is ConfiguracionSinPorcentajeAdicionalMateriales`: debe exigir `esEstructuraConfiguracionComun(valor)`, moneda válida y porcentaje ausente o inválido. Crear `migrarConfiguracionSinPorcentajeAdicionalMateriales(valor: unknown): Configuracion | null`: si pasa ese guard, devolver una copia de todos sus campos con `porcentajeAdicionalMateriales: 0`; si no, devolver `null`. Sustituir los alias actuales `ConfiguracionSinMonedaPrincipal` y `ConfiguracionModernaRecuperable` por `type ConfiguracionModernaRecuperable = Omit<Configuracion, 'monedaPrincipal' | 'porcentajeAdicionalMateriales'> & { monedaPrincipal?: unknown; porcentajeAdicionalMateriales?: unknown }`; `esConfiguracionGuardadaSinMonedaPrincipal()` conservará su nombre y devolverá ese tipo. `migrarConfiguracionSinMonedaPrincipal()` debe completar `monedaPrincipal: MONEDA_INICIAL` y conservar un porcentaje válido si existe, o asignar `0` si falta. `migrarConfiguracionAnterior()` ya extiende `crearConfiguracionInicial()` y, por eso, debe conservar el `0` nuevo.
- [x] En `RepositorioConfiguracionLocal.obtener()`, probar en este orden `esConfiguracionGuardada()`, `migrarConfiguracionSinPorcentajeAdicionalMateriales()`, `migrarConfiguracionSinMonedaPrincipal()` y finalmente `migrarConfiguracionAnterior()`. Usar la nueva variable `configuracionSinPorcentajeMigrada` para el segundo resultado; conservar las actuales `configuracionModernaMigrada` y `configuracionAnteriorMigrada` para los siguientes resultados, calculándolos solo si el anterior fue `null`. Marcar la migración y persistir la copia con la clave actual, igual que el flujo existente. Una configuración moderna sin porcentaje no debe pasar por la migración antigua ni perder sus tarifas.
- [x] En `FormularioConfiguracion.vue`, declarar `const porcentajeAdicionalMaterialesEntrada = ref<string | number | null>('0')`; en el `watch` de `props.configuracion`, asignarle `String(configuracion.porcentajeAdicionalMateriales)`. Crear `validarPorcentajeAdicionalMaterialesEntrada(valor: unknown): true | string`, basada en `convertirEntradaPorcentajeAdicionalMateriales(valor)`, con mensaje «Ingresá un porcentaje válido.»; en `guardarConfiguracion()` convertir la entrada y retornar sin emitir si es `null`. Añadir `porcentajeAdicionalMateriales` numérico al objeto `DatosConfiguracion` emitido.
- [x] Insertar una `section.seccion-formulario` con `aria-labelledby="titulo-porcentaje-materiales-configuracion"`, etiqueta «Valores habituales» y título «Porcentaje adicional sobre materiales» inmediatamente después de Traslado y antes de Moneda principal. Dentro de `grilla-configuracion grilla-configuracion--un-campo`, usar `q-input` con `v-model="porcentajeAdicionalMaterialesEntrada"`, `type="number"`, `min="0"`, `step="0.01"`, `suffix="%"`, `:rules="[validarPorcentajeAdicionalMaterialesEntrada]"` y texto de ayuda «Se usará en los presupuestos nuevos; podés cambiarlo en cada ticket.».

## FASE 2: Guardar una copia independiente en cada presupuesto

### Objetivo

Copiar el valor general al crear un ticket y mantener el valor propio de cada presupuesto en edición, detalle y vista previa.

### Pasos de ejecución

- [x] En `src/dominio/presupuestos.ts`, agregar `porcentajeAdicionalMateriales: number` a `DatosPresupuesto`, persistido en `Presupuesto` por herencia. `normalizarDatosPresupuesto()` debe llamar a `exigirPorcentajeAdicionalMateriales(datos.porcentajeAdicionalMateriales)`; `crearPresupuesto()` y `actualizarPresupuesto()` ya pasan por esta función. `recuperarPresupuestoGuardado()` debe usar `0` solo cuando la propiedad esté `undefined`; si está presente e inválida, devolver `null` para respetar el error de lectura existente, sin descartar silenciosamente el dato. `esPresupuestoGuardado()` debe exigir `esPorcentajeAdicionalMateriales(valor.porcentajeAdicionalMateriales)`.
- [x] En `NuevoPresupuestoPage.vue`, declarar `const porcentajeAdicionalMaterialesEntrada = ref<string | number | null>('0')` y `const porcentajeAdicionalMaterialesValido = computed(() => convertirEntradaPorcentajeAdicionalMateriales(porcentajeAdicionalMaterialesEntrada.value) !== null)`. `restablecerFormularioNuevo()` copiará `String(configuracionStore.configuracion.porcentajeAdicionalMateriales)` una sola vez; `cargarDatosFormulario()` usará `String(datos.porcentajeAdicionalMateriales)` para presupuesto guardado o borrador, sin consultar Configuración.
- [x] En `NuevoPresupuestoPage.vue`, `obtenerDatosFormulario()` usará la variable local `porcentajeAdicionalMateriales = convertirEntradaPorcentajeAdicionalMateriales(porcentajeAdicionalMaterialesEntrada.value)` y llamará a `exigirPorcentajeAdicionalMateriales(porcentajeAdicionalMateriales)` antes de añadir el número a `DatosPresupuesto`. `serializarDatosFormulario()` serializará directamente `porcentajeAdicionalMaterialesEntrada.value` junto con destinatario, fecha, moneda y líneas; no llamará a `obtenerDatosFormulario()` mientras se escribe, para que un vacío también cuente como cambio sin guardar.
- [x] En `NuevoPresupuestoPage.vue`, crear `validarPorcentajeFormulario(): boolean`: si la entrada es inválida, asignar a `errorAccion.value` «Ingresá un porcentaje adicional sobre materiales válido.» y retornar `false`; si es válida, limpiar ese error anterior y retornar `true`. Llamarla al inicio de `abrirVistaPrevia()`, `guardarNuevoYFinalizar()`, `guardarCambios()` y `ejecutarAccionDocumento()`, antes de `obtenerDatosFormulario()` y, en la salida, antes de comprobar la existencia del documento oculto; conservar las verificaciones actuales de autenticación y guardado. Cambiar `datosDocumento` a `computed<DatosPresupuesto | null>` que devuelva `null` con entrada inválida; renderizar el `DocumentoPresupuesto` oculto solo cuando `datosDocumento` no sea `null`. Así el usuario ve el error y no se crea ni se envía un documento con un porcentaje incompleto.
- [x] En `ResumenPresupuesto.vue`, declarar `const porcentajeAdicionalMaterialesEntrada = defineModel<string | number | null>('porcentajeAdicionalMaterialesEntrada', { required: true })`; enlazarlo desde `NuevoPresupuestoPage.vue` con `v-model:porcentaje-adicional-materiales-entrada`. Crear `validarPorcentajeAdicionalMaterialesEntrada(valor: unknown): true | string` con la misma regla y mensaje del formulario de Configuración. Insertar un `q-input` con `v-model="porcentajeAdicionalMaterialesEntrada"`, `type="number"`, `min="0"`, `step="0.01"`, `suffix="%"`, `:rules="[validarPorcentajeAdicionalMaterialesEntrada]"`, `:readonly="soloLectura"`, etiqueta «Porcentaje adicional sobre materiales» y ayuda «Se aplica solo a los materiales de este presupuesto.»; la ayuda aclara por qué los subtotales de costo interno difieren del resumen final. Ubicarlo **antes** del bloque `.resumen-presupuesto__controles`, dentro del nuevo `.resumen-presupuesto__grupo-controles`, para que quede arriba del selector de moneda en todas las anchuras.
- [x] En `ResumenPresupuesto.vue`, declarar `const porcentajeAdicionalMateriales = computed(() => convertirEntradaPorcentajeAdicionalMateriales(porcentajeAdicionalMaterialesEntrada.value) ?? 0)` y usarlo en los totales. Mientras la entrada esté inválida, el campo mostrará el error y los totales temporales usarán 0; las acciones de persistencia y salida seguirán bloqueadas por `validarPorcentajeFormulario()`. No agregar porcentaje a `LineaPresupuesto` ni modificar `linea.precioUnitario`.

## FASE 3: Calcular los importes destinados al cliente

### Objetivo

Aplicar el porcentaje una sola vez sobre cada precio real de material y usar el mismo cálculo en todas las salidas.

### Pasos de ejecución

- [x] En `src/dominio/presupuestos.ts`, crear la constante privada `FACTOR_REDONDEO_IMPORTES = 100` y la función privada `redondearImporteCliente(importe: number): number` con la fórmula exacta del apartado «Contratos y decisiones cerradas». Exportar `calcularPrecioMaterialCliente(linea: LineaPresupuesto, porcentajeAdicionalMateriales: number): number` y `calcularSubtotalMaterialCliente(linea: LineaPresupuesto, porcentajeAdicionalMateriales: number): number`. Para una línea de material con porcentaje positivo: `precioCliente = redondearImporteCliente(normalizarNumeroNoNegativo(linea.precioUnitario) * (1 + porcentajeAdicionalMateriales / 100))`; `subtotalCliente = redondearImporteCliente(precioCliente * normalizarNumeroNoNegativo(linea.cantidad))`. Con porcentaje `0`, devolver `normalizarNumeroNoNegativo(linea.precioUnitario)` y `calcularSubtotalLinea(linea)` respectivamente, sin redondeo adicional. Las funciones solo se usarán para líneas `tipo === 'material'`; exigir un porcentaje válido al entrar para evitar importes `NaN` o negativos. No escribir resultados en la línea ni en el catálogo.
- [x] En `src/dominio/presupuestos.ts`, cambiar las firmas a `calcularTotalMateriales(lineas: readonly LineaPresupuesto[], monedaPresupuesto: Moneda, porcentajeAdicionalMateriales: number): number` y `calcularTotalPresupuesto(lineas: readonly LineaPresupuesto[], monedaPresupuesto: Moneda, porcentajeAdicionalMateriales: number): number`; **no** darles un valor predeterminado que pueda ocultar un consumidor sin actualizar. Filtrar líneas incompatibles con `lineaTieneMonedaCompatible()`. Para materiales, sumar `calcularSubtotalMaterialCliente()`; para mano de obra y traslado, sumar `calcularSubtotalLinea()` como ahora. Dejar `calcularTotalManoObraYTraslado()`, `calcularSubtotalLinea()` y `calcularTotalPorTiposConcepto()` para el costo interno y la mano de obra, sin porcentaje.
- [x] En `ResumenPresupuesto.vue`, pasar `porcentajeAdicionalMateriales.value` a `calcularTotalMateriales()` y `calcularTotalPresupuesto()`. En `DocumentoPresupuesto.vue`, reemplazar la celda de precio de material por `calcularPrecioMaterialCliente(linea, datos.porcentajeAdicionalMateriales)`, la celda de subtotal por `calcularSubtotalMaterialCliente(linea, datos.porcentajeAdicionalMateriales)` y pasar ese mismo porcentaje a `totalMateriales` y `total`. `DocumentoPresupuesto.vue` ya alimenta tanto el documento oculto del ticket como `VistaPreviaPresupuestoPage.vue`; no duplicar cálculos allí ni mostrar el porcentaje al cliente.
- [x] En `PresupuestosPage.vue`, actualizar **las dos** llamadas a `calcularTotalPresupuesto()` (fila de tabla y tarjeta móvil) con `presupuesto.porcentajeAdicionalMateriales` como tercer argumento. Así ambas vistas coincidirán con el documento guardado.
- [x] En `src/dominio/whatsapp.ts`, agregar `porcentajeAdicionalMateriales: number` a `DatosMensajePresupuestoWhatsapp` y pasarlo a `calcularTotalMateriales()` y `calcularTotalPresupuesto()`. En `src/servicios/documentos/accionesPresupuesto.ts`, añadir `porcentajeAdicionalMateriales: opciones.datos.porcentajeAdicionalMateriales` al objeto entregado a `crearMensajePresupuestoWhatsapp()`. El texto de WhatsApp no mostrará el porcentaje, solo importes finales.
- [x] Mantener el tratamiento actual de moneda incompatible: la línea puede figurar en el documento con su precio final en su propia moneda, pero no se suma a los totales de la moneda del presupuesto. No convertir automáticamente ninguna moneda.

## FASE 4: Ajustar la interfaz responsive

### Objetivo

Hacer visibles y cómodos los campos en Configuración y ticket sin alterar el estilo existente.

### Pasos de ejecución

- [x] En `src/css/app.css`, definir `.resumen-presupuesto__campo-porcentaje` para el nuevo `q-input`: `width: 100%` y `max-width: var(--ancho-selector-moneda-denso)`. Como `.resumen-presupuesto` es un `footer` flex con controles y totales a los lados, envolver el nuevo campo y `.resumen-presupuesto__controles` en un contenedor `.resumen-presupuesto__grupo-controles` con `display: grid`, `gap: var(--espaciado-mediano)` y `min-width: 0`. Mantener `.resumen-presupuesto__importes` como hermano de ese grupo para conservar la distribución actual en escritorio y las reglas móviles existentes.
- [x] En el `@media (max-width: 767px)` existente de `app.css`, dar `max-width: none` al campo porcentual para que ocupe el ancho disponible igual que `.selector-moneda-presupuesto`. Reutilizar `Variables.css`; no crear valores visuales literales nuevos. Confirmar que el orden de lectura y tabulación sea porcentaje, moneda, estado y totales.

## FASE TESTING

### Objetivo

Comprobar cálculo, persistencia, compatibilidad histórica y consistencia entre ticket y salidas.

### Validaciones técnicas

- [x] Ejecutar `npm run lint:check`, `npm run typecheck`, `npm run build` y `npm run build:android`; corregir los errores atribuibles a este cambio.
- [x] Revisar todos los consumidores de `calcularTotalMateriales()` y `calcularTotalPresupuesto()` para verificar que ninguno calcule importes sin el porcentaje propio del presupuesto.

### Pruebas funcionales

- [x] Guardar `5 %` en Configuración, cerrar y reabrir: el valor persiste. Crear un ticket: muestra `5 %` arriba de la moneda. Cambiarlo a `10 %`: un material de costo `100` muestra `110` para el cliente, sin sumar el `5 %` general.
- [x] Con materiales de `100`, mano de obra de `200`, traslado de `30` y porcentaje de `10 %`, verificar materiales `110`, mano de obra y traslado `230` y total `340` en ticket, lista, documento y WhatsApp; comprobar que solo la línea de material recibe el adicional.
- [ ] Guardar el ticket con `10 %`, crear otro: el nuevo toma `5 %`. Cambiar Configuración a `7 %`: el primer ticket sigue en `10 %`, el segundo en `5 %` y el siguiente nuevo toma `7 %`.
- [ ] Verificar materiales del catálogo, materiales manuales y cambio de precio o unidad seleccionada. Confirmar que el precio real en el catálogo y en el ticket permanece intacto, mientras los importes para el cliente se recalculan una sola vez.
- [ ] Comparar total de materiales y total general entre resumen, lista, vista previa, impresión, PDF y texto de WhatsApp. Confirmar que los importes finales incluyen el adicional y que ninguna superficie destinada al cliente muestra el campo, la etiqueta, el número del porcentaje, el costo real ni un recargo separado; mano de obra y traslado conservan sus importes.
- [x] Probar porcentaje `0`, porcentaje decimal, valor negativo y entrada inválida; comprobar que los importes visibles coinciden con el redondeo a dos decimales y que no se persisten valores inválidos.
- [x] Con un precio real de `0,05`, cantidad `3` y adicional de `10 %`, verificar precio unitario final `0,06`, subtotal final `0,18` y total de materiales `0,18`. Con `0 %`, comprobar que `calcularPrecioMaterialCliente()` y `calcularSubtotalMaterialCliente()` conservan exactamente el cálculo anterior sin redondeo extra.
- [ ] Borrar por completo el campo porcentual en Configuración y en el ticket. Comprobar mensaje de validación y que guardar, vista previa, descarga y envío desde el ticket no guarden ni emitan un presupuesto con porcentaje vacío. Repetir con un número negativo y una entrada no finita si el navegador permite introducirla.
- [ ] Cargar una Configuración anterior sin porcentaje y comprobar que conserva sus demás campos y recibe `0 %`. Cargar presupuestos anteriores sin porcentaje y comprobar que mantienen precios y totales previos con `0 %`, aunque el porcentaje general actual sea distinto.
- [x] Cargar una Configuración moderna con moneda y varias tarifas, pero sin porcentaje; confirmar que todas las tarifas y demás datos se preservan. Repetir con una Configuración moderna anterior sin moneda ni porcentaje y confirmar que ambos valores se completan sin reconstruir las tarifas.
- [x] Abrir un presupuesto en edición, ir a vista previa y regresar sin guardar; comprobar que el porcentaje editado se conserva y que la advertencia de cambios sin guardar lo contempla.
- [ ] Revisar Configuración y ticket en web de escritorio, ancho de tableta y teléfono Android real o emulado; comprobar ubicación exacta, lectura, foco, teclado numérico y ausencia de desbordes.

## Validación realizada

- `npm run lint:check`, `npm run typecheck`, `npm run build` y `npm run build:android`: correctos.
- Pruebas directas del dominio: validación de entradas, migraciones modernas, presupuesto histórico, cálculo `100 + 200 + 30` con `10 %` y redondeo de `0,05 × 3`.
- Prueba web local: Configuración persistió tras recargar; presupuesto nuevo copió el porcentaje; costo interno `100`, material para cliente `110`, mano de obra y traslado `230`, total `340` en ticket, lista y vista previa; un presupuesto guardado mantuvo `10 %` después de cambiar Configuración a `7 %`.
- Campo vacío: error visible y bloqueo de guardado y vista previa. Mensaje de WhatsApp verificado por función de dominio, sin porcentaje ni costo real.
- PDF generado con sesión local de prueba: una página, materiales `110`, mano de obra y traslado `230`, total `340`; inspección de texto y render sin porcentaje, recargo ni costo real.
- En edición, `10,5 %` dio materiales `110,50` y total `340,50`; `0 %` dio `100` y `330`; un valor negativo no se guardó. Vista previa y regreso conservaron el porcentaje editado; cancelar mostró la advertencia de cambios sin guardar.
- Sin desborde horizontal en Configuración y ticket a 360, 768 y 1280 px.

### Validaciones pendientes

Quedan sin comprobar en el dispositivo Android conectado el foco y teclado numérico, y no se ejecutaron impresión ni envío real por WhatsApp. Las demás casillas funcionales sin marcar requieren ejecutar sus escenarios completos en la interfaz. El APK de release generado es unsigned y el dispositivo ya tiene instalado el mismo paquete; no se reemplazó esa instalación.

## Progreso del plan

- [x] Fase 1: Guardar el porcentaje general
- [x] Fase 2: Guardar una copia independiente en cada presupuesto
- [x] Fase 3: Calcular los importes destinados al cliente
- [x] Fase 4: Ajustar la interfaz responsive
- [ ] Fase Testing

Fecha de creación: 20 de octubre de 2026
Fecha de última actualización: 20 de octubre de 2026
Estado: IMPLEMENTADO CON VALIDACIONES FUNCIONALES PENDIENTES
