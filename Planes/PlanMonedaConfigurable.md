# PLAN DE MONEDA PRINCIPAL CONFIGURABLE

## Descripción del plan

Generalizar el soporte de monedas para que la aplicación pueda utilizarse en distintos países sin perder información histórica. La moneda principal se elegirá en Configuración, comenzará en `UYU` en una primera instalación y quedará persistida. Los materiales y presupuestos nuevos ofrecerán la moneda principal y `USD`; si ambas coinciden, mostrarán una sola opción. La aplicación nunca consultará cotizaciones ni convertirá importes automáticamente.

Cuando una línea del ticket esté en una moneda diferente de la moneda general del presupuesto, seguirá excluida de todos los totales. El usuario deberá editar manualmente el importe y pulsar `Confirmar conversión a CÓDIGO`. La confirmación cambiará solamente la copia incluida en ese presupuesto y evitará que precios originales del catálogo vuelvan a aplicarse sobre una línea ya convertida.

## Objetivo principal

- Agregar una moneda principal persistente con `UYU` como valor inicial
- Centralizar catálogo, validación, búsqueda, opciones y formato de monedas en código reutilizable
- Reutilizar un único selector de moneda en Configuración, Materiales y Presupuestos
- Aplicar la moneda principal a materiales, mano de obra, traslado y presupuestos nuevos
- Mantener `USD` como alternativa fija sin duplicarla cuando sea la moneda principal
- Preservar exactamente las monedas e importes de materiales y presupuestos existentes
- Permitir confirmar conversiones manuales sin modificar el catálogo ni calcular cotizaciones
- Mantener una interfaz accesible y responsive en SPA y Android

## Reglas del plan

- Usar Vue 3, TypeScript estricto, Composition API con `<script setup>`, Quasar y Pinia
- Mantener una única interfaz responsive para web y Android mediante Capacitor
- Usar nombres en español y las convenciones definidas en `AGENTS.md`
- No instalar dependencias nuevas
- No consultar cotizaciones, servicios externos ni tasas de cambio
- No convertir, multiplicar, dividir ni reinterpretar automáticamente ningún importe
- Usar códigos ISO 4217 como valores persistidos y nombres legibles en la interfaz
- Mostrar siempre el código ISO junto al importe para evitar símbolos ambiguos como `$`
- Aplicar la moneda principal únicamente como valor inicial de datos nuevos
- No reescribir en masa el almacenamiento de materiales ni presupuestos
- No agregar `monedaPrincipal` a `ConfiguracionDocumentoPresupuesto`: cada presupuesto ya conserva su moneda general y la moneda de cada línea
- Centralizar colores, anchos, espaciados y puntos visuales reutilizables en `src/css/Variables.css`
- Ejecutar las fases en orden porque Configuración, Materiales y Presupuestos dependerán del nuevo dominio común

## FASE 1: Crear el dominio reutilizable de monedas

### Objetivo

Extraer de `src/dominio/materiales.ts` toda decisión general de moneda y crear una única fuente de verdad reutilizable.

