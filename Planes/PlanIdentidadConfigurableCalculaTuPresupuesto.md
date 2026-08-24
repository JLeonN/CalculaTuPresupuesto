# PLAN IDENTIDAD CONFIGURABLE DE CALCULA TU PRESUPUESTO

## Descripción del plan

Preparar la identidad de la aplicación para su futura publicación en Play Store y para que cualquier profesional pueda usar sus propios datos empresariales. La aplicación tendrá el nombre fijo `Calcula tu presupuesto`; el nombre y el logo configurados representarán a la empresa del usuario dentro de la interfaz, el favicon web y los presupuestos creados desde ese momento.

El primer logo generado y seleccionado por Leo, guardado en `src/assets/LogoCalculaTuPresupuesto.png`, será la identidad predeterminada y fija del producto. Los presupuestos ya guardados no se migrarán ni se reescribirán.

## Objetivo principal

- Usar `Calcula tu presupuesto` como nombre público fijo de la aplicación web y Android.
- Reemplazar todas las referencias visibles a Mallic Tesla y Pablo por identidad configurable o textos universales.
- Mostrar de forma reactiva el nombre y el logo de la empresa configurada.
- Preparar favicon, íconos Android, splash y recurso gráfico para la futura publicación en Play Store.
- Mantener intactos los presupuestos guardados y los identificadores técnicos cuya migración tendrá un plan independiente.

## Reglas del plan

- No modificar `com.mallictesla.presupuestos`, las claves locales `mallic-tesla:*`, `package.name` ni la ruta pública `/MallicTesla/`.
- No publicar en Play Store desde este plan. Antes de la primera publicación se debe resolver la tarea pendiente sobre identificadores técnicos si se decide cambiar el `appId`, porque después quedará vinculado a la aplicación publicada.
- No instalar dependencias nuevas.
- Usar `src/assets/LogoCalculaTuPresupuesto.png` como archivo maestro del logo predeterminado.
- El ícono instalado, el splash y los recursos de Play Store usarán siempre la identidad fija de `Calcula tu presupuesto`; no intentarán cambiar según la empresa configurada.
- El logo empresarial configurado se aplicará solamente dentro de la interfaz, los documentos y el favicon del navegador.
- Mostrar `Presupuestos` como subtítulo del menú, sin usar la palabra `eléctricos`.
- Usar textos universales cuando mencionar el nombre empresarial no mejore la comprensión.
- No modificar ni migrar presupuestos guardados, aunque hayan sido creados como pruebas.
- No ejecutar `git add`, commit, tag ni push durante la implementación.

## FASE 1: Definir el contrato de identidad

### Objetivo

Centralizar la identidad fija del producto y calcular la identidad empresarial efectiva sin duplicar reglas.

- [ ] Crear `src/configuracion/identidadAplicacion.ts` como fuente única para el nombre `Calcula tu presupuesto`, el subtítulo `Presupuestos`, el logo predeterminado y el favicon predeterminado.
- [ ] Crear `src/composables/useIdentidadAplicacion.ts` para exponer de forma reactiva el nombre empresarial visible, el logo efectivo y el texto alternativo correspondiente.
- [ ] Resolver el nombre visible con esta prioridad: `configuracion.nombreEmpresa.trim()` y, si está vacío, `Calcula tu presupuesto`.
- [ ] Resolver el logo visible con esta prioridad: `configuracion.logo.datosUrl` y, si no existe, `LogoCalculaTuPresupuesto.png`.
- [ ] Generar el texto alternativo como `Logo de {nombre visible}` y evitar referencias fijas a Mallic Tesla.
- [ ] Agregar al store un indicador `configuracionCargada` y una acción idempotente `asegurarConfiguracionCargada()` para compartir una sola carga inicial y evitar lecturas simultáneas o repetidas.
- [ ] Mantener `cargarConfiguracion()` para recargas explícitas y asegurar que cualquier error deje un estado coherente y reintentable.

## FASE 2: Generalizar componentes y estilos de marca

### Objetivo

Eliminar nombres específicos de Mallic Tesla en los componentes reutilizables y mostrar correctamente logos de distintas proporciones.

