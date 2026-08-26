# PLAN DE MONEDA PRINCIPAL CONFIGURABLE

## Descripción del plan

Incorporar una moneda principal configurable para que la aplicación pueda utilizarse en distintos países sin perder la compatibilidad con los datos existentes. La moneda seleccionada se aplicará por defecto a los materiales nuevos, la mano de obra, el traslado y los presupuestos nuevos. El dólar estadounidense seguirá disponible como moneda alternativa fija. La aplicación no realizará conversiones automáticas: cuando una línea del ticket tenga una moneda diferente, el usuario deberá convertir manualmente el importe y confirmar que la línea ya está expresada en la moneda del presupuesto.

## Objetivo principal

- Agregar en Configuración una moneda principal persistente, con `UYU` como valor inicial de primera instalación
- Ofrecer un catálogo amplio de monedas, priorizando países hispanohablantes e incluyendo monedas internacionales frecuentes
- Sustituir la opción fija `UYU` por la moneda principal configurada en materiales y presupuestos
- Mantener `USD` como alternativa fija sin mostrar opciones duplicadas cuando sea la moneda principal
- Preservar sin modificaciones las monedas y los importes de materiales y presupuestos existentes
- Mantener las conversiones bajo control manual y evitar totales que mezclen monedas

## Reglas del plan

- Usar Vue 3, TypeScript estricto, Composition API con `<script setup>`, Quasar y Pinia
- Mantener una única interfaz responsive para SPA y Android
- Usar códigos ISO 4217 como valor persistido y mostrar nombre legible junto al código
- No instalar dependencias nuevas para obtener, mostrar o convertir monedas
- No consultar cotizaciones ni implementar conversiones automáticas
- No modificar importes ni códigos de moneda guardados en materiales o presupuestos anteriores
- No reinterpretar un importe existente como otra moneda cuando cambie la moneda principal
- Aplicar la nueva moneda principal solamente como valor predeterminado para registros y presupuestos nuevos
- Mantener cada presupuesto guardado como una copia independiente de la configuración actual
- Centralizar cualquier decisión visual reutilizable nueva en `src/css/Variables.css`

## FASE 1: Generalizar el dominio de monedas

### Objetivo

Reemplazar el modelo cerrado `UYU | USD` por un catálogo tipado y reutilizable que permita definir una moneda principal sin perder datos históricos.

- [ ] Crear una definición central de monedas con código ISO, nombre legible y datos necesarios para presentarlas en selectores
- [ ] Incluir como mínimo `UYU`, `USD`, `ARS`, `BOB`, `CLP`, `COP`, `CRC`, `CUP`, `DOP`, `EUR`, `GTQ`, `HNL`, `MXN`, `NIO`, `PAB`, `PYG`, `PEN` y `VES`
- [ ] Incluir además `BRL`, `CAD`, `GBP` y `CHF` como monedas internacionales o regionales frecuentes
- [ ] Mantener `UYU` como moneda principal inicial cuando todavía no exista una configuración guardada
- [ ] Crear funciones reutilizables para validar códigos, obtener el nombre de una moneda y construir las opciones visibles
- [ ] Adaptar el formateo de importes para aceptar todas las monedas soportadas y conservar visible el código ISO para evitar símbolos ambiguos
- [ ] Reemplazar los condicionales y mapas rígidos que actualmente solo reconocen `UYU` y `USD`
- [ ] Adaptar el ordenamiento de materiales para agrupar precios por código de moneda sin depender de un mapa fijo de dos valores

## FASE 2: Persistir la moneda principal en Configuración

### Objetivo

Guardar una moneda principal estable y recuperar de forma segura configuraciones creadas antes de incorporar este campo.

- [ ] Agregar `monedaPrincipal` al dominio y al contrato persistido de Configuración
- [ ] Inicializar `monedaPrincipal` con `UYU` en instalaciones nuevas
- [ ] Migrar en memoria las configuraciones anteriores que no tengan el campo, asignándoles `UYU` sin modificar otros datos
- [ ] Validar que la moneda guardada pertenezca al catálogo soportado y usar `UYU` como recuperación segura cuando sea inválida
- [ ] Persistir la selección para conservarla al cerrar, recargar o actualizar la aplicación
- [ ] Mantener intactos los importes guardados de mano de obra y traslado al cambiar la moneda principal
- [ ] Mostrar una advertencia al cambiar la moneda principal para solicitar la revisión manual de las tarifas de mano de obra y del precio de traslado

