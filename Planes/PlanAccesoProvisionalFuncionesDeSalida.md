# PLAN DE ACCESO PROVISIONAL Y FUNCIONES DE SALIDA

## Descripción del plan

Incorporar un acceso provisional para la etapa de pruebas de la aplicación. Toda persona podrá recorrer la aplicación, crear y guardar clientes, materiales, configuración y presupuestos en el almacenamiento local existente. Las funciones profesionales de salida de presupuestos —descargar PDF, imprimir y enviar— requerirán una sesión iniciada.

El acceso se presentará mediante un candado pequeño y discreto en la esquina superior derecha de la tarjeta principal de Inicio. Al pulsarlo sin sesión se abrirá un modal con usuario y contraseña e icono de llave. Con una sesión activa se mostrará un candado abierto y un menú que identificará al usuario y permitirá cerrar sesión.

Esta etapa no instalará ni utilizará Firebase. Las credenciales de prueba serán proporcionadas por Leo mediante `.env.local`, nunca se escribirán en código ni en archivos versionados. El diseño técnico aislará la autenticación detrás de un contrato reemplazable para incorporar Firebase Authentication en un plan posterior. Como las variables quedan incluidas en la SPA y el APK compilados, este mecanismo es solamente una restricción provisional de producto y no una medida de seguridad apta para producción.

## Objetivo principal

- Permitir el uso completo de los módulos locales sin iniciar sesión.
- Reservar la descarga, impresión y envío de presupuestos para una sesión autenticada.
- Mostrar una marca de agua `VERSIÓN DE PRUEBA` en los documentos visibles sin sesión.
- Mantener disponibles los enlaces comunes de WhatsApp del módulo Clientes.
- Persistir la sesión de prueba hasta que el usuario la cierre expresamente.
- Preparar una frontera técnica que permita sustituir el proveedor provisional por Firebase sin rehacer la interfaz.
- Evitar que credenciales reales o de prueba entren al historial de Git.

## Contexto técnico verificado

- El proyecto usa Quasar CLI con Vue 3, TypeScript estricto, Vite, Vue Router, Pinia y Composition API mediante `<script setup>`.
- La misma base se compila como SPA web y aplicación Android mediante Capacitor.
- Firebase no está instalado y `README.md` reserva su incorporación para un plan independiente.
- Los datos de clientes, materiales, presupuestos y configuración se guardan localmente mediante contratos asíncronos y `crearAlmacenamientoAplicacion()`.
- En navegador se usa `localStorage`; en Android se usa `@capacitor/preferences`.
- La portada está en `src/pages/IndexPage.vue`; la tarjeta principal usa `.presentacion-inicio` y ya distribuye contenido y logo en dos columnas.
- Las acciones de descarga y envío existen tanto en `src/pages/NuevoPresupuestoPage.vue` como en `src/pages/VistaPreviaPresupuestoPage.vue`.
- La impresión directa existe en `VistaPreviaPresupuestoPage.vue` mediante `window.print()` y `src/css/app.css` contiene reglas específicas `@media print`.
- `src/servicios/documentos/accionesPresupuesto.ts` centraliza la generación, descarga y envío del PDF.
- Los enlaces de WhatsApp de Clientes usan `src/components/clientes/EnlaceWhatsapp.vue` y no forman parte de la salida restringida.
- `.gitignore` excluye `.env*` y permite únicamente `.env.example`.
- Quasar expone al cliente las variables con prefijo `QCLI_`; sus valores quedan incorporados al código compilado y no deben considerarse secretos.
- No existe un framework de pruebas automatizadas unitarias configurado. Las validaciones ejecutables actuales son lint, TypeScript y compilaciones SPA/Android.

## Alcance

### Incluye