- [ ] Crear `src/dominio/monedas.ts`
- [ ] Declarar `MONEDA_INICIAL` con valor `UYU`
- [ ] Declarar `MONEDA_ALTERNATIVA` con valor `USD`
- [ ] Declarar `LOCALE_NUMERICO` con valor `es-419` para mantener separadores numéricos coherentes con una aplicación en español sin depender exclusivamente de Uruguay
- [ ] Crear la constante `MONEDAS_DISPONIBLES` como arreglo inmutable de objetos con propiedades `codigo` y `nombre`
- [ ] Incluir en `MONEDAS_DISPONIBLES`, en orden prioritario para la interfaz, `UYU`, `USD`, `ARS`, `BOB`, `CLP`, `COP`, `CRC`, `CUP`, `DOP`, `EUR`, `GTQ`, `HNL`, `MXN`, `NIO`, `PAB`, `PYG`, `PEN`, `VES` y `XAF`
- [ ] Incluir además `BRL`, `CAD`, `GBP` y `CHF`
- [ ] Usar los nombres `Peso uruguayo`, `Dólar estadounidense`, `Peso argentino`, `Boliviano`, `Peso chileno`, `Peso colombiano`, `Colón costarricense`, `Peso cubano`, `Peso dominicano`, `Euro`, `Quetzal guatemalteco`, `Lempira hondureño`, `Peso mexicano`, `Córdoba nicaragüense`, `Balboa panameño`, `Guaraní paraguayo`, `Sol peruano`, `Bolívar venezolano`, `Franco CFA de África Central`, `Real brasileño`, `Dólar canadiense`, `Libra esterlina` y `Franco suizo`
- [ ] Derivar el tipo `Moneda` desde `MONEDAS_DISPONIBLES` para evitar mantener un sindicato manual separado
- [ ] Crear la interfaz `OpcionMoneda` con `codigo`, `nombre` y `etiqueta`
- [ ] Crear `esMoneda(valor: unknown): valor is Moneda` y usarla como única validación de códigos
- [ ] Crear `obtenerOpcionMoneda(codigo: Moneda): OpcionMoneda` con etiqueta `Nombre (CÓDIGO)`
- [ ] Crear `obtenerOpcionesMonedasDisponibles(): OpcionMoneda[]` para el selector completo de Configuración
- [ ] Crear `crearOpcionesMonedaOperacion(monedaPrincipal: Moneda, monedaActual?: Moneda): OpcionMoneda[]`
- [ ] Hacer que `crearOpcionesMonedaOperacion` devuelva primero la moneda principal, luego `USD` si es diferente y, solamente para preservar un dato existente, la moneda actual si no coincide con ninguna de las anteriores
- [ ] Eliminar duplicados por código dentro de `crearOpcionesMonedaOperacion`; una moneda principal `USD` sin moneda histórica debe producir exactamente una opción
- [ ] Crear `buscarOpcionesMoneda(opciones: readonly OpcionMoneda[], termino: string)` y normalizar mayúsculas, espacios y tildes para permitir búsquedas como `dolar`, `dólar` o `USD`
- [ ] Crear `compararMonedas(monedaA: Moneda, monedaB: Moneda): number` usando el orden de `MONEDAS_DISPONIBLES`, con comparación alfabética del código como respaldo seguro
- [ ] Mover `formatearImporte(importe, moneda)` desde `src/dominio/materiales.ts` hacia `src/dominio/monedas.ts`
- [ ] Mantener el formato visible `CÓDIGO 1.234,56`, con mínimo y máximo de dos decimales, sin usar símbolos monetarios
- [ ] Crear `formatearNumero(cantidad)` en el mismo dominio para sustituir el `Intl.NumberFormat('es-UY')` aislado de `DocumentoPresupuesto.vue`
- [ ] Actualizar todos los imports de `Moneda` y `formatearImporte` para que provengan de `@/dominio/monedas`
- [ ] Mantener en `src/dominio/materiales.ts` únicamente `formatearPrecioVisible`, importando allí `formatearImporte`

## FASE 2: Crear el selector de moneda reutilizable y responsive

### Objetivo

Evitar tres implementaciones distintas del mismo control y asegurar que nombres largos funcionen en móvil y escritorio.

