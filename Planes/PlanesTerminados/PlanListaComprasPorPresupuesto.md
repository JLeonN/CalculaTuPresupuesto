# PLAN DE LISTA DE COMPRAS POR PRESUPUESTO

## Descripción del plan

Pablo necesita consultar en el celular los materiales de un presupuesto guardado, marcar los que ya compró o ya tenía, y corregir nombre y cantidad mientras compra. La lista es interna: el cliente solo recibe el PDF del presupuesto. El ticket es la fuente de las líneas; no se crea un catálogo ni una copia paralela de materiales. Este archivo permite ejecutar las fases independientes sin conocer la conversación original. La política de cambios de precio después de la aceptación queda expresamente pendiente de la respuesta de Pablo y está aislada en la FASE 4.

## Objetivo principal

- Mostrar una lista de compras propia de cada presupuesto guardado, disponible en estado pendiente, aceptado o rechazado.
- Mostrar primero materiales pendientes y después comprados; conservar dentro de cada grupo el orden relativo de las líneas del ticket.
- Persistir el tick por línea. Las ediciones de nombre y cantidad hechas en la lista actualizan la misma línea del ticket. Las ediciones posteriores del ticket se reflejan en la lista.
- Mostrar a Pablo el precio real `precioUnitario` y la moneda de cada material, sin aplicar `porcentajeAdicionalMateriales` en la lista.
- Dejar la edición de precios con presupuesto aceptado supeditada a la decisión comercial pendiente, sin bloquear las fases anteriores.

## Contexto técnico verificado

- `AGENTS.md` exige Quasar/Vue 3/TypeScript estricto, nombres de símbolos en español, CSS reutilizable en `src/css/Variables.css` y validaciones proporcionales. No se debe implementar código durante la creación de este plan, ni hacer `git add`, commit o push al ejecutarlo salvo pedido expreso de Leo.
- `src/dominio/presupuestos.ts` define `LineaPresupuesto` con `id`, `tipo`, `nombre`, `cantidad`, `unidad`, `precioUnitario`, `moneda` y origen. Los tipos son `material`, `manoObra` y `traslado`; `Presupuesto` tiene `estado` (`pendiente`, `aceptado`, `rechazado`). Las líneas se guardan dentro del presupuesto, no en una entidad de compra independiente.
- `crearLineaMaterialManual()` y `crearLineaDesdeMaterial()` generan líneas materiales. `recuperarLineaPresupuesto()` reconstruye datos históricos, `esLineaPresupuestoGuardada()` los valida y `normalizarLineaPresupuesto()` normaliza las ediciones. Los presupuestos viejos deben recuperar materiales sin tick como pendientes.
- `usePresupuestosStore` carga, obtiene y edita presupuestos; `editarPresupuesto(idPresupuesto, datos)` conserva `id`, `estado` y fechas de creación/cambio de estado mediante `actualizarPresupuesto()`. `RepositorioPresupuestosLocal` persiste la lista completa bajo la clave actual `calcula-tu-presupuesto:presupuestos:v1`.
- `NuevoPresupuestoPage.vue` sirve para nuevo, edición y detalle; el botón «Editar» y el control de estado están en el detalle. `PresupuestosPage.vue` ofrece tabla de escritorio y tarjetas móviles. Vue Router está en `src/router/routes.ts`, bajo `MainLayout.vue`.
- `FilaPresupuesto.vue` ya edita nombre, cantidad, unidad y precio real dentro del ticket. `DocumentoPresupuesto.vue` y WhatsApp calculan importes para el cliente a partir de las líneas y del porcentaje adicional. El tick de compra nunca debe entrar en esas salidas.
- `src/css/app.css` tiene reglas del ticket, tabla y tarjetas, con cortes existentes de 1023 y 767 px; `src/css/Variables.css` contiene colores, espacios, tamaños y bordes. Comandos verificados: `npm run lint:check`, `npm run typecheck`, `npm run build`, `npm run build:android`.
- Contexto comercial: `C:/Z-Programacion/SolucionesAMedida/Clientes/MallicTesla/Contexto.md` describe materiales medidos por unidad o por metros de una presentación mayor. La lista mostrará la cantidad y unidad consumida en el ticket; no calculará rollos, cajas ni necesidades de compra física.