## FASE 3: Crear la sección de moneda en Configuración

### Objetivo

Permitir seleccionar claramente la moneda principal desde una sección ubicada debajo de Traslado y encima de Métodos de pago.

- [ ] Crear la sección `Moneda principal` en la posición acordada del formulario de Configuración
- [ ] Agregar un selector buscable que muestre cada opción con el formato `Nombre de la moneda (CÓDIGO)`
- [ ] Priorizar visualmente las monedas de países hispanohablantes sin impedir el acceso al resto del catálogo acordado
- [ ] Explicar que la moneda elegida será la predeterminada para materiales, mano de obra, traslado y presupuestos nuevos
- [ ] Explicar que cambiarla no convierte ni modifica datos anteriores
- [ ] Mostrar la advertencia de revisión de mano de obra y traslado cuando la selección cambie respecto de la configuración cargada
- [ ] Incluir `monedaPrincipal` al guardar, normalizar y recuperar el formulario
- [ ] Mantener la sección accesible, legible y sin desbordes en móvil y escritorio

## FASE 4: Aplicar la moneda principal en Materiales

### Objetivo

Usar la moneda configurada como opción local predeterminada y conservar `USD` como alternativa fija en los precios de materiales.

- [ ] Cargar la Configuración antes de crear o editar materiales
- [ ] Inicializar cada precio nuevo con la moneda principal configurada en lugar de usar `UYU` de forma rígida
- [ ] Construir las opciones del selector con la moneda principal y `USD`
- [ ] Mostrar una sola opción `USD` cuando `USD` sea también la moneda principal
- [ ] Mostrar las opciones mediante nombre legible y código ISO, manteniendo el código como valor persistido
- [ ] Conservar la moneda original de todos los precios existentes al cargarlos o editarlos
- [ ] Permitir visualizar de forma segura una moneda histórica aunque ya no coincida con las dos opciones actuales
- [ ] Evitar que guardar otro cambio en un material convierta, reetiquete o elimine silenciosamente una moneda histórica
- [ ] Mantener los cálculos por presentación y cantidades parciales en la moneda propia de cada precio

## FASE 5: Aplicar la moneda principal en presupuestos nuevos

### Objetivo

Crear cada presupuesto nuevo en la moneda principal vigente y mantener independientes los presupuestos ya guardados.

- [ ] Inicializar la moneda general de un presupuesto nuevo con `monedaPrincipal`
- [ ] Crear las líneas iniciales de mano de obra y traslado con la moneda principal
- [ ] Aplicar la moneda principal a los materiales manuales y a las nuevas líneas de mano de obra agregadas dentro del ticket
- [ ] Mantener la moneda original de cada material seleccionado desde el catálogo
- [ ] Construir el selector inferior del ticket con la moneda principal y `USD`
- [ ] Mostrar únicamente `USD` cuando sea la moneda principal para evitar opciones duplicadas
- [ ] Mantener sin cambios la moneda general y las monedas de las líneas al abrir presupuestos guardados
- [ ] Garantizar que cambiar posteriormente la Configuración no altere presupuestos existentes, su PDF ni su mensaje de WhatsApp
- [ ] Adaptar recuperación, normalización, validación y persistencia para reconocer todas las monedas soportadas sin degradarlas a `UYU`

## FASE 6: Resolver incompatibilidades mediante confirmación manual

### Objetivo

Permitir que el usuario corrija una línea en otra moneda sin que la aplicación calcule ni suponga una cotización.

- [ ] Mantener marcado en rojo cada concepto cuya moneda sea distinta de la moneda general del presupuesto
- [ ] Mantener la línea incompatible excluida de todos los totales hasta que el usuario confirme la conversión
- [ ] Indicar claramente la moneda original de la línea y la moneda objetivo del presupuesto
- [ ] Explicar que el usuario debe calcular y editar manualmente el importe antes de confirmar
- [ ] Agregar a la línea incompatible el botón `Confirmar conversión a CÓDIGO`, usando la moneda actualmente seleccionada en el ticket
- [ ] Hacer que el botón cambie únicamente el código de moneda de esa copia de la línea, sin alterar el importe, las opciones de unidad ni el material del catálogo
- [ ] Usar el propio botón como confirmación explícita y evitar un selector de monedas o una conversión implícita al editar el importe
- [ ] Incluir la línea en los totales y retirar el aviso solamente después de confirmar la conversión
- [ ] Volver a detectar la incompatibilidad si posteriormente cambia la moneda general del ticket
- [ ] Ocultar la acción en presupuestos de solo lectura y conservar la moneda confirmada al guardar