- [ ] Crear `src/components/monedas/SelectorMoneda.vue`
- [ ] Implementar `v-model` tipado como `Moneda`
- [ ] Definir las props `opciones: readonly OpcionMoneda[]`, `etiqueta: string`, `buscable?: boolean`, `deshabilitado?: boolean`, `denso?: boolean` y `ayuda?: string`
- [ ] Implementar el control con `q-select`, usando `option-label="etiqueta"`, `option-value="codigo"`, `emit-value` y `map-options`
- [ ] Activar `use-input` e `input-debounce="0"` solamente cuando `buscable` sea verdadero
- [ ] Crear el ref interno `opcionesFiltradas` y la función `filtrarOpciones`; restaurar la lista completa cada vez que se abra o limpie la búsqueda
- [ ] Usar `buscarOpcionesMoneda` para filtrar por nombre o código sin duplicar lógica en componentes consumidores
- [ ] Mostrar `Sin monedas disponibles` en el estado `no-option`
- [ ] Mantener `aria-label` o etiqueta visible y comportamiento correcto con teclado, foco y lector de pantalla
- [ ] Agregar la clase base `selector-moneda` y el modificador `selector-moneda--denso`
- [ ] Agregar en `src/css/Variables.css` `--ancho-selector-moneda: 22rem` y `--ancho-selector-moneda-denso: 15rem`
- [ ] Definir en `src/css/app.css` un ancho máximo para escritorio, `width: 100%` y `min-width: 0` para impedir desbordes
- [ ] Hacer que el menú emergente pueda mostrar la etiqueta completa y que el texto seleccionado use el espacio disponible sin ensanchar el contenedor
- [ ] En anchos de hasta `767px`, hacer que `SelectorMoneda` y su botón/área interactiva ocupen todo el ancho disponible
- [ ] Reemplazar con este componente los radios duplicados de `FormularioMaterial.vue` y `ResumenPresupuesto.vue`; no conservar dos controles de moneda diferentes

## FASE 3: Persistir y mostrar la moneda principal en Configuración

### Objetivo

Agregar `monedaPrincipal` sin perder la configuración moderna existente y mostrar claramente qué importes requieren revisión cuando cambia.

- [ ] Importar `Moneda`, `MONEDA_INICIAL` y `esMoneda` en `src/dominio/configuracion.ts`
- [ ] Agregar `monedaPrincipal: Moneda` a `DatosConfiguracion`; `Configuracion` la heredará automáticamente
- [ ] Agregar `monedaPrincipal: MONEDA_INICIAL` dentro de `crearConfiguracionInicial()`
- [ ] Incluir `monedaPrincipal` en `normalizarDatosConfiguracion()` y usar `MONEDA_INICIAL` como recuperación segura solamente ante un valor de runtime inválido
- [ ] Actualizar `esConfiguracionGuardada()` para exigir una moneda reconocida mediante `esMoneda`
- [ ] Crear `migrarConfiguracionSinMonedaPrincipal(valor: unknown): Configuracion | null` para reconocer exactamente la estructura moderna actual que todavía no contiene el campo
- [ ] Crear el guard privado `esConfiguracionGuardadaSinMonedaPrincipal` para validar todos los campos modernos excepto el nuevo, sin usar conversiones de tipo inseguras
- [ ] Hacer que `migrarConfiguracionSinMonedaPrincipal` copie íntegramente logo, todas las `tarifasManoObra`, traslado, mensaje, métodos de pago, redes sociales y fechas, agregando únicamente `monedaPrincipal: MONEDA_INICIAL`
- [ ] No enviar una configuración moderna sin moneda a `migrarConfiguracionAnterior()`, porque esa función reconstruye la mano de obra desde `precioManoObraHora` y podría perder tarifas actuales
- [ ] Mantener `migrarConfiguracionAnterior()` para el formato realmente antiguo; `crearConfiguracionInicial()` ya aportará la nueva moneda
- [ ] Cambiar `RepositorioConfiguracionLocal.obtener()` para probar, en este orden: configuración nueva válida, configuración moderna sin moneda, configuración antigua y configuración inicial
- [ ] Crear en `RepositorioConfiguracionLocal.obtener()` el booleano `configuracionNecesitaMigracion` para distinguir una configuración ya válida de cualquiera de los formatos migrados
- [ ] Persistir el resultado cuando `configuracionNecesitaMigracion` sea verdadero o cambie el mensaje predeterminado; no depender únicamente de comparar referencias después de la migración
- [ ] Conservar el reintento silencioso actual si falla el guardado de la migración
- [ ] Agregar en `useConfiguracionStore` el computed público `monedaPrincipal`, derivado de `configuracion.value.monedaPrincipal`, para que páginas y componentes no repitan el acceso profundo
- [ ] En `FormularioConfiguracion.vue`, crear `monedaPrincipal`, `monedaPrincipalCargada` y `monedaPrincipalCambio` con esos nombres
- [ ] Cargar ambas referencias desde `props.configuracion.monedaPrincipal` dentro del `watch` existente
- [ ] Incluir `monedaPrincipal` en el objeto emitido por `guardarConfiguracion()`
- [ ] Insertar la sección `Moneda principal` inmediatamente después de `Traslado` y antes de `Métodos de pago`
- [ ] Renderizar `SelectorMoneda` con todas las opciones, `buscable`, etiqueta `Moneda principal` y ayuda `Se usará por defecto en materiales y presupuestos nuevos.`
- [ ] Mostrar el texto `Cambiar la moneda no convierte materiales ni presupuestos guardados.` dentro de la sección
- [ ] Mostrar un `q-banner` de advertencia cuando `monedaPrincipalCambio` sea verdadero, indicando que los números de mano de obra y traslado no se convierten y deben revisarse manualmente antes de guardar
- [ ] No bloquear el guardado por la advertencia: su función es informar, no convertir ni impedir la decisión del usuario
- [ ] Agregar `:prefix="monedaPrincipal"` a los campos `precioHora` y `precioTrasladoKilometro` para hacer visible en qué moneda serán usados los valores configurados
- [ ] Al actualizarse `props.configuracion` después de guardar, actualizar también `monedaPrincipalCargada` para ocultar la advertencia
- [ ] Reutilizar `grilla-configuracion--un-campo` y agregar solo las clases específicas imprescindibles para la explicación y el banner
- [ ] Verificar que la sección se mantenga en una columna, sin desbordes, bajo el breakpoint existente de `43.75rem`