- Proveedor provisional de autenticación con usuario y contraseña recibidos desde variables de entorno.
- Sesión persistente común para SPA y Android mediante el almacenamiento existente.
- Store Pinia de autenticación y permiso explícito para producir salidas de presupuestos.
- Inicialización de la sesión antes de renderizar la interfaz.
- Candado discreto en Inicio, modal de acceso, estado autenticado y cierre de sesión.
- Botones de salida visibles pero bloqueados mediante el modal cuando no existe sesión.
- Marca de agua en la vista previa sin sesión.
- Protección de la impresión iniciada desde el botón, `Ctrl+P` o el menú del navegador.
- Preparación estructural para sustituir el proveedor provisional por Firebase.

### No incluye

- Instalar, configurar o conectar Firebase Authentication, Firestore, Cloud Storage o App Check.
- Crear registro público, recuperación de contraseña o administración de usuarios.
- Guardar el usuario o la contraseña de prueba en archivos versionados.
- Proteger las credenciales dentro del bundle cliente; esta limitación no puede resolverse sin autenticación remota.
- Aislar datos por cuenta ni migrar el almacenamiento local a Firestore.
- Bloquear la creación, edición, eliminación o consulta de datos locales a visitantes.
- Bloquear los enlaces comunes de WhatsApp usados para contactar clientes.
- Impedir capturas de pantalla del sistema operativo.
- Implementar pagos, suscripciones, licencias, vencimientos o roles comerciales.

## Decisiones funcionales confirmadas

- Una persona sin sesión puede usar todos los módulos y guardar información local.
- Descargar PDF, imprimir y enviar un presupuesto requieren sesión.
- La vista previa permanece accesible sin sesión, pero muestra `VERSIÓN DE PRUEBA`.
- Los controles restringidos permanecen visibles y señalan el bloqueo; al pulsarlos abren el modal.
- El icono de Inicio será un candado cerrado sin sesión y un candado abierto con sesión.
- El modal mostrará un icono de llave.
- El usuario autenticado podrá cerrar sesión desde el control de Inicio.
- Cerrar sesión no elimina clientes, materiales, presupuestos ni configuración.
- Los enlaces comunes de WhatsApp en Clientes siguen disponibles sin sesión.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `.env.example` | Modificar | `QCLI_USUARIO_PRUEBA`, `QCLI_CONTRASENA_PRUEBA` | Documentar el contrato sin valores. |
| `env.d.ts` | Modificar | `ImportMetaEnv` | Tipar las variables provisionales. |
| `src/configuracion/clavesAlmacenamiento.ts` | Modificar | `CLAVES_ALMACENAMIENTO.sesionPrueba` | Persistir únicamente el estado de sesión. |
| `src/dominio/autenticacion.ts` | Crear | `CredencialesAcceso`, `UsuarioAutenticado`, `ErrorAccesoProvisional` | Definir contratos de dominio y errores previsibles. |
| `src/servicios/autenticacion/ServicioAutenticacion.ts` | Crear | `ServicioAutenticacion` | Aislar el proveedor de autenticación. |
| `src/servicios/autenticacion/ServicioAutenticacionPrueba.ts` | Crear | `ServicioAutenticacionPrueba` | Validar credenciales de entorno y persistir la sesión local. |
| `src/servicios/autenticacion/crearServicioAutenticacion.ts` | Crear | `crearServicioAutenticacion` | Seleccionar el proveedor actual y marcar el futuro reemplazo por Firebase. |
| `src/stores/autenticacion.ts` | Crear | `useAutenticacionStore` | Centralizar sesión, permiso de salida y apertura del modal. |
| `src/boot/autenticacion.ts` | Crear | boot de autenticación | Restaurar la sesión antes de montar la interfaz. |
| `quasar.config.ts` | Modificar | `boot` | Registrar la inicialización de autenticación. |
| `src/components/autenticacion/ModalInicioSesion.vue` | Crear | formulario de acceso | Permitir iniciar sesión sin abandonar la pantalla actual. |
| `src/components/autenticacion/BotonSesion.vue` | Crear | control de sesión | Mostrar candado cerrado/abierto y permitir cerrar sesión. |
| `src/App.vue` | Modificar | `ModalInicioSesion` | Montar un único modal global reutilizable. |
| `src/pages/IndexPage.vue` | Modificar | `BotonSesion` | Ubicar el acceso discreto en la tarjeta principal. |
| `src/components/presupuestos/DocumentoPresupuesto.vue` | Modificar | prop `modoPrueba` | Renderizar la marca de agua sin acoplar el documento al store. |
| `src/pages/NuevoPresupuestoPage.vue` | Modificar | acciones `descargar` y `enviar` | Exigir sesión antes de iniciar salidas o efectos secundarios. |
| `src/pages/VistaPreviaPresupuestoPage.vue` | Modificar | `imprimir`, `descargar`, `enviarPorWhatsapp` | Restringir las tres salidas y aplicar la marca de agua. |
| `src/servicios/documentos/accionesPresupuesto.ts` | Modificar | `OpcionesAccionDocumentoPresupuesto`, validación de permiso | Evitar generar una salida si un consumidor omite la validación visual. |
| `src/css/Variables.css` | Modificar | variables semánticas nuevas | Centralizar tamaño, opacidad y posición del acceso y la marca. |
| `src/css/app.css` | Modificar | estilos de autenticación, documento y `@media print` | Resolver diseño responsive y bloqueo de impresión directa. |
| `README.md` | Modificar | arquitectura provisional | Documentar alcance, configuración local y limitaciones. |