## Alcance

### Incluye

- Una pantalla «Lista de compras» por presupuesto guardado, accesible desde el encabezado del detalle del ticket y con retorno al presupuesto.
- Marcar y desmarcar materiales, incluidos los ya disponibles en poder de Pablo; tick significa «resuelto». La casilla compacta lleva una etiqueta accesible con el nombre y estado del material.
- Edición en la lista de nombre y cantidad. Mostrar unidad y precio real. El precio solo podrá editarse con estado `pendiente` hasta cerrar la decisión de la FASE 4; en los otros estados será visible y de solo lectura.
- Sincronización bidireccional por la misma `LineaPresupuesto.id`; el tick persiste si cambia nombre, cantidad, unidad o precio en el ticket. Eliminar la línea del ticket también la elimina de la lista.

### No incluye

- Compartir, imprimir o generar PDF de la lista; incorporarla al PDF del cliente o al texto de WhatsApp.
- Agregar o eliminar materiales, cambiar unidad o moneda, elegir otra opción de precio del catálogo desde la lista: esas acciones siguen en el ticket.
- Calcular presentaciones comerciales, inventario, comercios, gasto real, diferencias contra el precio aceptado o costos adicionales.
- Lista global de varios presupuestos, acceso desde navegación principal o lista para un presupuesto nuevo todavía sin guardar.

## Decisiones funcionales cerradas

- La lista existe desde que se guarda el presupuesto. Es visible cualquiera sea su estado; no se exige aceptación previa.
- Orden: partición estable de las líneas `tipo === 'material'`: primero `comprado === false`, luego `comprado === true`, conservando en cada grupo el índice original del ticket. No ordenar por nombre ni fecha y no reordenar `presupuesto.lineas` al marcar.
- Se conservan líneas materiales repetidas como filas independientes, identificadas por `linea.id`. Las líneas de mano de obra y traslado nunca aparecen.
- Cambiar un material ya marcado conserva su tick, aunque cambie totalmente el nombre. Un material nuevo arranca pendiente. Un presupuesto histórico sin campo de compra arranca con todos sus materiales pendientes.
- La cantidad y unidad que se muestran son las del ticket: por ejemplo, 20 metros presupuestados se muestran como 20 metros, aunque Pablo compre un rollo de 100. No hay cálculo de stock.
- La lista muestra `precioUnitario` real y `moneda` propios de cada línea. El porcentaje adicional es un dato de venta y no se muestra como precio de compra.
- El nombre «Lista de compras» se usa para botón, ruta/página y encabezado. El estado «Comprado» sirve también para materiales que Pablo ya tenía.

## Decisión comercial pendiente

Pablo debe confirmar qué ocurre cuando el precio encontrado en la tienda difiere del presupuesto **ya aceptado**: cambiar el precio del ticket/PDF posterior, conservar el precio aceptado y registrar gasto real por separado, o aplicar otra regla. Hasta esa respuesta, no crear campos de costo real, ni modificar el precio de una línea aceptada desde la lista. La FASE 4 no se ejecuta por inferencia. Las FASES 1 a 3 y sus pruebas correspondientes son ejecutables de forma independiente; no se debe presentar el plan completo como terminado mientras la FASE 4 siga pendiente.

## Mapa de cambios