## FASE 4: Aplicar la moneda principal en Materiales

### Objetivo

Crear precios nuevos en la moneda elegida y conservar de forma visible y editable los precios históricos.

- [ ] En `src/dominio/materiales.ts`, cambiar la firma a `crearPrecioMaterial(moneda: Moneda = MONEDA_INICIAL)`
- [ ] Sustituir el literal interno `moneda: 'UYU'` por el parámetro `moneda`
- [ ] Mantener intactos `crearMaterial`, `actualizarMaterial`, cálculos por presentación e importes parciales; ninguno debe convertir precios
- [ ] En `src/stores/materiales.ts`, eliminar `ORDEN_MONEDAS`
- [ ] Usar `compararMonedas(precioA.moneda, precioB.moneda)` dentro de `compararMateriales()` antes de comparar importes de una misma moneda
- [ ] No modificar `RepositorioMaterialesLocal`: actualmente copia los datos persistidos y no necesita una migración destructiva para admitir nuevos códigos
- [ ] En `MaterialFormularioPage.vue`, importar y crear `configuracionStore`
- [ ] Renombrar `cargandoMaterial` a `cargandoPagina`, inicializarlo en `true` tanto para alta como para edición y esperar en paralelo `configuracionStore.asegurarConfiguracionCargada()` y la carga necesaria de materiales
- [ ] Incluir `configuracionStore.error` en el aviso de error de la página
- [ ] No renderizar `FormularioMaterial` hasta terminar la carga, evitando que un material nuevo nazca en `UYU` antes de conocer la configuración persistida
- [ ] Pasar `:moneda-principal="configuracionStore.monedaPrincipal"` a `FormularioMaterial`
- [ ] En `FormularioMaterial.vue`, agregar la prop obligatoria `monedaPrincipal: Moneda`
- [ ] Al crear el primer precio usar `crearPrecioMaterial(props.monedaPrincipal)`
- [ ] En `agregarPrecio()` usar también `crearPrecioMaterial(props.monedaPrincipal)`
- [ ] Crear `opcionesMonedaPrecio(precio)` y devolver `crearOpcionesMonedaOperacion(props.monedaPrincipal, precio.moneda)`
- [ ] Sustituir los dos bloques repetidos `q-field` + `q-radio` de precio directo y presentación por `SelectorMoneda`
- [ ] Mantener `:prefix="precio.moneda"` en precio directo, precio de presentación y precio parcial
- [ ] Para un precio nuevo con moneda principal `USD`, comprobar que `opcionesMonedaPrecio` devuelva solamente `USD`
- [ ] Para un precio histórico cuya moneda no sea moneda principal ni `USD`, incluir esa moneda como opción contextual para que el control nunca quede vacío ni cambie al guardar otro campo
- [ ] No cambiar automáticamente las monedas de precios existentes si cambia `props.monedaPrincipal` durante la vida del componente
- [ ] Actualizar los imports de `formatearImporte` en `FormularioMaterial.vue`, `MaterialDetallePage.vue`, `MaterialesPage.vue` y cualquier consumidor detectado por búsqueda global
- [ ] Sustituir `.grupo-precio-moneda` por una grilla de dos columnas flexibles en escritorio y conservar la columna única actual hasta `767px`
- [ ] Usar `--ancho-selector-moneda-denso` para el selector de cada precio y asegurar `min-width: 0` en ambas columnas