- [ ] Reemplazar `LogoMallicTesla.vue` por `LogoEmpresa.vue` con propiedades tipadas para origen de imagen, texto alternativo y tamaño.
- [ ] Renombrar las clases CSS `.logo-mallic-tesla*` a nombres genéricos `.logo-empresa*` y actualizar todos sus consumidores.
- [ ] Renombrar `.aplicacion-mallic-tesla` a una clase genérica sin alterar el diseño actual.
- [ ] Mantener los tamaños reutilizables en `src/css/Variables.css` y usar `object-fit: contain` para no recortar logos cuadrados, horizontales o verticales.
- [ ] Sustituir las importaciones y usos del componente anterior en `MainLayout.vue` e `IndexPage.vue`.
- [ ] Retirar `LogoMallicTeslaOriginal.jpg` de los flujos visibles y de los respaldos del PDF, pero conservar el archivo histórico sin uso hasta que exista un plan de limpieza.
- [ ] Confirmar que ninguna clase, importación o atributo accesible quede apuntando al componente anterior.

## FASE 3: Aplicar la identidad reactiva en la interfaz web

### Objetivo

Mostrar la identidad configurada en todas las superficies generales y actualizarla al guardar Configuración.

- [ ] Cargar la Configuración mediante `asegurarConfiguracionCargada()` desde `MainLayout.vue` para disponer de la identidad en toda la navegación.
- [ ] Mostrar en el menú lateral el nombre empresarial efectivo y debajo el subtítulo fijo `Presupuestos`.
- [ ] Mostrar en el encabezado móvil el nombre empresarial efectivo sin agregar el subtítulo por falta de espacio.
- [ ] Mostrar el logo efectivo en el menú lateral, el encabezado móvil y la presentación de `IndexPage.vue`.
- [ ] Construir los `aria-label` del enlace de inicio con el nombre visible actual.
- [ ] Hacer que el nombre, logo y atributos accesibles cambien inmediatamente después de guardar Configuración, sin recargar la aplicación.
- [ ] Mostrar en el selector de Configuración el logo efectivo: el empresarial cuando exista y el predeterminado cuando no exista.
- [ ] Indicar claramente en el selector cuándo se está usando el logo predeterminado y mostrar `Quitar logo` únicamente para un logo empresarial guardado.
- [ ] Mantener las validaciones actuales de tipos JPG, PNG y WebP, límite de 1 MB y manejo de errores de lectura.

## FASE 4: Implementar título y favicon del navegador

### Objetivo

Mantener fijo el nombre del producto en la pestaña y reflejar allí el logo empresarial cuando corresponda.

- [ ] Cambiar `package.json.productName` a `Calcula tu presupuesto` para que `<title>` conserve siempre ese valor.
- [ ] Actualizar la descripción pública de `package.json` sin cambiar `package.name`.
- [ ] Crear `public/favicon-calcula-tu-presupuesto.png` a partir del logo maestro con tamaño 192 × 192 y transparencia conservada.
- [ ] Actualizar `index.html` para usar el favicon predeterminado nuevo durante la carga inicial.
- [ ] Implementar en `useIdentidadAplicacion.ts` la actualización de un único elemento `<link rel="icon">`, sin acumular etiquetas duplicadas.
- [ ] Usar el `datosUrl` y tipo MIME del logo empresarial como favicon cuando exista.
- [ ] Restaurar el favicon predeterminado al quitar el logo y aplicar nuevamente el logo empresarial después de recargar la página y cargar Configuración.
- [ ] Mantener el título `Calcula tu presupuesto` aunque cambien el nombre o el logo empresarial.

## FASE 5: Universalizar Configuración y mensajes

### Objetivo

Eliminar textos predeterminados ligados a Mallic Tesla o Pablo sin alterar contenido personalizado.

- [ ] Cambiar la introducción de `ConfiguracionPage.vue` por `Administrá los datos de tu empresa y sus valores habituales.`
- [ ] Cambiar la descripción de Identidad y contacto por `Guardá la información profesional y de contacto de tu empresa.`
- [ ] Cambiar `MENSAJE_FINAL_PREDETERMINADO` por `Gracias por confiar en nosotros. Quedamos a disposición por cualquier consulta.`
- [ ] Conservar una constante interna con el mensaje antiguo únicamente para reconocer la migración, sin usarla como contenido visible nuevo.
- [ ] Al cargar Configuración, sustituir el mensaje antiguo solo si coincide exactamente con `Gracias por confiar en Mallic Tesla. Quedamos a disposición por cualquier consulta.`.
- [ ] Persistir la configuración migrada una sola vez para que el mensaje antiguo no reaparezca, sin cambiar mensajes personalizados ni presupuestos guardados.
- [ ] Eliminar los respaldos fijos `Pablo` y `Mallic Tesla` de `crearMensajePresupuestoWhatsapp()`.
- [ ] Construir el inicio del mensaje de WhatsApp según cuatro casos: responsable y empresa, solo responsable, solo empresa, o ninguno.
- [ ] Usar una redacción natural y sin nombres inventados en los cuatro casos.
- [ ] Mantener intactos el destinatario, fecha, importes, resumen y cierre actual del mensaje de WhatsApp.