## FASE 1: Definir autenticación provisional y configuración segura

### Objetivo

Crear un proveedor local reemplazable, sin credenciales versionadas y sin instalar Firebase.

### Archivos y símbolos involucrados

- `.env.example`: variables vacías del acceso provisional.
- `env.d.ts`: `ImportMetaEnv`.
- `src/dominio/autenticacion.ts`: contratos y errores nuevos.
- `src/servicios/autenticacion/ServicioAutenticacion.ts`: interfaz nueva.
- `src/servicios/autenticacion/ServicioAutenticacionPrueba.ts`: implementación nueva.
- `src/servicios/autenticacion/crearServicioAutenticacion.ts`: fábrica nueva.

### Pasos de ejecución

- [ ] Actualizar `.env.example` para declarar, sin valores, `QCLI_USUARIO_PRUEBA` y `QCLI_CONTRASENA_PRUEBA`.
  - Explicar mediante comentarios que los valores reales deben colocarse únicamente en `.env.local`.
  - Advertir que las variables se incorporan a la aplicación cliente y sirven solo durante las pruebas.
  - No incluir ejemplos que reproduzcan las credenciales elegidas por Leo.
- [ ] Ampliar `ImportMetaEnv` en `env.d.ts` con ambas propiedades `readonly` de tipo `string`.
- [ ] Crear `src/dominio/autenticacion.ts` como fuente de tipos independientes de Firebase.
  - Definir `CredencialesAcceso` con `usuario: string` y `contrasena: string`.
  - Definir `UsuarioAutenticado` con `id: string`, `nombre: string` y `proveedor: 'prueba'`.
  - Definir `ErrorAccesoProvisional` con códigos discriminables para `credenciales-invalidas` y `configuracion-ausente`.
  - Mantener mensajes genéricos que no revelen cuál campo fue incorrecto ni los valores configurados.
- [ ] Crear `ServicioAutenticacion` con una API asíncrona reemplazable.
  - `obtenerUsuarioActual(): Promise<UsuarioAutenticado | null>`.
  - `iniciarSesion(credenciales: CredencialesAcceso): Promise<UsuarioAutenticado>`.
  - `cerrarSesion(): Promise<void>`.
  - No incorporar tipos, imports ni conceptos propios de Firebase al contrato.
- [ ] Crear `ServicioAutenticacionPrueba` e inyectarle `AlmacenamientoClaveValor`, usuario configurado y contraseña configurada.
  - Normalizar solamente el usuario con `trim()` y comparación insensible a mayúsculas/minúsculas.
  - Comparar la contraseña exactamente, sin recortarla ni transformarla.
  - Fallar de forma cerrada con `configuracion-ausente` si cualquiera de las variables está vacía.
  - No registrar credenciales en consola, errores, almacenamiento ni notificaciones.
  - Persistir únicamente un objeto de sesión mínimo que pueda validarse al recuperar; nunca persistir la contraseña.
  - Usar un identificador estable de prueba que no dependa del nombre visible y permita migrar luego el contrato a un `uid` remoto.