## FASE 5: Generalizar el dominio y la persistencia de presupuestos

### Objetivo

Eliminar todas las degradaciones rígidas a `UYU` y preparar una operación pura y segura para confirmar conversiones.

- [ ] En `src/dominio/presupuestos.ts`, importar `Moneda`, `MONEDA_INICIAL` y `esMoneda` desde `@/dominio/monedas`
- [ ] Sustituir los valores predeterminados literales de `crearLineasInicialesPresupuesto`, `crearLineaMaterialManual` y `crearLineaManoObra` por `MONEDA_INICIAL`
- [ ] Cambiar `crearLineaDesdeMaterial(material)` a `crearLineaDesdeMaterial(material, monedaPredeterminada: Moneda = MONEDA_INICIAL)` y usar el parámetro solamente cuando el material no tenga precio recuperable
- [ ] En `normalizarDatosPresupuesto()`, preservar `datos.moneda` cuando `esMoneda(datos.moneda)` y usar `MONEDA_INICIAL` únicamente como respaldo de runtime
- [ ] En `recuperarPresupuestoGuardado()`, preservar cualquier moneda soportada mediante `esMoneda(valor.moneda)` en vez del ternario `USD/UYU`
- [ ] En `recuperarLineaPresupuesto()`, preservar cualquier moneda soportada mediante `esMoneda(valor.moneda)`
- [ ] En `esPresupuestoGuardado()` y `esLineaPresupuestoGuardada()`, sustituir las comparaciones rígidas `UYU || USD` por `esMoneda`
- [ ] Confirmar que `RepositorioPresupuestosLocal` continúe recuperando presupuestos mediante `recuperarPresupuestoGuardado` sin reescribir importes ni monedas
- [ ] Crear la función pura `confirmarConversionManualLinea(linea: LineaPresupuesto, monedaDestino: Moneda): LineaPresupuesto`
- [ ] Hacer que `confirmarConversionManualLinea` preserve `id`, `tipo`, `nombre`, `cantidad`, `unidad` y `precioUnitario`
- [ ] Hacer que la función cambie `moneda` a `monedaDestino` sin realizar ninguna operación matemática
- [ ] Si la línea proviene del catálogo, convertir solamente la copia del ticket a `origen: 'manual'`, establecer `idMaterial: null` y vaciar `opcionesUnidad`
- [ ] Vaciar `opcionesUnidad` también si contiene precios automáticos, evitando que `actualizarPrecioPorUnidad()` pueda restaurar después un importe de la moneda original
- [ ] Mantener la unidad actualmente seleccionada al desvincular las opciones automáticas
- [ ] Devolver una copia nueva desde `confirmarConversionManualLinea` para conservar un flujo predecible y facilitar futuras pruebas
- [ ] No modificar `ConfiguracionDocumentoPresupuesto`, porque la moneda general y las monedas de líneas ya forman parte de `DatosPresupuesto`