## FASE 6: Aplicar la identidad a presupuestos nuevos

### Objetivo

Usar la identidad vigente al crear un presupuesto y conservar la identidad almacenada en presupuestos anteriores.

- [ ] Reemplazar en `DocumentoPresupuesto.vue` los respaldos fijos por las constantes de identidad predeterminada.
- [ ] Mostrar en el PDF el nombre configurado o `Calcula tu presupuesto` cuando no exista nombre empresarial.
- [ ] Mostrar en el PDF el logo empresarial guardado en `configuracionDocumento` o el logo predeterminado cuando sea nulo.
- [ ] Verificar que `crearConfiguracionDocumento()` clone nombre, responsable, teléfono, correo, dirección, RUT, logo, mensaje, métodos de pago y redes sociales.
- [ ] Capturar esa copia al inicializar cada presupuesto nuevo y conservarla al guardar, previsualizar, descargar y enviar.
- [ ] Mantener la copia existente al abrir o editar un presupuesto guardado, sin sustituirla por la Configuración actual.
- [ ] Usar la Configuración actual como respaldo solamente en un presupuesto nuevo o en un registro antiguo que no contenga `configuracionDocumento`.
- [ ] No recorrer, reescribir ni migrar el repositorio de presupuestos existente.
- [ ] Confirmar que el nombre y el logo modificados afecten la interfaz general inmediatamente y los documentos únicamente desde los presupuestos creados después del cambio.

## FASE 7: Preparar identidad Android y Play Store

### Objetivo

Dejar el proyecto Android identificado visualmente como `Calcula tu presupuesto` sin cambiar su identificador técnico.

- [ ] Cambiar `appName` en `src-capacitor/capacitor.config.ts` a `Calcula tu presupuesto` y conservar `appId` sin modificaciones.
- [ ] Actualizar `app_name` y `title_activity_main` en `src-capacitor/android/app/src/main/res/values/strings.xml` sin modificar `package_name` ni `custom_url_scheme`.
- [ ] Generar desde el logo maestro los íconos normal, redondo, foreground y adaptativo para todas las densidades Android existentes.
- [ ] Respetar la zona segura de los íconos adaptativos para evitar que el documento, la calculadora o la marca de verificación queden recortados por las máscaras del launcher.
- [ ] Usar un fondo coherente con la identidad visual actual y documentar en los recursos nativos cualquier color que deba duplicarse fuera de `Variables.css`.
- [ ] Reemplazar el splash genérico de Capacitor en todas las orientaciones y densidades por una composición centrada del logo predeterminado.
- [ ] Mantener el ícono Android y el splash independientes del logo empresarial configurado por cada usuario.
- [ ] Crear `RecursosPublicacion/PlayStore/icono-calcula-tu-presupuesto-512.png` desde el logo maestro, con 512 × 512 px, zona segura y sin una máscara redondeada incorporada.
- [ ] Comprobar que el recurso de Play Store no supere 1 MB y conserve una lectura clara a tamaños pequeños.
- [ ] Ejecutar la sincronización o compilación de Capacitor necesaria para verificar que los recursos nativos no sean sobrescritos por valores antiguos.

## FASE 8: Actualizar documentación y controlar referencias antiguas

### Objetivo

Dejar la documentación coherente con una aplicación distribuible sin romper identificadores existentes.

