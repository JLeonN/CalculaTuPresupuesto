# Cierre de pruebas de Firebase y Android

## Descripción del plan

Cerrar, de lo más sencillo a lo más difícil, las comprobaciones manuales pendientes de la versión `0.0.7` de Calcula tu presupuesto. Firebase Authentication y Firestore ya están implementados. En una prueba real, un cliente creado en web apareció en Android y su eliminación se reflejó al volver a entrar en Clientes. La recuperación de contraseña tiene interfaz y servicio, pero no se completó un cambio real de clave. Este plan se ejecuta sobre el proyecto de Firebase de pruebas y el único POCO dedicado; cada fase debe registrar qué se comprobó y qué quedó pendiente.

## Objetivo principal

- Verificar los flujos de cuenta, aislamiento, copias, acciones de presupuesto, sincronización y trabajo sin conexión en web y Android con datos sintéticos.
- Configurar y comprobar en español los correos de verificación y recuperación de Firebase Authentication y la página donde se completa la recuperación.
- Cerrar las pruebas manuales de publicidad en el POCO usando anuncios de prueba, sin introducir una variante Android nueva.
- Corregir únicamente fallos reproducidos, después de explicar a Leo el motivo y recibir su aprobación para cada intervención de código o compilación.

## Contexto técnico verificado