## FASE 7: Integrar documentos, listados y mensajes

### Objetivo

Propagar el soporte ampliado de monedas a todas las salidas sin cambiar la lógica actual de los presupuestos.

- [ ] Mostrar correctamente las nuevas monedas en el listado y detalle de materiales
- [ ] Mostrar correctamente las nuevas monedas en el listado, detalle y vista previa de presupuestos
- [ ] Mantener los avisos por conceptos incompatibles en el documento del presupuesto
- [ ] Adaptar el PDF para formatear cualquier moneda soportada sin asumir el locale `es-UY` como única presentación posible
- [ ] Adaptar el mensaje de WhatsApp para conservar el código y los totales de la moneda del presupuesto
- [ ] Confirmar que las líneas incompatibles sigan excluidas de los totales del PDF, resumen y mensaje según la lógica vigente
- [ ] Confirmar que documentos generados desde presupuestos antiguos mantengan exactamente sus monedas persistidas

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano la configuración, persistencia, compatibilidad histórica y seguridad de los cálculos.

- [ ] Abrir una instalación sin configuración y verificar que `Peso uruguayo (UYU)` sea la moneda principal
- [ ] Seleccionar otra moneda, guardar, recargar la SPA y verificar que la selección persista
- [ ] Cerrar y volver a abrir la aplicación Android y verificar que la selección persista
- [ ] Comprobar que el selector de Configuración contiene todas las monedas acordadas y permite buscarlas por nombre o código
- [ ] Cambiar la moneda principal y verificar que aparezca la advertencia para revisar mano de obra y traslado
- [ ] Confirmar que cambiar la moneda principal no modifica los importes guardados de mano de obra ni traslado
- [ ] Crear un material nuevo y verificar que su precio comience en la moneda principal
- [ ] Agregar varios precios y comprobar que las únicas opciones normales sean la moneda principal y `USD`
- [ ] Configurar `USD` como moneda principal y verificar que Materiales y Ticket muestren una sola opción `USD`
- [ ] Abrir un material anterior en `UYU` después de elegir otra moneda principal y comprobar que conserve código e importe
- [ ] Editar otro campo de un material histórico y verificar que su moneda anterior no cambie silenciosamente
- [ ] Crear un presupuesto nuevo y comprobar que moneda general, mano de obra, traslado y conceptos manuales utilicen la moneda principal
- [ ] Agregar un material en `USD` a un presupuesto en otra moneda y verificar el aviso rojo y su exclusión de todos los totales
- [ ] Editar manualmente el importe incompatible y verificar que siga excluido hasta confirmar la conversión
- [ ] Pulsar `Confirmar conversión a CÓDIGO` y comprobar que el importe no cambie, la línea adopte la moneda del ticket y se incluya en el total
- [ ] Cambiar después la moneda general del ticket y verificar que la incompatibilidad vuelva a detectarse
- [ ] Confirmar que la conversión afecta únicamente a la copia dentro del presupuesto y no al material del catálogo
- [ ] Guardar y reabrir el presupuesto convertido y verificar que conserve la moneda confirmada
- [ ] Abrir presupuestos antiguos en `UYU` y `USD` y comprobar que no cambien monedas, importes ni totales
- [ ] Generar vista previa, PDF y mensaje de WhatsApp con distintas monedas y verificar códigos, formato y totales
- [ ] Verificar selectores, avisos, botón de confirmación y ausencia de desbordes en escritorio y móvil
- [ ] Ejecutar `npm run lint`
- [ ] Ejecutar `npm run typecheck`
- [ ] Ejecutar `npm run build`
- [ ] Ejecutar `npm run build:android`

## Progreso del plan

- [ ] Fase 1: Generalizar el dominio de monedas
- [ ] Fase 2: Persistir la moneda principal en Configuración
- [ ] Fase 3: Crear la sección de moneda en Configuración
- [ ] Fase 4: Aplicar la moneda principal en Materiales
- [ ] Fase 5: Aplicar la moneda principal en presupuestos nuevos
- [ ] Fase 6: Resolver incompatibilidades mediante confirmación manual
- [ ] Fase 7: Integrar documentos, listados y mensajes
- [ ] Fase Testing

Fecha de creación: 26 de Agosto 2026
Fecha de última actualización: 26 de Agosto 2026
Estado: BORRADOR