- [ ] Actualizar el título y la descripción general de `README.md` a `Calcula tu presupuesto`.
- [ ] Documentar el logo predeterminado nuevo y retirar la indicación de que el logo de Mallic Tesla será el ícono futuro.
- [ ] Sustituir las referencias futuras a una única identidad autorizada de Pablo por una arquitectura multiusuario con aislamiento por cuenta, sin implementar Firebase en este plan.
- [ ] Retirar referencias documentales a decisiones visuales pendientes de Pablo cuando ya no representen el estado actual.
- [ ] Conservar documentadas la ruta pública `/MallicTesla/`, el `appId` y otras referencias técnicas que todavía no se migrarán.
- [ ] Buscar `Mallic`, `Tesla`, `Pablo` y `eléctricos` en archivos de ejecución y confirmar que no queden como textos visibles.
- [ ] Clasificar cada coincidencia restante como identificador técnico preservado, recurso histórico sin uso, documentación de compatibilidad o texto de migración exacta.
- [ ] Confirmar que ninguna coincidencia restante pueda mostrarse a un usuario nuevo o incorporarse a un presupuesto nuevo.

## FASE TESTING

### Objetivo

Validar en una instalación limpia y con datos de prueba existentes que la identidad pública, la personalización y los recursos de publicación funcionen sin regresiones.

- [ ] Ejecutar la SPA con almacenamiento limpio y comprobar `Calcula tu presupuesto`, `Presupuestos` y el logo predeterminado en menú, encabezado móvil, inicio, Configuración, favicon y presupuesto nuevo.
- [ ] Confirmar que la pestaña mantenga el título `Calcula tu presupuesto` durante toda la navegación.
- [ ] Guardar un nombre empresarial sin logo y comprobar el cambio inmediato del nombre conservando el logo predeterminado.
- [ ] Guardar logos JPG, PNG y WebP válidos y comprobar su visualización sin recortes en menú, móvil, inicio, Configuración, favicon y PDF nuevo.
- [ ] Intentar cargar un formato no permitido y un archivo mayor de 1 MB, y comprobar que se mantengan los mensajes de validación y la identidad anterior.
- [ ] Quitar el logo empresarial, guardar y comprobar la restauración inmediata del logo y favicon predeterminados.
- [ ] Recargar el navegador y comprobar que el nombre y favicon empresariales se restauren después de cargar Configuración sin duplicar etiquetas `<link rel="icon">`.
- [ ] Verificar la migración del mensaje antiguo exacto y confirmar que un mensaje personalizado parecido no sea modificado.
- [ ] Crear un presupuesto antes de cambiar la identidad, cambiar nombre y logo, y comprobar que el presupuesto guardado conserve su copia anterior.
- [ ] Crear otro presupuesto después del cambio y comprobar la identidad nueva en detalle, vista previa, PDF descargado y envío por WhatsApp.
- [ ] Abrir un presupuesto antiguo sin `configuracionDocumento` y comprobar que use el respaldo vigente sin reescribirlo automáticamente.
- [ ] Probar el inicio del mensaje de WhatsApp con responsable y empresa, solo responsable, solo empresa y ninguno; confirmar que nunca aparezcan `Pablo` ni `Mallic Tesla`.
- [ ] Revisar visualmente el logo predeterminado y un logo empresarial horizontal y vertical en escritorio y ancho móvil.
- [ ] Ejecutar `npm run lint:check`.
- [ ] Ejecutar `npm run typecheck`.
- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar `npm run build:android`.
- [ ] Instalar el APK de prueba y comprobar nombre, ícono adaptativo, ícono redondo, splash, inicio y navegación en un dispositivo Android.
- [ ] Verificar que el APK conserve el identificador `com.mallictesla.presupuestos` y que los datos de prueba existentes sigan accesibles.
- [ ] Verificar dimensiones, peso, transparencia, zona segura y legibilidad del recurso de 512 × 512 preparado para Play Store.
- [ ] Ejecutar la búsqueda final de referencias antiguas y documentar las coincidencias técnicas permitidas.

## Progreso del plan

- [ ] Fase 1: Definir el contrato de identidad
- [ ] Fase 2: Generalizar componentes y estilos de marca
- [ ] Fase 3: Aplicar la identidad reactiva en la interfaz web
- [ ] Fase 4: Implementar título y favicon del navegador
- [ ] Fase 5: Universalizar Configuración y mensajes
- [ ] Fase 6: Aplicar la identidad a presupuestos nuevos
- [ ] Fase 7: Preparar identidad Android y Play Store
- [ ] Fase 8: Actualizar documentación y controlar referencias antiguas
- [ ] Fase Testing

Fecha de creación: 24 de Agosto 2026
Fecha de última actualización: 24 de Agosto 2026
Estado: BORRADOR