- [ ] Crear `crearServicioAutenticacion()` reutilizando `crearAlmacenamientoAplicacion()` y leyendo `import.meta.env.QCLI_USUARIO_PRUEBA` e `import.meta.env.QCLI_CONTRASENA_PRUEBA`.
  - Mantener en esta fábrica el único punto de selección del proveedor.
  - Agregar un `TODO(firebase)` concreto que indique sustituir la implementación, no el contrato ni los consumidores.
  - No instalar dependencias nuevas.

## FASE 2: Persistir e inicializar la sesión global

### Objetivo

Restaurar la sesión en SPA y Android antes de que la interfaz decida permisos, sin afectar los repositorios de datos existentes.

### Archivos y símbolos involucrados

- `src/configuracion/clavesAlmacenamiento.ts`: `CLAVES_ALMACENAMIENTO`.
- `src/stores/autenticacion.ts`: `useAutenticacionStore`.
- `src/boot/autenticacion.ts`: inicialización nueva.
- `quasar.config.ts`: `boot`.

### Pasos de ejecución

- [ ] Agregar `sesionPrueba: 'calcula-tu-presupuesto:sesion-prueba:v1'` a `CLAVES_ALMACENAMIENTO`.
  - No crear una clave histórica porque este estado no existe en versiones anteriores.
  - No mezclar la sesión con clientes, materiales, presupuestos o configuración.
- [ ] Crear `useAutenticacionStore` con estado y acciones tipadas.
  - Estado: `usuario`, `cargando`, `inicializada`, `error` y `modalInicioSesionVisible`.
  - Computed `estaAutenticado` basado en la existencia de `usuario`.
  - Computed `puedeGenerarSalidaPresupuesto` como permiso único para descargar, imprimir y enviar.
  - Acción `inicializarSesion()` idempotente que recupere el usuario persistido una sola vez.
  - Acción `iniciarSesion(credenciales)` que delegue en el servicio, actualice el usuario y cierre el modal únicamente al completar con éxito.
  - Acción `cerrarSesion()` que elimine solo la sesión y conserve todos los datos funcionales.
  - Acciones `solicitarInicioSesion()` y `cerrarModalInicioSesion()` para que cualquier pantalla invoque el único modal global.
  - Convertir errores técnicos en mensajes naturales sin revelar datos configurados.
- [ ] Crear `src/boot/autenticacion.ts` mediante el helper de boot de Quasar.
  - Obtener `useAutenticacionStore(store)` usando la instancia Pinia provista por Quasar.
  - Esperar `inicializarSesion()` antes de continuar el montaje.
  - Si la recuperación local falla, continuar como visitante y mantener un mensaje controlado; no bloquear el arranque completo.
- [ ] Registrar `autenticacion` en el arreglo `boot` de `quasar.config.ts`.
  - Comprobar que no aparezca un parpadeo de botones habilitados mientras se restaura la sesión.

## FASE 3: Crear el acceso discreto y el modal reutilizable

### Objetivo

Incorporar el acceso visual acordado en Inicio y un único modal que pueda abrirse también desde funciones restringidas.

### Archivos y símbolos involucrados

- `src/components/autenticacion/ModalInicioSesion.vue`: componente nuevo.
- `src/components/autenticacion/BotonSesion.vue`: componente nuevo.
- `src/App.vue`: integración global.
- `src/pages/IndexPage.vue`: ubicación del candado.
- `src/css/Variables.css` y `src/css/app.css`: estilos y estados responsive.

### Pasos de ejecución