## FASE 6: Aplicar la moneda principal y la confirmación en el Ticket

### Objetivo

Usar la moneda configurada en presupuestos nuevos y completar el flujo manual de incompatibilidades en la interfaz editable.

- [ ] En `NuevoPresupuestoPage.vue`, importar `Moneda` y `MONEDA_INICIAL` desde `@/dominio/monedas`
- [ ] Mantener `monedaPresupuesto` inicializada con `MONEDA_INICIAL` solamente como estado seguro previo a la carga
- [ ] En `restablecerFormularioNuevo()`, crear `const monedaPrincipal = configuracionStore.monedaPrincipal`
- [ ] Asignar `monedaPresupuesto.value = monedaPrincipal`
- [ ] Pasar `monedaPrincipal` a `crearLineasInicialesPresupuesto()` para que mano de obra y traslado nazcan en esa moneda
- [ ] En `agregarMaterial()`, llamar `crearLineaDesdeMaterial(material, configuracionStore.monedaPrincipal)` para cubrir el respaldo sin precio
- [ ] Mantener los materiales manuales y nuevas manos de obra usando `monedaPresupuesto.value`, porque se crean dentro del ticket actual
- [ ] Crear `confirmarConversionLinea(indiceLinea: number)` en la página y reemplazar `lineas.value[indiceLinea]` por el resultado de `confirmarConversionManualLinea(linea, monedaPresupuesto.value)`
- [ ] Pasar `:moneda-principal="configuracionStore.monedaPrincipal"` a `ResumenPresupuesto`
- [ ] Escuchar `@confirmar-conversion="confirmarConversionLinea(indice)"` en cada `FilaPresupuesto`
- [ ] En `ResumenPresupuesto.vue`, agregar la prop obligatoria `monedaPrincipal: Moneda`
- [ ] Crear el computed `opcionesMonedaPresupuesto` mediante `crearOpcionesMonedaOperacion(props.monedaPrincipal, moneda.value)`
- [ ] Sustituir los radios basados en `MONEDAS` por `SelectorMoneda` con etiqueta `Moneda del presupuesto`, modo denso y `:deshabilitado="soloLectura"`
- [ ] Para presupuestos nuevos con principal `USD`, mostrar una sola opción `USD`
- [ ] Para un presupuesto histórico cuya moneda general no sea principal ni `USD`, agregar su moneda guardada como opción contextual y mantenerla seleccionada
- [ ] No cambiar las monedas de líneas existentes cuando el usuario cambie la moneda general; deben pasar a compatible o incompatible por comparación
- [ ] En `FilaPresupuesto.vue`, mantener `monedaCompatible` como computed basado en `lineaTieneMonedaCompatible`
- [ ] Reemplazar el aviso actual que propone eliminar el material por un texto que indique `Convertí manualmente el importe de CÓDIGO_ORIGEN a CÓDIGO_DESTINO y confirmá la conversión.`
- [ ] Agregar el botón `Confirmar conversión a CÓDIGO_DESTINO` únicamente cuando la línea sea incompatible y `soloLectura` sea falso
- [ ] Emitir `confirmar-conversion` sin mutar directamente la moneda desde el componente
- [ ] En solo lectura, mostrar la incompatibilidad y exclusión del total, pero no mostrar el botón ni instrucciones de edición
- [ ] Mantener `cantidadIncompatibles`, `lineaTieneMonedaCompatible` y las funciones de total como única fuente para excluir líneas
- [ ] No permitir que el botón cambie el catálogo, consulte tasas o altere el importe escrito por el usuario

## FASE 7: Integrar salidas, estilos y compatibilidad histórica

### Objetivo

Actualizar todos los consumidores y cerrar el comportamiento visual sin modificar servicios que no necesitan conocer la moneda principal.