- `AGENTS.md` tiene prioridad. Leerlo junto con `README.md`, `Memory.md`, `Planes/PlanFirebaseEntornoPruebas.md`, `Planes/PlanPublicidadAdMob.md` y las referencias comerciales necesarias de `C:/Z-Programacion/SolucionesAMedida/Clientes/MallicTesla` antes de cualquier corrección de código.
- Quasar CLI, Vue 3, TypeScript, Pinia y Capacitor comparten `src/`. El paquete Android es `com.calculatupresupuesto.app`; no crear otro paquete ni instalar en el teléfono personal. El POCO usa ADB `f18c5937`; el 2 de noviembre de 2026 se comprobó por ADB que tenía instalada la versión `0.0.7`.
- Firebase de pruebas: `calculatupresupuesto-pru-b2e9a`. `ServicioAutenticacionFirebase.enviarRecuperacionContrasena()` usa `sendPasswordResetEmail`; `ModalInicioSesion.vue` ya muestra «Olvidé mi contraseña». Los datos de una cuenta verificada se guardan bajo su `uid`; el visitante usa almacenamiento local. Android usa caché persistente de Firestore y web usa caché en memoria.
- `src/configuracion/firebase.ts` obtiene la instancia de Auth con `getAuth(aplicacion)` y no establece `languageCode`. Según la [referencia de Auth](https://firebase.google.com/docs/reference/js/auth.auth), cuando vale `null` se usa el idioma predeterminado configurado en Firebase Console. La [guía web](https://firebase.google.com/docs/auth/web/manage-users) permite fijar `auth.languageCode = 'es'` antes del envío. Revisar primero el idioma de las plantillas del proyecto de pruebas, porque ajustarlo allí podría evitar modificar código y compilar otra APK.
- La cuenta Google se probó en web y Android; la sesión Android persistió al reabrir. La segunda cuenta de prueba está anotada localmente, pero su acceso no quedó comprobado. Consultar `.credenciales-pruebas.local.md` solo durante pruebas que lo requieran, sin imprimirlo ni copiar credenciales a archivos versionados, comandos, registros o chat. Leo introduce manualmente contraseñas, PIN, MFA y consentimientos en la pantalla correspondiente.
- Para la recuperación, Leo eligió la cuenta Hotmail de prueba identificada como `.03` en `.credenciales-pruebas.local.md`. La nueva contraseña será la secuencia de dígitos de la contraseña actual en orden inverso; actualizar esa entrada del archivo local únicamente después de confirmar que la nueva clave permite entrar y la anterior no. Nunca registrar ambas claves ni el enlace de recuperación en este plan o en el resumen versionado.
- El POCO tiene Gmail (`com.google.android.gm`) y Outlook (`com.microsoft.office.outlook`) instalados. Leo autorizó controlarlo por USB y revisar allí el correo de pruebas, así como usar la PC para las comprobaciones web. No enviar, responder, archivar, borrar ni etiquetar correos.
- Leer la [guía USB](<Y:/Yoomat75/Control Android por USB del teléfono de pruebas/Control Android por USB en el teléfono de pruebas.md>) antes de usar el script `Y:/Yoomat75/Control Android por USB del teléfono de pruebas/Control Android por USB.ps1`. Se ejecuta una vez por toque o escritura. MIUI puede bloquear `adb shell input tap`; el script usa el `uinput` integrado. La escritura admite caracteres limitados, por lo que contraseñas complejas deben ingresarse mediante una interacción segura que no las exponga en comandos.
- `src/configuracion/configuracionPublicidad.ts` declara hoy `PUBLICIDAD_DE_PRUEBA = false`. No generar ni instalar otra APK de pruebas con anuncios reales. El banner requiere consentimiento configurado en AdMob; su plan específico conserva los casos manuales pendientes.

## Alcance

### Incluye

- Configuración del idioma español para los correos y acciones de Firebase Authentication; pruebas manuales y registro de resultados de autenticación, recuperación, cuentas, copias JSON, acciones de presupuesto, datos sincronizados, uso sin conexión y AdMob de prueba.
- Correcciones acotadas de errores confirmados, con sus consumidores y documentación, después de aprobación de Leo.

### No incluye

- Suscripciones, cobros, exenciones, cambios de Play Console, publicación de SPA o Android, migración de proyecto Firebase, cuentas reales de clientes ni una segunda variante Android.
- Cambiar el paquete `com.calculatupresupuesto.app` o limpiar datos de la aplicación como atajo de prueba.

## Mapa de cambios

| Archivo existente | Acción prevista | Símbolos o contenido | Propósito |
| --- | --- | --- | --- |
| `Planes/PlanFirebaseEntornoPruebas.md` | Actualizar al cerrar cada caso | Fases 2 a 4, pruebas manuales y progreso | Reflejar resultados comprobados sin marcar bloques incompletos |
| `Planes/PlanPublicidadAdMob.md` | Actualizar tras la fase 6 | FASE TESTING y progreso | Registrar pruebas reales del banner |
| `Planes/Resumenes/2026-10-30-Firebase-Pruebas.md` | Añadir resultados al cierre | Sección nueva «Comprobaciones posteriores» | Conservar evidencia breve, sin correos, UID, contraseñas ni capturas sensibles |
| `src/components/autenticacion/ModalInicioSesion.vue` y `src/servicios/autenticacion/ServicioAutenticacionFirebase.ts` | Solo si falla un caso confirmado | `enviarFormulario`, `enviarRecuperacionContrasena`, errores de acceso | Corregir recuperación, verificación o entrada |
| Firebase Console, proyecto de pruebas | Revisar; modificar solo tras explicar el ajuste a Leo | Authentication → Plantillas, idioma predeterminado | Solicitar correos en español sin cambiar la APK si la configuración lo permite |
| `src/configuracion/firebase.ts` | Modificar solo si la configuración de consola no resuelve el idioma y Leo lo aprueba | `obtenerFirebase`, `autenticacion.languageCode` | Fijar español desde la app en web y Android |
| `.credenciales-pruebas.local.md` (ignorado por Git) | Actualizar tras recuperación exitosa | Contraseña de la cuenta Hotmail `.03` | Mantener la clave de prueba vigente sin exponerla |
| `src/stores/autenticacion.ts` y stores de datos | Solo si falla un caso confirmado | `actualizarUsuario`, `invalidarDatos`, `cargar*` | Evitar mezcla de cuentas o recargas incorrectas |
| `src/components/configuracion/PanelCopiasSeguridad.vue`, `src/servicios/respaldo/ServicioRespaldo.ts`, `src/servicios/respaldo/archivosRespaldo.ts` | Solo si falla un caso confirmado | `descargarCopia`, `confirmarImportacion`, `importarFaltantes`, `descargarArchivoRespaldo` | Corregir exportación e importación |
| `src/configuracion/configuracionPublicidad.ts` | Modificar solo con aprobación previa a nueva APK de prueba | `PUBLICIDAD_DE_PRUEBA` | Seleccionar la unidad de anuncio de prueba existente |
| `src/composables/usePublicidad.ts`, `src/layouts/MainLayout.vue`, `src/pages/ConfiguracionPage.vue` | Solo si falla un caso confirmado | `iniciarPublicidad`, `detenerPublicidad`, `altoBanner`, opciones de privacidad | Corregir ciclo de vida y espacio del banner |

No crear archivos de código ni dependencias por anticipado. Para cada fallo, anotar pasos de reproducción, resultado esperado y real, identificar el símbolo de la tabla y explicar a Leo la corrección concreta antes de editar. Si la corrección exige un símbolo o archivo nuevo, documentar nombre, firma, integración y motivo en este plan y obtener aprobación antes de crearlo.

## FASE 1: Acceso y recuperación de contraseña

### Objetivo

Comprobar el flujo completo de correo y contraseña, incluida recuperación, en la cuenta Hotmail de prueba `.03`, con correo y página de acción en español.

### Pasos de ejecución

- [ ] Identificar en `.credenciales-pruebas.local.md` la entrada Hotmail `.03` sin imprimir su correo ni contraseña. Verificar que la clave actual contiene solo dígitos, tiene al menos seis caracteres y que invertir toda su secuencia produce una clave diferente; si alguna condición falla, detener el cambio de clave y acordar otra con Leo. Confirmar que ese buzón está disponible en Outlook o Gmail del POCO. Usar A y B solo si sus datos de la app son sintéticos; si alguna contiene datos que no sean de prueba, elegir cuentas de prueba limpias antes de crear, exportar o importar registros.
- [ ] Antes de solicitar un correo nuevo, abrir Firebase Console con la cuenta de desarrollo, comprobar que el proyecto activo es `calculatupresupuesto-pru-b2e9a` y revisar Authentication → Plantillas y su idioma predeterminado. Configurar español como idioma de los correos de verificación y recuperación, explicar a Leo el ajuste concreto antes de cambiar la configuración y verificarlo con mensajes nuevos. No modificar textos, remitente ni URL de acción sin motivo comprobado. Si la consola no ofrece el ajuste o los mensajes o la página de acción siguen en inglés, resolverlo mediante el mecanismo oficial que corresponda; para la alternativa de código, explicar a Leo el cambio y pedir aprobación explícita: en `obtenerFirebase()` de `src/configuracion/firebase.ts`, asignar `autenticacion.languageCode = 'es'` después de `autenticacion ??= getAuth(aplicacion)`. Verificar que los tres envíos de `ServicioAutenticacionFirebase.ts` reutilizan esa instancia. Una prueba Android de ese cambio requiere explicar y obtener aprobación adicional para compilar e instalar una APK actualizada con el mismo paquete; la APK anterior no contiene el cambio. No cerrar esta fase mientras el asunto, el cuerpo o la página de recuperación sigan en inglés.
- [ ] Verificar ADB con `adb devices` y `adb -s f18c5937 shell command -v uinput`; comprobar que el serial aparece como `device`. Abrir la app con `adb -s f18c5937 shell monkey -p com.calculatupresupuesto.app 1`. Para cada control, capturar pantalla con `adb -s f18c5937 shell screencap -p /sdcard/ch_pantalla.png`, copiarla fuera del repositorio con `adb -s f18c5937 pull /sdcard/ch_pantalla.png "$env:TEMP\ch_pantalla.png"` y determinar coordenadas desde esa captura. Ejecutar `& 'Y:\Yoomat75\Control Android por USB del teléfono de pruebas\Control Android por USB.ps1' -Accion tocar -X <x> -Y <y>` una vez por toque o el mismo script con `-Accion escribir -Texto <texto-admitido>` una vez por escritura, tras enfocar el campo. Eliminar la captura del teléfono con `adb -s f18c5937 shell rm -f /sdcard/ch_pantalla.png` y la copia temporal al terminar; no guardar capturas de correos, contraseñas o códigos en el repositorio o chat.
- [ ] En `ModalInicioSesion.vue`, abrir «Iniciar sesión» y «Olvidé mi contraseña», introducir solo el correo de prueba en el formulario y pulsar «Enviar enlace». Confirmar el aviso genérico de envío y ausencia de error. No escribir contraseñas en comandos ADB ni en el script USB.
- [ ] Abrir Outlook con `adb -s f18c5937 shell monkey -p com.microsoft.office.outlook 1` para la cuenta `.03`; usar Gmail solo si ese buzón está configurado allí. Buscar el mensaje de recuperación posterior al envío; revisar también correo no deseado si no llega. Comprobar si asunto, cuerpo y página abierta por el enlace están en español. Abrir el enlace en el teléfono; Leo escribe allí la clave nueva formada al invertir los dígitos de la clave actual y luego la introduce en la app. Comprobar que la clave anterior ya no permite entrar. Solo después, sustituir la contraseña de esa entrada en `.credenciales-pruebas.local.md`, conservando las demás entradas y UTF-8; verificar de nuevo que Git lo ignora, sin imprimir antes ni después. No leer ni comunicar el enlace, PIN, código o contraseña en el chat. Si el buzón no está configurado en el POCO, usar la sesión autorizada de Hotmail en la PC para lectura; Leo completa cualquier contraseña, MFA o consentimiento.
- [ ] Comprobar registro y verificación con una cuenta sintética distinta solo si la segunda cuenta aún no existe: `registrarConCorreo` debe enviar verificación, impedir el acceso antes de verificar y permitirlo después. Probar «Reenviar verificación» una vez. Registrar el resultado sin correos ni UID en `Planes/Resumenes/2026-10-30-Firebase-Pruebas.md`.

## FASE 2: Persistencia y separación de cuentas

### Objetivo

Demostrar que dos cuentas de prueba no comparten datos y que la sesión correcta vuelve al reabrir la app.

### Pasos de ejecución

- [ ] Con la cuenta A, registrar un cliente sintético identificable, por ejemplo «Prueba CH cuenta A», desde `ClientesPage.vue` y su formulario actual. Confirmar que aparece en Android y anotar solo su nombre de prueba. Cerrar la app y abrirla otra vez: `BotonSesion.vue` debe mostrar la misma sesión y el cliente debe seguir disponible.
- [ ] Cerrar sesión desde `BotonSesion.vue`, entrar con la cuenta B y confirmar que el cliente A no aparece en Clientes ni en búsqueda, presupuesto o copia JSON de B. Crear «Prueba CH cuenta B» en B; volver a A y confirmar que solo A ve su cliente. Repetir la comprobación en web con ambas cuentas. No importar copias entre A y B antes de terminar este aislamiento.
- [ ] Revisar errores de credenciales incorrectas, correo sin verificar y proveedor ya vinculado sin intentar claves repetidamente. Si se reproduce mezcla o una lectura tardía, inspeccionar `actualizarUsuario` de `src/stores/autenticacion.ts`, `invalidarDatos` y `cargarClientes`/`cargarMateriales`/`cargarPresupuestos`/`cargarConfiguracion` en sus cuatro stores y los consumidores que mantienen datos en pantalla. Corregir solo después de explicar a Leo el fallo y recibir aprobación.

## FASE 3: Salidas de presupuesto y copias JSON

### Objetivo

Verificar acciones restringidas y copia/importación sin sobrescribir ni perder datos existentes.

### Pasos de ejecución

- [ ] En web y Android, como visitante, confirmar que Descargar PDF, Imprimir y Enviar del presupuesto no producen la salida y muestran la solicitud de inicio de sesión; la vista conserva la marca de prueba. Con una cuenta iniciada y un presupuesto sintético, comprobar cada acción desde `NuevoPresupuestoPage.vue` y `VistaPreviaPresupuestoPage.vue`. En Android, comprobar el destino externo o la hoja de compartir sin enviar nada a terceros. El permiso actual es `useAutenticacionStore().puedeGenerarSalidaPresupuesto`, derivado de `estaAutenticado`; no introducir lógica comercial.
- [ ] Desde `ConfiguracionPage.vue` → Seguridad → `PanelCopiasSeguridad.vue`, exportar una copia JSON de datos sintéticos. En web, verificar que el archivo descargado tiene `tipo = calcula-tu-presupuesto-respaldo`, `versionFormato = 1` y las cuatro secciones de `datos`. En Android, elegir un destino externo de prueba en la hoja de compartir y verificar que el archivo realmente existe allí; no conservar la única copia en la caché de la app.
- [ ] Después de completar la fase 2, usar A como origen y B como destino de una copia que solo contenga datos sintéticos. Importar en B mediante «Importar copia» → revisar conteos y UID mostrado → «Agregar faltantes». Comprobar que se agregan solo faltantes, que el cliente propio de B permanece igual y que los datos de A no se borran. Repetir el mismo archivo: el resumen debe indicar cero altas. Desde esta acción, B tendrá legítimamente los registros importados de A; no interpretarlos como fuga entre cuentas. No importar una copia con datos reales ni confirmar un UID distinto del esperado.
- [ ] Probar un JSON inválido creado fuera del repositorio en `$env:TEMP\ch_respaldo_invalido.json` con contenido `{}` y una operación con cambios de Configuración sin guardar; esperar los mensajes existentes sin alteración de datos. Borrar ese archivo temporal al terminar. Si falla, ubicar primero `PanelCopiasSeguridad.vue` (`seleccionarCopia`, `confirmarImportacion`, `descargarCopia`), `ServicioRespaldo.ts` (`previsualizarImportacion`, `importarFaltantes`, `exigirCuentaVigente`) o `archivosRespaldo.ts` (`descargarArchivoRespaldo`).

## FASE 4: Sincronización de todos los datos

### Objetivo

Extender la prueba ya hecha con un cliente a materiales, presupuestos y configuración, en ambos sentidos.

### Pasos de ejecución

- [ ] Usar la misma cuenta A en web y POCO. Crear un material sintético desde `/materiales/nuevo`, un presupuesto sintético vinculado al cliente A desde `/presupuestos/nuevo` y guardar un cambio identificable de configuración desde `/configuracion`. Usar nombres de prueba, importes pequeños y ningún dato real. Confirmar en Android cada alta al salir y volver a entrar a Materiales, Presupuestos y Configuración; la prueba anterior mostró actualización al recargar la sección, no actualización inmediata de una lista abierta.
- [ ] Editar esos tres datos desde Android y volver a cargar sus secciones en web; comparar valores e IDs de registro sin copiarlos al chat. Repetir un cambio desde web hacia Android. Confirmar que B no recibe las altas ni ediciones nuevas de A posteriores a la importación de la fase 3; los registros importados deliberadamente sí pueden figurar en B. Si falta un dato, revisar `RepositorioColeccionFirestore`, `RepositorioConfiguracionFirestore`, los cuatro `crearRepositorio*.ts` y las funciones `cargar*` de los stores; no crear un segundo origen de datos.
- [ ] Registrar separadamente el resultado de clientes, materiales, presupuestos y configuración. Un caso correcto no marca los otros como aprobados.

## FASE 5: Escritura sin conexión y reconexión

### Objetivo

Comprobar la cola de escrituras Firestore, la persistencia local Android y el resultado visible tras recuperar la red.

### Pasos de ejecución

- [ ] Con la cuenta A y datos sintéticos ya sincronizados, guardar una copia externa antes de la prueba. Confirmar Wi-Fi activo y datos visibles en ambas plataformas. Desactivar solo el Wi-Fi del POCO mediante su interfaz o ADB; no tocar el teléfono personal ni restablecer datos de la app.
- [ ] Modificar en Android un cliente y un material sintéticos sin conexión. Esperar el aviso de `src/boot/firebase.ts` para estado `pendiente` o documentar su ausencia; comprobar que la app permite continuar. Cerrar y reabrir la app aún sin red y verificar que la sesión y las modificaciones siguen visibles desde la caché Android.
- [ ] Restaurar Wi-Fi y comprobar el aviso `sincronizado`, la lectura remota y los valores en web al recargar. Repetir con un presupuesto o configuración solo si los dos primeros casos pasaron. Registrar por separado éxito de escritura local, persistencia tras reinicio y confirmación remota. Restablecer Wi-Fi aunque falle la prueba.
- [ ] Probar un error de red recuperable y una edición simultánea sintética desde web y Android; documentar el valor final observado y si coincide con la política actual de última escritura. Ante fallo, inspeccionar `src/configuracion/firebase.ts` (`persistentLocalCache`, `memoryLocalCache`), `src/repositorios/almacenamiento/esperarEscrituraFirestore.ts`, `src/boot/firebase.ts` y el repositorio de la colección afectada antes de proponer cambios.

## FASE 6: Publicidad de prueba en el POCO

### Objetivo

Completar los casos manuales de `Planes/PlanPublicidadAdMob.md` sin solicitar anuncios reales durante estas pruebas.

### Pasos de ejecución

- [ ] Antes de una nueva APK, comprobar `PUBLICIDAD_DE_PRUEBA` en `src/configuracion/configuracionPublicidad.ts`. Hoy vale `false`. Explicar a Leo por qué debe pasar a `true`, qué APK se pretende compilar y cómo se comprobará el paquete. Obtener su aprobación explícita antes de editar ese valor o ejecutar `npm run build:android`. No cambiar el ID de aplicación ni crear una variante `.pruebas`.
- [ ] Si Leo autoriza la compilación, comprobar que `obtenerConfiguracionSolicitudPublicidad` usa `ID_BANNER_PRUEBA_ANDROID` e `isTesting: true`; sincronizar Android según el procedimiento vigente del proyecto y verificar el paquete de la APK resultante antes de instalarla en el POCO con `adb -s f18c5937 install -r <ruta-APK-verificada>`. Si no se dispone de una APK de prueba verificada, dejar esta fase pendiente; no usar la instalada con anuncios reales como sustituto.
- [ ] Si `requestConsentInfo()` falla por configuración, comprobar el formulario de consentimiento de la app de pruebas en AdMob. Explicar a Leo cualquier cambio externo necesario antes de configurarlo o publicarlo. No modificar Play Console. Si Google muestra consentimiento, Leo completa la elección; CH comprueba después el resultado visible.
- [ ] Ejecutar los casos pendientes del plan AdMob: visitante con banner inferior centrado; inicio de sesión que lo retira; cierre que lo recupera; sesión persistida sin anuncio; rechazo/falta de consentimiento sin banner; error de red; giro, segundo plano y recorrido de todas las páginas sin controles tapados. En SPA web, tanto móvil como PC, confirmar que nunca aparece banner ni reserva. Registrar lo observado en `Planes/PlanPublicidadAdMob.md` sin asumir que una sola pantalla cubre todas.

## FASE TESTING

### Objetivo

Cerrar el plan solo con evidencias observables y dejar los fallos aislados para corrección autorizada.

### Pruebas automatizadas

- [ ] Si hubo cambios de código y Leo los autorizó junto con sus validaciones, ejecutar desde la raíz `npm run typecheck`, `npm run lint:check`, `npm run test:respaldo` y `npm run test:firebase` según el área afectada; ejecutar `npm run build` y `npm run build:android` solo con autorización explícita. No ejecutar `npm run lint`, que reescribe archivos. Si no hubo cambios o Leo no autorizó esos comandos, dejar constancia de que no se ejecutaron.

### Pruebas manuales

- [ ] Repetir únicamente los casos que fallaron tras cada corrección; comprobar que el caso original pasa y que no se perdió un flujo vecino. Registrar fecha, plataforma, versión instalada, cuenta A/B sin correo ni UID, acción, resultado esperado y observado, y estado `aprobado`/`pendiente`/`bloqueado` en la sección «Comprobaciones posteriores» de `Planes/Resumenes/2026-10-30-Firebase-Pruebas.md`.
- [ ] Actualizar los checks relacionados en `Planes/PlanFirebaseEntornoPruebas.md` y `Planes/PlanPublicidadAdMob.md` solo cuando cada conjunto completo de casos pase. Revisar que `git status` no incluya `.env.local`, `.credenciales-pruebas.local.md`, `google-services.json`, capturas, APK o datos de correo. No ejecutar `git add`, commit ni push sin pedido explícito de Leo.

### Casos responsivos

- [ ] Revisar en POCO, navegador móvil y PC las pantallas de inicio, registro, recuperación, mensajes de sesión, copias y acciones de presupuesto: sin controles ocultos por teclado o banner, desbordamiento ni botones inaccesibles. Para AdMob, cubrir orientación vertical y horizontal y los anchos definidos en su plan específico.

## Progreso del plan

- [ ] Fase 1: Acceso y recuperación de contraseña
- [ ] Fase 2: Persistencia y separación de cuentas
- [ ] Fase 3: Salidas de presupuesto y copias JSON
- [ ] Fase 4: Sincronización de todos los datos
- [ ] Fase 5: Escritura sin conexión y reconexión
- [ ] Fase 6: Publicidad de prueba en el POCO
- [ ] Fase Testing

Fecha de creación: 2 de noviembre de 2026
Fecha de última actualización: 2 de noviembre de 2026
Estado: BORRADOR