- [ ] Crear `ModalInicioSesion.vue` con responsabilidad exclusiva sobre el formulario de acceso.
  - Consumir `useAutenticacionStore` y enlazar su apertura a `modalInicioSesionVisible`.
  - Usar `q-dialog`, `q-card` y `q-form` con campos `Usuario` y `Contraseña`.
  - Mostrar `key` como icono principal del modal.
  - Usar `autocomplete="username"` y `autocomplete="current-password"`.
  - Incluir control accesible para mostrar u ocultar la contraseña sin cambiar su valor.
  - Validar campos obligatorios en cliente, desactivar dobles envíos y mostrar carga mientras se autentica.
  - Limpiar siempre la contraseña al cancelar, cerrar o completar el acceso; no prellenar ninguna credencial.
  - Mantener el usuario escrito después de un error para facilitar la corrección.
  - Enfocar el campo de usuario al abrir y permitir enviar con Enter.
  - Mostrar un único error genérico para credenciales inválidas y uno específico de configuración solo cuando falten variables.
- [ ] Crear `BotonSesion.vue` para representar el estado en la portada.
  - Sin sesión: botón pequeño, plano y de bajo contraste con icono `lock` y etiqueta accesible `Iniciar sesión`.
  - Al pulsarlo, llamar `solicitarInicioSesion()`.
  - Con sesión: usar `lock_open` y etiqueta accesible que identifique la sesión activa.
  - Al pulsarlo autenticado, abrir un `q-menu` con el nombre del usuario y la acción `Cerrar sesión`.
  - Confirmar visualmente el cierre mediante `Notify`, sin borrar información local ni navegar fuera de Inicio.
- [ ] Montar `ModalInicioSesion` una sola vez en `src/App.vue`, junto a `ModalActualizacion`.
  - Evitar duplicar formularios o estados en las páginas que restringen acciones.
- [ ] Integrar `BotonSesion` en `IndexPage.vue` dentro de `.presentacion-inicio`.
  - Ubicarlo en la esquina superior derecha del recuadro, en el área señalada por Leo.
  - Mantener el logo en su posición actual y evitar que el botón altere la grilla o el ancho del contenido.
  - Conservar orden de tabulación, foco visible y área táctil suficiente aunque el icono sea visualmente discreto.
- [ ] Agregar variables semánticas necesarias en `Variables.css` para tamaño visual, separación y opacidad del acceso.
  - Reutilizar colores, radios, duraciones y alturas táctiles existentes siempre que alcancen.
  - No codificar colores ni medidas repetibles directamente en el componente.
- [ ] Agregar estilos en `app.css` para escritorio, `1023px`, `767px` y teléfonos estrechos.
  - Impedir superposición con el logo o el título.
  - Mantener el candado en la esquina superior derecha tanto en la grilla de escritorio como cuando el logo pasa a la primera fila en móvil.
  - Hacer que el modal use el ancho disponible sin producir desplazamiento horizontal.

## FASE 4: Centralizar el permiso de salida de presupuestos

### Objetivo

Evitar que una acción restringida genere, guarde como efecto secundario, descargue o comparta un documento antes de verificar la sesión.

### Archivos y símbolos involucrados

- `src/servicios/documentos/accionesPresupuesto.ts`: opciones y validación central.
- `src/pages/NuevoPresupuestoPage.vue`: descarga y envío.
- `src/pages/VistaPreviaPresupuestoPage.vue`: descarga, impresión y envío.

### Pasos de ejecución

- [ ] Ampliar `OpcionesAccionDocumentoPresupuesto` con `permitirSalida: boolean` obligatorio.
  - Validar el permiso al comienzo de `descargarDocumentoPresupuesto()` y `enviarDocumentoPresupuesto()`.
  - Lanzar un error de acceso distinguible antes de abrir WhatsApp, ejecutar `antesDeGenerar`, guardar cambios pendientes o generar el PDF.
  - Mantener la verificación aunque las pantallas también protejan los botones, para evitar omisiones de futuros consumidores.
  - Actualizar todos los consumidores detectados por búsqueda global; no asignar un valor predeterminado permisivo.