- [ ] En `DocumentoPresupuesto.vue`, importar `formatearImporte` y `formatearNumero` desde `@/dominio/monedas`
- [ ] Sustituir su `Intl.NumberFormat('es-UY')` local por `formatearNumero`
- [ ] Mantener visible `Moneda: CÓDIGO`, los importes originales de cada línea y la advertencia de conceptos incompatibles
- [ ] Mantener las líneas incompatibles visibles en el documento, pero excluidas de los totales mediante las funciones actuales
- [ ] En `PresupuestosPage.vue`, importar el formateador desde el nuevo dominio y conservar la moneda propia de cada presupuesto
- [ ] En `src/dominio/whatsapp.ts`, importar `Moneda` y `formatearImporte` desde el nuevo dominio
- [ ] Mantener el mensaje de WhatsApp mostrando únicamente totales compatibles en la moneda general del presupuesto
- [ ] Verificar `accionesPresupuesto.ts` sin agregarle moneda principal: ya transmite `datos.moneda` al mensaje y usa el documento renderizado para PDF
- [ ] Verificar `pdfPresupuesto.ts` sin agregar lógica monetaria: debe continuar clonando el documento ya formateado
- [ ] Verificar `VistaPreviaPresupuestoPage.vue`: la recuperación mediante `normalizarDatosPresupuesto` debe conservar las nuevas monedas después de eliminar los ternarios rígidos
- [ ] Buscar nuevamente en todo `src` los textos `MONEDAS`, `ORDEN_MONEDAS`, `'UYU'`, `'USD'`, `Intl.NumberFormat('es-UY')` e imports de `Moneda` desde materiales
- [ ] Permitir únicamente los literales `UYU` y `USD` correspondientes a `MONEDA_INICIAL`, `MONEDA_ALTERNATIVA`, el catálogo y casos de prueba; eliminar supuestos rígidos restantes
- [ ] No modificar `ControlEstadoPresupuesto.vue`: su `Intl.DateTimeFormat('es-UY')` formatea una fecha y no participa del dominio monetario
- [ ] Agregar en `src/css/Variables.css` solamente los anchos reutilizables definidos para el selector
- [ ] Crear `.fila-presupuesto__aviso-moneda` como contenedor flexible del texto y el botón, usando variables existentes de color, borde, radio y espaciado
- [ ] En escritorio, alinear el botón de confirmación al final sin reducir el espacio de los campos editables
- [ ] Hasta `767px`, apilar texto y botón, dar al botón `width: 100%` y mantener objetivos táctiles cómodos
- [ ] Hacer que `.resumen-presupuesto__controles` y el selector puedan ocupar todo el ancho en móvil sin empujar ni cortar los totales
- [ ] Mantener la grilla actual de filas en dos columnas hasta `1023px` y una columna hasta `767px`
- [ ] Probar etiquetas largas como `Franco CFA de África Central (XAF)` en Configuración, Materiales y Ticket
- [ ] No modificar claves de almacenamiento, identificador Android, rutas, dependencias ni contratos de repositorio

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano el dominio común, la migración, la persistencia, los cálculos y el diseño responsive.