| Archivo                                            | Acción                                             | Símbolos principales                                                                  | Propósito                                                                  |
| -------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/dominio/presupuestos.ts`                      | Modificar                                          | `LineaPresupuesto.comprado`, constructores, normalización, recuperación y guard       | Persistir tick por línea con compatibilidad histórica.                     |
| `src/dominio/listaCompras.ts`                      | Crear                                              | `obtenerMaterialesListaCompras`, `crearDatosPresupuestoConMaterialActualizado`        | Concentrar filtrado, orden estable y actualización inmutable de una línea. |
| `src/stores/presupuestos.ts`                       | Modificar                                          | `actualizarMaterialListaCompras`, `CambiosMaterialListaCompras`                       | Guardar una edición puntual sin reconstruir una segunda lista.             |
| `src/pages/ListaComprasPage.vue`                   | Crear                                              | `presupuesto`, `materialesOrdenados`, `guardarCambiosMaterial`, `volverAlPresupuesto` | Pantalla interna de compra por presupuesto.                                |
| `src/components/presupuestos/FilaListaCompras.vue` | Crear                                              | props `linea`, `guardando`; eventos `cambiarComprado`, `guardarDetalles`              | Fila editable y accesible, reutilizable dentro de la lista.                |
| `src/router/routes.ts`                             | Modificar                                          | ruta `lista-compras-presupuesto`                                                      | Abrir `/presupuestos/:idPresupuesto/lista-compras`.                        |
| `src/pages/NuevoPresupuestoPage.vue`               | Modificar                                          | encabezado de detalle, botón `Lista de compras`                                       | Acceso contextual desde presupuesto guardado.                              |
| `src/css/app.css`                                  | Modificar                                          | clases `lista-compras*`, encabezado y fila                                            | Distribución móvil y escritorio mediante tokens existentes.                |
| `src/css/Variables.css`                            | Modificar solo si hace falta un token reutilizable | token semántico comprobado                                                            | Evitar literales visuales nuevos repetidos.                                |

## FASE 1: Incorporar el estado de compra a las líneas

### Objetivo

Persistir el tick en cada material sin alterar cálculos ni datos históricos.

### Pasos de ejecución

- [x] En `src/dominio/presupuestos.ts`, agregar `comprado: boolean` a `LineaPresupuesto`. Inicializarlo en `false` en `crearLineaMaterialManual()`, `crearLineaDesdeMaterial()` y el constructor privado `crearLineaPredefinida()` para que el tipo siga completo; para mano de obra y traslado el campo permanece `false` y no se usa. `crearLineaManoObra()` hereda el valor del constructor.
- [x] En `normalizarLineaPresupuesto()`, conservar `comprado` únicamente cuando `linea.tipo === 'material' && linea.comprado === true`; devolver `false` para otros tipos. `clonarLineasPresupuesto()` ya copia el campo con `...linea`; no cambiar sus opciones anidadas.
- [x] En `recuperarLineaPresupuesto()`, recuperar `comprado` como `valor.comprado === true` solo para material; ausencia histórica equivale a `false`. En `esLineaPresupuestoGuardada()`, aceptar el booleano para datos nuevos y ausencia histórica solo durante recuperación: validar el objeto normalizado resultante; no rechazar presupuestos antiguos por el campo nuevo. No cambiar la clave de almacenamiento ni los campos de precio.
- [x] Crear `src/dominio/listaCompras.ts`, sin dependencia de Vue o Quasar. Exportar `obtenerMaterialesListaCompras(lineas: readonly LineaPresupuesto[]): LineaPresupuesto[]`: filtrar materiales y concatenar pendientes y comprados con dos `filter`, preservando referencias y orden relativo. Exportar `crearDatosPresupuestoConMaterialActualizado(presupuesto: Presupuesto, idLinea: string, cambios: CambiosMaterialListaCompras): DatosPresupuesto`, donde `CambiosMaterialListaCompras` es un tipo exportado con campos opcionales `comprado?: boolean`, `nombre?: string`, `cantidad?: number | null`, `precioUnitario?: number | null`. Construir un nuevo `DatosPresupuesto` copiando explícitamente destinatario, fecha, moneda, porcentaje, formato, configuración y todas las líneas; reemplazar únicamente la línea material con el ID indicado, sin modificar otras líneas ni metadatos. Lanzar un error claro si no existe o no es material; no permitir que un cambio vacío modifique el presupuesto. Validar `comprado` booleano, `nombre` no vacío al editarlo, y cantidad/precio finitos no negativos cuando se editen. La validación de permiso comercial para precio aceptado se hace en el store, que conoce `presupuesto.estado`.
- [x] Comprobar en el dominio que dos materiales con el mismo nombre conservan ticks separados por ID; marcar/desmarcar solo cambia el grupo visual, sin mutar el orden del ticket.

## FASE 2: Guardar cambios y construir la pantalla

### Objetivo

Permitir que Pablo use y edite la lista de un presupuesto guardado desde el celular.

### Pasos de ejecución

- [x] En `src/stores/presupuestos.ts`, importar `CambiosMaterialListaCompras` y `crearDatosPresupuestoConMaterialActualizado()`. Crear `actualizarMaterialListaCompras(idPresupuesto: string, idLinea: string, cambios: CambiosMaterialListaCompras): Promise<Presupuesto>` y exponerla en el retorno del store. Obtener la versión actual mediante `obtenerPresupuestoPorId()` antes de cada actualización; si no existe, lanzar error. Si `cambios.precioUnitario` está presente y `estado !== 'pendiente'`, rechazar con mensaje que explique que falta la regla para precios tras la aceptación. Para un material pendiente, pasar el `DatosPresupuesto` actualizado a `editarPresupuesto()` existente, aprovechando sus estados `guardando`/`error` y persistencia. No crear otro repositorio ni otra clave.
- [x] Crear `src/components/presupuestos/FilaListaCompras.vue` con `<script setup lang="ts">`: prop `linea: LineaPresupuesto` (material), `guardando: boolean`, `precioEditable: boolean`; emitir `cambiarComprado: [comprado: boolean]` y `guardarDetalles: [cambios: CambiosMaterialListaCompras]`. Mantener estado local `nombreEntrada: string`, `cantidadEntrada: string | number | null`, `precioEntrada: string | number | null`, inicializado y resincronizado cuando cambie la línea persistida. Mostrar nombre a la izquierda, cantidad y casilla a la derecha en la primera fila; precio real a la izquierda y lápiz a la derecha en la segunda. La casilla tiene etiqueta accesible específica para cada material. Abrir inputs solo al pulsar el lápiz: nombre en una fila, cantidad y precio juntos si hay espacio, con unidad y moneda visibles. Mostrar «Guardar cambios» solo si hay cambios y permitir cancelar. Validar nombre no vacío y números finitos no negativos antes de emitir. Guardar al confirmar, sin guardar por cada pulsación; deshabilitar controles durante una operación y mostrar error devuelto desde la página sin borrar la entrada del usuario. Si `precioEditable` es `false`, mostrar precio de solo lectura. Evitar que el checkbox cambie visualmente antes de guardar, o revertirlo al fallar.
- [x] Crear `src/pages/ListaComprasPage.vue` con `<script setup lang="ts">`, `useRoute`, `useRouter` y `usePresupuestosStore`. Definir `idPresupuesto` desde `ruta.params.idPresupuesto`, `presupuesto` como `computed<Presupuesto | undefined>` desde el store, `materialesOrdenados` con `obtenerMaterialesListaCompras(presupuesto.lineas)`, `errorAccion: Ref<string | null>` y `idLineaGuardando: Ref<string | null>`. Al montar y al cambiar el ID de ruta, cargar presupuestos; mostrar carga, error, presupuesto inexistente y lista vacía con acceso al ticket. Renderizar una `FilaListaCompras` por `linea.id`, conservando orden dinámico. Para ticks y detalles llamar a `actualizarMaterialListaCompras`; el store actualiza la misma línea y el `computed` mueve los comprados al final. Mostrar cliente, fecha, estado y enlace «Volver al presupuesto» mediante `/presupuestos/${idPresupuesto}`. Añadir enlace «Editar ticket» para agregar/quitar materiales o cambiar unidad, moneda u opción de catálogo. No renderizar documento/PDF ni invocar servicio de salida.
- [x] En esta fase, permitir edición de precio desde la lista solo para `presupuesto.estado === 'pendiente'`. Mostrar precio en todos los estados. No representar precios con el porcentaje adicional y no ofrecer todavía captura de gasto real.

## FASE 3: Integrar acceso y experiencia responsiva

### Objetivo

Hacer descubrible la lista desde el presupuesto guardado y usable en pantalla angosta.

### Pasos de ejecución

- [x] En `src/router/routes.ts`, insertar antes de `presupuestos/:idPresupuesto` la ruta hija `path: 'presupuestos/:idPresupuesto/lista-compras'`, `name: 'lista-compras-presupuesto'`, `component: () => import('@/pages/ListaComprasPage.vue')`. El prefijo `/presupuestos` ya mantiene activa la navegación principal en `src/configuracion/navegacion.ts`; no agregar un elemento nuevo al menú.
- [x] En `src/pages/NuevoPresupuestoPage.vue`, añadir `q-btn` «Lista de compras» con icono de lista y destino `` `/presupuestos/${presupuesto.id}/lista-compras` `` en el encabezado superior del ticket, visible cuando `soloLectura && presupuesto`. Dejar «Editar» y las acciones de PDF donde están. No mostrar el acceso en presupuesto nuevo sin guardar ni en edición con cambios sin guardar; así no se pierde un borrador al cambiar de pantalla. Ubicarlo visualmente a la derecha del título «Ticket» en escritorio, sin competir con la fecha; en móvil debe ocupar una fila cómoda sin desbordar.
- [x] En `src/css/app.css`, crear reglas semánticas `lista-compras`, `lista-compras__encabezado`, `lista-compras__grupos`, `lista-compras__fila` y variantes necesarias para grid/flex, estados pendiente/comprado y controles. Usar `var(...)` de `Variables.css` para colores, tamaños, espacios, bordes y radios. Usar los `@media (max-width: 1023px)` y `(max-width: 767px)` existentes para pasar de columnas a filas apiladas, mantener checkbox y botón cómodos al tacto, envolver nombres largos y evitar desplazamiento horizontal. Ajustar `.ticket-presupuesto__encabezado-superior` o un contenedor hijo para el botón sin alterar otros controles. Añadir un token a `Variables.css` solo si un valor nuevo se reutiliza y no tiene equivalente.
- [x] Comprobar que el lector de pantalla identifique el estado del checkbox y que el orden de tabulación siga: encabezado, lista de pendientes, lista de comprados. Mostrar encabezados «Pendientes» y «Comprados» con cantidad; un grupo vacío debe seguir siendo entendible. Si una fila se marca, el foco no debe perderse de forma confusa al moverse de grupo.

## FASE 4: Cerrar la regla de precio posterior a la aceptación

### Objetivo

Aplicar exclusivamente la decisión comercial que Pablo confirme, manteniendo coherente el precio de la lista, el ticket y las salidas posteriores.

### Condición previa

Respuesta explícita de Pablo sobre quién absorbe la diferencia y si el presupuesto aceptado debe conservar su precio original. Esta fase está pendiente; no elegir por cuenta propia entre modificar el ticket o registrar gasto real separado.

### Pasos de ejecución

- [ ] Registrar aquí la regla confirmada por Leo antes de implementarla, incluyendo qué ocurre en estados `aceptado` y `rechazado`, qué precio muestra la lista y si cambia el PDF futuro.
- [ ] Si la regla permite modificar el precio del ticket aceptado, cambiar la guardia de `actualizarMaterialListaCompras()` y `precioEditable` en `ListaComprasPage.vue` según los estados acordados. Verificar que los cálculos existentes de resumen, lista de presupuestos, vista previa, PDF y WhatsApp reflejen el nuevo precio, y que el tick permanezca.
- [ ] Si la regla exige conservar el precio aceptado y registrar costo real, diseñar primero el campo persistido y su migración, definir qué pantalla lo edita y muestra, y mantener `linea.precioUnitario` intacto. Ampliar el mapa de cambios del plan antes de codificar esta alternativa. No simularlo modificando `precioUnitario`.

## FASE TESTING

### Objetivo

Validar persistencia, orden, sincronización con el ticket y uso en celular. Las pruebas de la FASE 4 se ejecutan después de resolverla.

### Pruebas técnicas

- [x] Ejecutar `npm run lint:check`, `npm run typecheck`, `npm run build` y, si el entorno Android está disponible, `npm run build:android`; corregir errores propios de este cambio.
- [x] Probar funciones de dominio con material duplicado por nombre, material manual y de catálogo, líneas intercaladas de mano de obra/traslado, presupuesto histórico sin `comprado`, línea eliminada y tick persistido tras recarga. Confirmar que el orden físico de `presupuesto.lineas` no cambia.

### Pruebas funcionales

- [x] Crear y guardar un presupuesto pendiente con tres materiales; abrir «Lista de compras» desde el detalle y comprobar los tres en el orden del ticket. Cambiar estado a aceptado y rechazado y comprobar que la lista continúa disponible.
- [ ] Marcar el primer y tercer material: el segundo queda primero como pendiente, seguido por primero y tercero como comprados. Desmarcar el tercero: vuelve a pendientes respetando el orden original. Recargar la página y reiniciar la app: estado y orden persisten.
- [ ] Editar nombre y cantidad en la lista; volver al ticket, comprobar los mismos valores y verificar resumen/documento cuando corresponda. Editar en el ticket nombre, cantidad, unidad y precio; volver a la lista, comprobar reflejo y tick conservado. Agregar y quitar una línea desde el ticket; la lista aparece/desaparece sin registro huérfano.
- [x] Confirmar que «Lista de compras» solo muestra materiales, incluidos repetidos, sin mano de obra ni traslado; que el precio mostrado es el real de la línea con su moneda, y que no aparece porcentaje adicional ni precio al cliente. Confirmar que no se puede agregar/quitar líneas ni cambiar unidad desde la lista.
- [ ] Simular error de persistencia: mostrar mensaje, conservar el dato que Pablo intentó escribir, y no mostrar falsamente comprado un ítem que no se guardó. Probar nombre vacío, cantidad/precio negativos y no finitos; no persistir valores inválidos.
- [ ] Confirmar que el tick no aparece en PDF, impresión ni texto de WhatsApp. Antes de cerrar la FASE 4, confirmar precio editable solo en estado pendiente y de solo lectura en los demás. Después de cerrarla, repetir el escenario de cambio de precio aceptado según la regla confirmada.

### Casos responsivos

- [ ] Revisar lista y botón de acceso en escritorio, tableta y teléfono Android o emulado, usando los cortes 1023 y 767 px existentes. Comprobar nombres largos, varias monedas, filas repetidas, teclado numérico, foco, controles táctiles y ausencia de desborde horizontal.

## Progreso del plan

- [x] Fase 1: Incorporar el estado de compra a las líneas
- [x] Fase 2: Guardar cambios y construir la pantalla
- [x] Fase 3: Integrar acceso y experiencia responsiva
- [ ] Fase 4: Cerrar la regla de precio posterior a la aceptación — pendiente de Pablo
- [ ] Fase Testing

Fecha de creación: 21 de octubre de 2026
Fecha de última actualización: 21 de octubre de 2026
Estado: FASES 1 A 3 IMPLEMENTADAS; TESTING PARCIAL; FASE 4 PENDIENTE DE PABLO

## Validaciones realizadas el 21 de octubre de 2026

- Pasaron `npm run lint:check`, `npm run typecheck`, `npm run build` y `npm run build:android` (Gradle `assembleRelease`).
- Pruebas ejecutadas de dominio: materiales manuales y de catálogo con nombres repetidos, líneas intercaladas, orden estable sin alterar el ticket, eliminación de línea, validación de entradas, recuperación histórica sin `comprado`, normalización de mano de obra y recarga del repositorio local.
- Prueba en navegador con presupuesto de tres materiales: acceso desde el detalle, marcado y desmarcado, orden por grupos, persistencia tras recarga, edición de nombre/cantidad/precio desde la lista y reflejo en ticket/documento. La edición posterior del ticket conservó el tick. Se comprobó disponibilidad en estados pendiente, aceptado y rechazado; el precio quedó de solo lectura en los dos últimos.
- Con recargo de 20 %, la lista mostró el precio real 12 UYU y el documento mostró el precio de venta 14,40 UYU. Nombre vacío, cantidad negativa y precio negativo mostraron validación. El foco volvió al checkbox después de mover la fila.
- Revisión en navegador a 390, 800 y 1280 px: sin desborde horizontal. No se hizo prueba en dispositivo Android ni emulador.
- Se probó agregar y quitar un material desde el ticket: apareció y desapareció de la lista sin afectar el tick de otra línea.
- Quedan sin completar las casillas de testing que incluyen escenarios aún no verificados por completo: edición de unidad, error real de persistencia, PDF/impresión/WhatsApp, varias monedas, nombre largo y teclado Android. Las pruebas de la FASE 4 siguen pendientes de la respuesta de Pablo.
- Ajuste de interfaz compacta: en navegador a 390 y 320 px se comprobó la disposición de dos filas, edición desplegable con dos campos numéricos juntos, ausencia de «Guardar cambios» sin modificaciones, aparición tras cambiar una entrada, cancelación y guardado con cierre del editor. Volvieron a pasar `npm run lint:check`, `npm run typecheck` y `npm run build`.