- [ ] Integrar `useAutenticacionStore` en `NuevoPresupuestoPage.vue`.
  - Antes de `descargarPresupuesto()` o `enviarPresupuesto()`, comprobar `puedeGenerarSalidaPresupuesto`.
  - Sin permiso, abrir el modal y terminar la función sin guardar automáticamente el presupuesto ni crear PDF.
  - Con permiso, pasar `permitirSalida: true` desde el computed del store a la capa de servicio.
  - Mantener los botones visibles para visitantes y agregar una señal de candado sin quitar los iconos funcionales existentes.
  - No bloquear guardar, editar, cambiar estado ni abrir la vista previa.
- [ ] Integrar el mismo store en `VistaPreviaPresupuestoPage.vue`.
  - Aplicar la comprobación a `descargar()`, `imprimir()` y `enviarPorWhatsapp()`.
  - Sin permiso, abrir el modal y no ejecutar `window.print()`, generación de PDF, guardado pendiente ni apertura externa.
  - Con permiso, conservar exactamente los flujos web y Android actuales.
  - Mantener `Volver` y la vista previa disponibles para visitantes.
- [ ] Diferenciar visualmente las acciones restringidas sin presentarlas como deshabilitadas permanentemente.
  - Permitir pulsarlas para abrir el modal.
  - No usar `disable` por falta de sesión, porque impediría comunicar el motivo; conservar `disable` para carga, datos faltantes y condiciones funcionales actuales.
  - Agregar etiquetas accesibles que indiquen que la acción requiere iniciar sesión.
- [ ] Confirmar mediante búsqueda global que no existan otros consumidores capaces de llamar descarga, impresión o envío de presupuestos sin validar el permiso.
- [ ] No modificar `EnlaceWhatsapp.vue`, `ClientesPage.vue` ni `ClienteDetallePage.vue`; esos enlaces permanecen públicos según la decisión funcional.

## FASE 5: Aplicar marca de agua y proteger la impresión directa

### Objetivo

Permitir que el visitante evalúe el documento completo sin obtener una salida limpia mediante la vista previa o la función de impresión del navegador.

### Archivos y símbolos involucrados

- `src/components/presupuestos/DocumentoPresupuesto.vue`: `modoPrueba`.
- `src/pages/NuevoPresupuestoPage.vue`: documento oculto de exportación.
- `src/pages/VistaPreviaPresupuestoPage.vue`: documento visible y aviso imprimible.
- `src/layouts/MainLayout.vue`: clase de estado de sesión.
- `src/css/Variables.css` y `src/css/app.css`: marca y reglas de impresión.

### Pasos de ejecución

- [ ] Agregar a `DocumentoPresupuesto.vue` la prop opcional `modoPrueba?: boolean` con valor predeterminado `false`.
  - Mantener el componente independiente de Pinia y de cualquier proveedor de autenticación.
  - Aplicar una clase modificadora cuando la prop sea verdadera.
  - Renderizar una marca semántica con texto `VERSIÓN DE PRUEBA`, marcada como decorativa para lectores de pantalla si no aporta información operativa.
  - Colocar la marca por encima del fondo pero sin bloquear selección, desplazamiento ni interacción mediante `pointer-events: none`.
- [ ] Pasar `:modo-prueba="!autenticacionStore.estaAutenticado"` desde la vista previa y desde cualquier instancia usada para generar salidas.
  - Un usuario autenticado debe obtener un documento sin marca.
  - Un visitante nunca debe generar un documento limpio aunque un flujo visual futuro omita el bloqueo.
- [ ] Agregar en `MainLayout.vue` una clase modificadora derivada de la sesión, por ejemplo `aplicacion-presupuestos--modo-prueba`.
  - Usarla como contexto CSS para impresión sin mutar manualmente clases globales de `document`.
- [ ] Agregar en `VistaPreviaPresupuestoPage.vue` un aviso específico para impresión restringida.
  - Permanecer oculto en pantalla.
  - Mostrar al imprimir sin sesión un mensaje que indique que debe iniciar sesión para imprimir el presupuesto.