- [ ] Ejecutar una búsqueda global y confirmar que no quedan validaciones o conversiones rígidas limitadas a `UYU | USD`
- [ ] Abrir una instalación sin Configuración y verificar `Peso uruguayo (UYU)` como moneda principal
- [ ] Verificar la búsqueda del selector con nombre, código, mayúsculas y texto sin tilde
- [ ] Confirmar que están disponibles todas las monedas acordadas, incluida `XAF`, y que se muestran como `Nombre (CÓDIGO)`
- [ ] Seleccionar otra moneda, guardar, recargar la SPA y verificar que persista
- [ ] Cerrar y reabrir la aplicación Android y verificar que la selección persista
- [ ] Cargar una Configuración moderna anterior sin `monedaPrincipal` y comprobar que obtiene `UYU` sin perder ninguna tarifa de mano de obra, logo, traslado, mensaje, método de pago ni red social
- [ ] Cargar una Configuración del formato antiguo y comprobar que la migración existente sigue funcionando y agrega `UYU`
- [ ] Cambiar la moneda principal y verificar la advertencia de revisión sin bloquear el guardado
- [ ] Confirmar que cambiar la moneda principal no modifica los números de mano de obra ni traslado y sí actualiza sus prefijos visibles
- [ ] Crear un material nuevo y verificar que el primer precio y todos los precios agregados nazcan en la moneda principal
- [ ] Configurar `USD` como principal y verificar que un material nuevo muestre una sola opción `USD`
- [ ] Abrir un material histórico en `UYU` con otra moneda principal y comprobar que conserve moneda, importes totales, importes parciales y precio predeterminado
- [ ] Editar solamente el nombre o comercio de ese material histórico y comprobar que guardar no cambie su moneda
- [ ] Ordenar materiales con tres o más monedas y verificar que primero se agrupen por moneda y luego se comparen importes dentro del mismo grupo
- [ ] Crear un presupuesto nuevo y comprobar que moneda general, primera mano de obra y traslado usen `configuracionStore.monedaPrincipal`
- [ ] Agregar un material manual y una mano de obra adicional después de cambiar la moneda del ticket y comprobar que nazcan en la moneda actual del ticket
- [ ] Agregar un material `USD` a un presupuesto en otra moneda y verificar el marcado rojo, el aviso y su exclusión de total general, materiales y consolidado cuando corresponda
- [ ] Editar manualmente el precio incompatible y comprobar que siga excluido hasta pulsar el botón
- [ ] Pulsar `Confirmar conversión a CÓDIGO` y comprobar que no cambien cantidad, unidad ni importe
- [ ] Confirmar que la línea convertida adopte la moneda del ticket, entre en los totales y deje de mostrar el aviso
- [ ] Confirmar que el material original del catálogo conserve moneda, precios y opciones de unidad
- [ ] Convertir una línea de catálogo con varias opciones de unidad y comprobar que después no pueda restaurarse automáticamente un precio de la moneda anterior
- [ ] Cambiar nuevamente la moneda general y verificar que la línea vuelva a marcarse incompatible sin conversión automática
- [ ] Guardar y reabrir el presupuesto convertido y comprobar que preserve la moneda confirmada
- [ ] Abrir y editar un presupuesto histórico en `UYU` con otra moneda principal y verificar que `UYU` aparezca como opción contextual seleccionada
- [ ] Configurar `USD` como principal y verificar una sola opción en datos nuevos, manteniendo visibles las monedas históricas únicamente cuando un registro existente las necesite
- [ ] Generar vista previa, PDF y mensaje de WhatsApp con `UYU`, `USD`, `ARS`, `EUR` y `XAF`; verificar códigos, separadores, dos decimales y totales
- [ ] Confirmar que una línea incompatible permanezca visible en la vista previa/PDF, pero no se incluya en ningún total
- [ ] Revisar Configuración, formulario de Materiales y Ticket en escritorio, `1023px`, `767px` y un teléfono Android real o emulado
- [ ] Verificar que selectores, etiquetas largas, avisos y botones no produzcan scroll horizontal ni texto inaccesible
- [ ] Verificar navegación por teclado, foco visible, etiquetas accesibles y áreas táctiles del botón de confirmación
- [ ] Ejecutar `npm run lint`
- [ ] Ejecutar `npm run typecheck`
- [ ] Ejecutar `npm run build`
- [ ] Ejecutar `npm run build:android`

## Progreso del plan

- [ ] Fase 1: Crear el dominio reutilizable de monedas
- [ ] Fase 2: Crear el selector de moneda reutilizable y responsive
- [ ] Fase 3: Persistir y mostrar la moneda principal en Configuración
- [ ] Fase 4: Aplicar la moneda principal en Materiales
- [ ] Fase 5: Generalizar el dominio y la persistencia de presupuestos
- [ ] Fase 6: Aplicar la moneda principal y la confirmación en el Ticket
- [ ] Fase 7: Integrar salidas, estilos y compatibilidad histórica
- [ ] Fase Testing

Fecha de creación: 26 de Agosto 2026
Fecha de última actualización: 26 de Agosto 2026
Estado: BORRADOR