- [ ] Ajustar `@media print` en `app.css` para cubrir `Ctrl+P` y la impresión desde el menú del navegador.
  - En modo prueba, ocultar el documento y mostrar únicamente el aviso de acceso requerido.
  - Con sesión, conservar las reglas A4 actuales sin alterar márgenes, tablas ni saltos.
  - No depender exclusivamente del manejador `imprimir()` porque el navegador permite iniciar impresión externamente.
- [ ] Centralizar en `Variables.css` la opacidad, tamaño y rotación reutilizables de la marca.
  - Garantizar contraste visible sobre el documento claro sin volver ilegibles los datos.
  - Mantener la marca centrada y adaptada a escritorio, móvil y papel A4.

## FASE 6: Documentar operación provisional y futura migración

### Objetivo

Dejar instrucciones suficientes para ejecutar pruebas sin filtrar credenciales y evitar que el mecanismo provisional se publique como seguridad definitiva.

### Archivos y símbolos involucrados

- `README.md`: configuración y advertencias.
- `.env.example`: contrato ya agregado.
- Fábrica y servicio de autenticación: puntos de sustitución futura.

### Pasos de ejecución

- [ ] Agregar al `README.md` una sección breve de acceso provisional.
  - Indicar que Leo debe crear manualmente `C:/Z-Programacion/Quasar/MallicTesla/.env.local`.
  - Mostrar únicamente los nombres vacíos de las variables, nunca sus valores.
  - Indicar que debe reiniciarse el servidor de desarrollo o recompilar la aplicación después de cambiar variables.
  - Explicar que el usuario no autenticado puede trabajar localmente, pero no producir salidas de presupuestos.
  - Advertir que la autenticación cliente es descubrible y debe sustituirse por Firebase antes de comercializar la aplicación.
- [ ] Documentar que Firebase sustituirá `ServicioAutenticacionPrueba` mediante `crearServicioAutenticacion()`.
  - Mantener `useAutenticacionStore`, modal, botón y consumidores basados en el contrato común.
  - Reservar para el plan de Firebase el registro de cuentas, estado activo, aislamiento por `uid`, reglas remotas y revocación de acceso.
- [ ] Verificar que `git status` nunca muestre `.env.local` y que ninguna búsqueda del repositorio encuentre los valores elegidos por Leo.

## FASE TESTING

### Objetivo

Validar el acceso provisional, la persistencia, las restricciones de salida, la marca de agua y el comportamiento responsive en SPA y Android.

### Preparación segura

- [ ] Crear manualmente `.env.local` con las dos variables requeridas y los valores suministrados por Leo, sin agregarlas a Git.
- [ ] Reiniciar el servidor de desarrollo después de crear o cambiar `.env.local`.
- [ ] Ejecutar `git check-ignore .env.local` y comprobar que Git lo ignora.
- [ ] Ejecutar una búsqueda de las credenciales de prueba en archivos versionados y confirmar que no aparecen.
- [ ] Probar el arranque con variables ausentes y comprobar que la app funciona como visitante, muestra un error de configuración controlado al intentar entrar y no concede permisos.

### Pruebas automatizadas

- [ ] Ejecutar `npm run lint` y corregir cualquier problema de formato o ESLint.
- [ ] Ejecutar `npm run typecheck` y comprobar que contratos, props y variables de entorno cumplen TypeScript estricto.
- [ ] Ejecutar `npm run build` con variables de prueba configuradas y comprobar la compilación SPA.
- [ ] Ejecutar `npm run build:android` con las mismas variables y comprobar la compilación Capacitor.
- [ ] Ejecutar búsquedas globales de `descargarDocumentoPresupuesto`, `enviarDocumentoPresupuesto`, `window.print` y `generarPdfPresupuesto` para verificar que todos los puntos de salida están cubiertos.

### Pruebas manuales como visitante

- [ ] Abrir una instalación sin sesión y comprobar el candado cerrado en la esquina acordada de Inicio.
- [ ] Recorrer Inicio, Presupuestos, Clientes, Materiales, Configuración y sus formularios sin iniciar sesión.
- [ ] Crear, editar, consultar y guardar datos locales como visitante.
- [ ] Abrir enlaces normales de WhatsApp desde Clientes y comprobar que continúan disponibles.
- [ ] Crear un presupuesto y abrir su vista previa sin sesión.
- [ ] Confirmar que el documento visible muestra `VERSIÓN DE PRUEBA` sin impedir su lectura.
- [ ] Pulsar Descargar PDF desde el editor y desde la vista previa; comprobar que se abre el modal, no se genera archivo y no se ejecuta un guardado secundario inesperado.
- [ ] Pulsar Enviar desde ambos lugares; comprobar que se abre el modal y no se abre WhatsApp ni el diálogo de compartir.
- [ ] Pulsar Imprimir en la vista previa; comprobar que se abre el modal y no se invoca el diálogo del sistema.
- [ ] Usar `Ctrl+P` y el menú de impresión del navegador; comprobar que el documento queda oculto y aparece únicamente el aviso de acceso requerido.
- [ ] Cancelar el modal y comprobar que la contraseña queda vacía.
- [ ] Probar credenciales incorrectas y comprobar un mensaje genérico sin revelar usuario, contraseña ni campo fallido.

### Pruebas manuales con sesión

- [ ] Iniciar sesión con las credenciales configuradas externamente y comprobar que el candado cambia a abierto.
- [ ] Comprobar que el menú del candado muestra el nombre del usuario y la acción Cerrar sesión.
- [ ] Recargar la SPA y reiniciar la aplicación Android; comprobar que la sesión persiste.
- [ ] Abrir una vista previa autenticada y confirmar que no aparece la marca de agua.
- [ ] Descargar PDF desde el editor y la vista previa; comprobar que el archivo se genera sin marca.
- [ ] Imprimir mediante botón, `Ctrl+P` y menú del navegador; comprobar que se conserva el formato A4 actual y no aparece el aviso restringido.
- [ ] Enviar un presupuesto por WhatsApp en web y Android; comprobar el flujo actual de descarga o compartición.
- [ ] Cerrar sesión y comprobar que la marca vuelve, las salidas quedan bloqueadas y todos los datos locales permanecen intactos.
- [ ] Iniciar sesión nuevamente y comprobar que los datos creados antes y después de la sesión siguen disponibles.

### Casos responsivos y accesibilidad

- [ ] Revisar Inicio y el modal en escritorio, `1023px`, `767px` y un teléfono Android real o emulado.
- [ ] Confirmar que el candado no se superpone con el logo, título, descripción ni botón principal.
- [ ] Confirmar que el control discreto conserva un objetivo táctil suficiente y foco visible.
- [ ] Verificar navegación completa por teclado: abrir modal, recorrer campos, mostrar contraseña, enviar, cancelar y cerrar sesión.
- [ ] Verificar etiquetas accesibles del candado cerrado, candado abierto, campos, control de contraseña y botones restringidos.
- [ ] Comprobar que el modal y la marca de agua no producen desplazamiento horizontal.
- [ ] Revisar que `VERSIÓN DE PRUEBA` permanezca centrado y legible en pantalla móvil, escritorio y vista de impresión restringida.

## Progreso del plan

- [ ] Fase 1: Definir autenticación provisional y configuración segura
- [ ] Fase 2: Persistir e inicializar la sesión global
- [ ] Fase 3: Crear el acceso discreto y el modal reutilizable
- [ ] Fase 4: Centralizar el permiso de salida de presupuestos
- [ ] Fase 5: Aplicar marca de agua y proteger la impresión directa
- [ ] Fase 6: Documentar operación provisional y futura migración
- [ ] Fase Testing

Fecha de creación: 26 de Agosto 2026
Fecha de última actualización: 26 de Agosto 2026
Estado: BORRADOR
