# Cierre de pruebas de Firebase y Android

## Descripción del plan

Cerrar, de lo más sencillo a lo más difícil, las comprobaciones manuales pendientes de la versión `0.0.7` de Calcula tu presupuesto. Firebase Authentication y Firestore ya están implementados. En una prueba real, un cliente creado en web apareció en Android y su eliminación se reflejó al volver a entrar en Clientes. La recuperación de contraseña tiene interfaz y servicio, pero no se completó un cambio real de clave. Este plan se ejecuta sobre el proyecto de Firebase de pruebas y el único POCO dedicado; cada fase debe registrar qué se comprobó y qué quedó pendiente.

## Objetivo principal

- Verificar los flujos de cuenta, aislamiento, copias, acciones de presupuesto, sincronización y trabajo sin conexión en web y Android con datos sintéticos.
- Configurar y comprobar en español los correos de verificación y recuperación de Firebase Authentication y la página donde se completa la recuperación.
- Cerrar las pruebas manuales de publicidad en el POCO usando anuncios de prueba, sin introducir una variante Android nueva.
- Corregir únicamente fallos reproducidos, después de explicar a Leo el motivo y recibir su aprobación para cada intervención de código o compilación.

## Contexto técnico verificado

- `AGENTS.md` tiene prioridad. Leerlo junto con `README.md`, `Memory.md`, `Planes/PlanFirebaseEntornoPruebas.md`, `Planes/PlanesTerminados/PlanPublicidadAdMob.md` y las referencias comerciales necesarias de `C:/Z-Programacion/SolucionesAMedida/Clientes/MallicTesla` antes de cualquier corrección de código.
- Quasar CLI, Vue 3, TypeScript, Pinia y Capacitor comparten `src/`. El paquete Android es `com.calculatupresupuesto.app`; no crear otro paquete ni instalar en el teléfono personal. El POCO usa ADB `f18c5937`; el 2 de noviembre de 2026 se comprobó por ADB que tenía instalada la versión `0.0.7`.
- Firebase de pruebas: `calculatupresupuesto-pru-b2e9a`. `ServicioAutenticacionFirebase.enviarRecuperacionContrasena()` usa `sendPasswordResetEmail`; `ModalInicioSesion.vue` ya muestra «Olvidé mi contraseña». Los datos de una cuenta verificada se guardan bajo su `uid`; el visitante usa almacenamiento local. Android usa caché persistente de Firestore y web usa caché en memoria.
- `src/configuracion/firebase.ts` obtiene la instancia de Auth con `getAuth(aplicacion)` y no establece `languageCode`. Según la [referencia de Auth](https://firebase.google.com/docs/reference/js/auth.auth), cuando vale `null` se usa el idioma predeterminado configurado en Firebase Console. La [guía web](https://firebase.google.com/docs/auth/web/manage-users) permite fijar `auth.languageCode = 'es'` antes del envío. Revisar primero el idioma de las plantillas del proyecto de pruebas, porque ajustarlo allí podría evitar modificar código y compilar otra APK.
- La cuenta Google se probó en web y Android; la sesión Android persistió al reabrir. Las dos cuentas de prueba ya tienen acceso comprobado en Android; Google B también en web. Consultar `.credenciales-pruebas.local.md` solo durante pruebas que lo requieran, sin imprimirlo ni copiar credenciales a archivos versionados, comandos, registros o chat. Leo introduce manualmente contraseñas, PIN, MFA y consentimientos en la pantalla correspondiente.
- Para la recuperación, Leo eligió la cuenta Hotmail de prueba identificada como `.03` en `.credenciales-pruebas.local.md`. La nueva contraseña será la secuencia de dígitos de la contraseña actual en orden inverso; actualizar esa entrada del archivo local únicamente después de confirmar que la nueva clave permite entrar y la anterior no. Nunca registrar ambas claves ni el enlace de recuperación en este plan o en el resumen versionado.
- El POCO tiene Gmail (`com.google.android.gm`) y Outlook (`com.microsoft.office.outlook`) instalados. Leo autorizó controlarlo por USB y revisar allí el correo de pruebas, así como usar la PC para las comprobaciones web. No enviar, responder, archivar, borrar ni etiquetar correos.
- Leer la [guía USB](<Y:/Yoomat75/Control Android por USB del teléfono de pruebas/Control Android por USB en el teléfono de pruebas.md>) antes de usar el script `Y:/Yoomat75/Control Android por USB del teléfono de pruebas/Control Android por USB.ps1`. Se ejecuta una vez por toque o escritura. MIUI puede bloquear `adb shell input tap`; el script usa el `uinput` integrado. La escritura admite caracteres limitados, por lo que contraseñas complejas deben ingresarse mediante una interacción segura que no las exponga en comandos.
- `src/configuracion/configuracionPublicidad.ts` declara actualmente `PUBLICIDAD_DE_PRUEBA = true` para la APK instalada en el POCO. No generar ni instalar una APK de pruebas con anuncios reales. El banner requiere consentimiento configurado en AdMob; su plan específico conserva los casos manuales pendientes.

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
| `Planes/PlanesTerminados/PlanPublicidadAdMob.md` | Actualizar tras la fase 6 | FASE TESTING y progreso | Registrar pruebas reales del banner |
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

- [x] Identificar en `.credenciales-pruebas.local.md` la entrada Hotmail `.03` sin imprimir su correo ni contraseña. Verificar que la clave actual contiene solo dígitos, tiene al menos seis caracteres y que invertir toda su secuencia produce una clave diferente; si alguna condición falla, detener el cambio de clave y acordar otra con Leo. Confirmar que ese buzón está disponible en Outlook o Gmail del POCO. Usar A y B solo si sus datos de la app son sintéticos; si alguna contiene datos que no sean de prueba, elegir cuentas de prueba limpias antes de crear, exportar o importar registros.
- [x] Antes de solicitar un correo nuevo, abrir Firebase Console con la cuenta de desarrollo, comprobar que el proyecto activo es `calculatupresupuesto-pru-b2e9a` y revisar Authentication → Plantillas y su idioma predeterminado. Configurar español como idioma de los correos de verificación y recuperación, explicar a Leo el ajuste concreto antes de cambiar la configuración y verificarlo con mensajes nuevos. No modificar textos, remitente ni URL de acción sin motivo comprobado. Si la consola no ofrece el ajuste o los mensajes o la página de acción siguen en inglés, resolverlo mediante el mecanismo oficial que corresponda; para la alternativa de código, explicar a Leo el cambio y pedir aprobación explícita: en `obtenerFirebase()` de `src/configuracion/firebase.ts`, asignar `autenticacion.languageCode = 'es'` después de `autenticacion ??= getAuth(aplicacion)`. Verificar que los tres envíos de `ServicioAutenticacionFirebase.ts` reutilizan esa instancia. Una prueba Android de ese cambio requiere explicar y obtener aprobación adicional para compilar e instalar una APK actualizada con el mismo paquete; la APK anterior no contiene el cambio. No cerrar esta fase mientras el asunto, el cuerpo o la página de recuperación sigan en inglés.
- [x] Verificar ADB con `adb devices` y `adb -s f18c5937 shell command -v uinput`; comprobar que el serial aparece como `device`. Abrir la app con `adb -s f18c5937 shell monkey -p com.calculatupresupuesto.app 1`. Para cada control, capturar pantalla con `adb -s f18c5937 shell screencap -p /sdcard/ch_pantalla.png`, copiarla fuera del repositorio con `adb -s f18c5937 pull /sdcard/ch_pantalla.png "$env:TEMP\ch_pantalla.png"` y determinar coordenadas desde esa captura. Ejecutar `& 'Y:\Yoomat75\Control Android por USB del teléfono de pruebas\Control Android por USB.ps1' -Accion tocar -X <x> -Y <y>` una vez por toque o el mismo script con `-Accion escribir -Texto <texto-admitido>` una vez por escritura, tras enfocar el campo. Eliminar la captura del teléfono con `adb -s f18c5937 shell rm -f /sdcard/ch_pantalla.png` y la copia temporal al terminar; no guardar capturas de correos, contraseñas o códigos en el repositorio o chat.
- [x] En `ModalInicioSesion.vue`, abrir «Iniciar sesión» y «Olvidé mi contraseña», introducir solo el correo de prueba en el formulario y pulsar «Enviar enlace». Confirmar el aviso genérico de envío y ausencia de error. No escribir contraseñas en comandos ADB ni en el script USB.
- [x] Abrir Outlook con `adb -s f18c5937 shell monkey -p com.microsoft.office.outlook 1` para la cuenta `.03`; usar Gmail solo si ese buzón está configurado allí. Buscar el mensaje de recuperación posterior al envío; revisar también correo no deseado si no llega. Comprobar si asunto, cuerpo y página abierta por el enlace están en español. Abrir el enlace en el teléfono; Leo escribe allí la clave nueva formada al invertir los dígitos de la clave actual y luego la introduce en la app. Comprobar que la clave anterior ya no permite entrar. Solo después, sustituir la contraseña de esa entrada en `.credenciales-pruebas.local.md`, conservando las demás entradas y UTF-8; verificar de nuevo que Git lo ignora, sin imprimir antes ni después. No leer ni comunicar el enlace, PIN, código o contraseña en el chat. Si el buzón no está configurado en el POCO, usar la sesión autorizada de Hotmail en la PC para lectura; Leo completa cualquier contraseña, MFA o consentimiento.
- [x] Comprobar registro y verificación con una cuenta sintética distinta solo si la segunda cuenta aún no existe: `registrarConCorreo` debe enviar verificación, impedir el acceso antes de verificar y permitirlo después. Probar «Reenviar verificación» una vez. Registrar el resultado sin correos ni UID en `Planes/Resumenes/2026-10-30-Firebase-Pruebas.md`.

## FASE 2: Persistencia y separación de cuentas

### Objetivo

Demostrar que dos cuentas de prueba no comparten datos y que la sesión correcta vuelve al reabrir la app.

### Pasos de ejecución

- [x] Con la cuenta A, registrar un cliente sintético identificable, por ejemplo «Prueba CH cuenta A», desde `ClientesPage.vue` y su formulario actual. Confirmar que aparece en Android y anotar solo su nombre de prueba. Cerrar la app y abrirla otra vez: `BotonSesion.vue` debe mostrar la misma sesión y el cliente debe seguir disponible.
- [x] Cerrar sesión desde `BotonSesion.vue`, entrar con la cuenta B y confirmar que el cliente A no aparece en Clientes ni en búsqueda, presupuesto o copia JSON de B. Crear «Prueba CH cuenta B» en B; volver a A y confirmar que solo A ve su cliente. Repetir la comprobación en web con ambas cuentas. No importar copias entre A y B antes de terminar este aislamiento.
- [x] Revisar errores de credenciales incorrectas, correo sin verificar y proveedor ya vinculado sin intentar claves repetidamente. Si se reproduce mezcla o una lectura tardía, inspeccionar `actualizarUsuario` de `src/stores/autenticacion.ts`, `invalidarDatos` y `cargarClientes`/`cargarMateriales`/`cargarPresupuestos`/`cargarConfiguracion` en sus cuatro stores y los consumidores que mantienen datos en pantalla. Corregir solo después de explicar a Leo el fallo y recibir aprobación.

## FASE 3: Salidas de presupuesto y copias JSON

### Objetivo

Verificar acciones restringidas y copia/importación sin sobrescribir ni perder datos existentes.

### Pasos de ejecución

- [x] Leo confirmó que Imprimir no aparece en Android y que en PC aparece y abre la impresión. La prueba previa comprobó Descargar e Imprimir como visitante en web, y Descargar y la hoja de compartir con sesión en Android.
- [x] En Chrome del POCO, la vista previa no mostró Imprimir y Descargar como visitante solicitó iniciar sesión. En la SPA de PC con sesión, Descargar PDF funcionó desde el presupuesto y su vista previa; el envío Android ya abrió la hoja de compartir sin enviar.
- [x] Leo confirmó que la exportación de copia JSON desde la web funciona. Una copia de prueba también se guardó en un destino externo del POCO.
- [x] Verificar en la copia web el tipo `calcula-tu-presupuesto-respaldo`, la versión 1 y las cuatro secciones de datos; los tres controles pasaron.
- [x] Después de completar la fase 2, usar A como origen y B como destino de una copia que solo contenga datos sintéticos. Importar en B mediante «Importar copia» → revisar conteos y UID mostrado → «Agregar faltantes». Comprobar que se agregan solo faltantes, que el cliente propio de B permanece igual y que los datos de A no se borran. Repetir el mismo archivo: el resumen debe indicar cero altas. Desde esta acción, B tendrá legítimamente los registros importados de A; no interpretarlos como fuga entre cuentas. No importar una copia con datos reales ni confirmar un UID distinto del esperado.
- [x] En el POCO se rechazó un JSON inválido `{}` con el mensaje de archivo incorrecto. Con cambios de Configuración sin guardar, Descargar copia mostró que había que guardarlos o descartarlos; al salir y volver, el valor original seguía intacto. El JSON inválido también se había rechazado en web.

## FASE 4: Sincronización de todos los datos

### Objetivo

Extender la prueba ya hecha con un cliente a materiales, presupuestos y configuración, en ambos sentidos.

### Pasos de ejecución

- [x] Usar la misma cuenta A en web y POCO. Se crearon material y presupuesto sintéticos en web y aparecieron en Android; un cambio de configuración web también apareció tras reiniciar la app. La actualización de una sección ya abierta no es inmediata.
- [x] Editar los datos desde Android y volver a cargar sus secciones en web. Cliente, material y estado del presupuesto llegaron a web el 3 de noviembre; el 4 de noviembre se comprobó configuración Android → web y su restauración web → Android. B no mostró las altas nuevas de A posteriores a la importación.
- [x] Registrar separadamente los resultados de clientes, materiales, presupuestos y configuración en el resumen de ejecución.

## FASE 5: Escritura sin conexión y reconexión

### Objetivo

Comprobar la cola de escrituras Firestore, la persistencia local Android y el resultado visible tras recuperar la red.

### Pasos de ejecución

- [x] Con la cuenta A y datos sintéticos ya sincronizados, guardar una copia externa antes de la prueba. Confirmar Wi-Fi activo y datos visibles en ambas plataformas. Desactivar solo el Wi-Fi del POCO mediante su interfaz o ADB; no tocar el teléfono personal ni restablecer datos de la app.
- [x] Modificar en Android un cliente y un material sintéticos sin conexión, documentar el aviso `pendiente` observado para el material y comprobar que la app permite continuar. Ambos cambios llegaron a la web al reconectar.
- [x] Con la caché Android corregida, cerrar y reabrir la app sin red y verificar que la sesión, los clientes y una edición sintética de cliente sigan visibles. El resultado se registró el 3 de noviembre.
- [x] Repetir la persistencia tras reinicio sin red con un material, presupuesto y configuración. El 4 de noviembre siguieron visibles los tres en el POCO después de forzar cierre y reabrir sin Wi-Fi.
- [x] Restablecer Wi-Fi y comprobar en web la llegada de cambios hechos sin conexión en un cliente y un material; los resultados están registrados en la ejecución del 3 de noviembre.
- [ ] Comprobar el aviso `sincronizado` y una edición simultánea desde web y Android: Leo decidió trasladar ambas comprobaciones a `Planes/PlanesFuturos/TareasPendientes.md`. Queda pendiente también comprobar un error de red recuperable.

## FASE 6: Publicidad de prueba en el POCO

### Objetivo

Completar los casos manuales de `Planes/PlanesTerminados/PlanPublicidadAdMob.md` sin solicitar anuncios reales durante estas pruebas.

### Pasos de ejecución

- [x] Comprobar `PUBLICIDAD_DE_PRUEBA` en `src/configuracion/configuracionPublicidad.ts`, explicar a Leo el cambio y obtener su aprobación antes de modificarlo y compilar. Se activó el modo de prueba sin cambiar el ID de aplicación ni crear una variante `.pruebas`.
- [x] Comprobar que `obtenerConfiguracionSolicitudPublicidad` usa `ID_BANNER_PRUEBA_ANDROID` e `isTesting: true`, verificar el paquete de la APK e instalarla en el POCO. Estos pasos se registran en la ejecución del 3 de noviembre.
- [ ] Si `requestConsentInfo()` falla por configuración, comprobar el formulario de consentimiento de la app de pruebas en AdMob. Explicar a Leo cualquier cambio externo necesario antes de configurarlo o publicarlo. No modificar Play Console. Si Google muestra consentimiento, Leo completa la elección; CH comprueba después el resultado visible.
- [x] Confirmar con Leo el comportamiento principal de AdMob: el banner aparece sin sesión y se oculta al iniciar sesión.
- [ ] Ejecutar los casos adicionales del plan AdMob: ubicación y espacio del banner, sesión persistida, rechazo/falta de consentimiento, error de red, giro, segundo plano y recorrido de todas las páginas sin controles tapados. En SPA web, tanto móvil como PC, confirmar que nunca aparece banner ni reserva. Registrar lo observado en `Planes/PlanesTerminados/PlanPublicidadAdMob.md` sin asumir que una sola pantalla cubre todas.

## FASE TESTING

### Objetivo

Cerrar el plan solo con evidencias observables y dejar los fallos aislados para corrección autorizada.

### Pruebas automatizadas

- [ ] Si hubo cambios de código y Leo los autorizó junto con sus validaciones, ejecutar desde la raíz `npm run typecheck`, `npm run lint:check`, `npm run test:respaldo` y `npm run test:firebase` según el área afectada; ejecutar `npm run build` y `npm run build:android` solo con autorización explícita. No ejecutar `npm run lint`, que reescribe archivos. Si no hubo cambios o Leo no autorizó esos comandos, dejar constancia de que no se ejecutaron.

### Pruebas manuales

- [ ] Repetir únicamente los casos que fallaron tras cada corrección; comprobar que el caso original pasa y que no se perdió un flujo vecino. Registrar fecha, plataforma, versión instalada, cuenta A/B sin correo ni UID, acción, resultado esperado y observado, y estado `aprobado`/`pendiente`/`bloqueado` en la sección «Comprobaciones posteriores» de `Planes/Resumenes/2026-10-30-Firebase-Pruebas.md`.
- [ ] Actualizar los checks relacionados en `Planes/PlanFirebaseEntornoPruebas.md` y `Planes/PlanesTerminados/PlanPublicidadAdMob.md` solo cuando cada conjunto completo de casos pase. Revisar que `git status` no incluya `.env.local`, `.credenciales-pruebas.local.md`, `google-services.json`, capturas, APK o datos de correo. No ejecutar `git add`, commit ni push sin pedido explícito de Leo.

### Casos responsivos

- [ ] Revisar en POCO, navegador móvil y PC las pantallas de inicio, registro, recuperación, mensajes de sesión, copias y acciones de presupuesto: sin controles ocultos por teclado o banner, desbordamiento ni botones inaccesibles. Para AdMob, cubrir orientación vertical y horizontal y los anchos definidos en su plan específico.

## Progreso del plan

- [x] Fase 1: Acceso y recuperación de contraseña
- [x] Fase 2: Persistencia y separación de cuentas
- [x] Fase 3: Salidas de presupuesto y copias JSON
- [x] Fase 4: Sincronización de todos los datos
- [ ] Fase 5: Escritura sin conexión y reconexión
- [ ] Fase 6: Publicidad de prueba en el POCO
- [ ] Fase Testing

Fecha de creación: 2 de noviembre de 2026
Fecha de última actualización: 5 de noviembre de 2026
Estado: EN EJECUCIÓN

## Registro de ejecución del 2 de noviembre de 2026

- Fase 1, completado: la clave anterior de la cuenta de prueba `.03` era numérica, tenía al menos seis caracteres y su inversión producía una clave diferente. La cuenta existe en Firebase Authentication del proyecto de pruebas y usa el proveedor Email. La clave se cambió y se verificó más adelante en este registro.
- Fase 1, completado: en Firebase Console se cambió el idioma predeterminado de las plantillas a español (Latinoamérica). La vista previa de recuperación muestra asunto y cuerpo en español.
- Comprobación posterior: Leo confirmó que el asunto y el cuerpo del correo real llegaron en español a No deseados. Un enlace anterior, abierto varias horas después, mostró en español que había caducado o ya se había usado.
- A las 20:53 se solicitó un enlace nuevo desde el POCO y la app mostró el aviso genérico sin error. Leo abrió el mensaje más reciente, confirmó que el formulario válido estaba en español y cambió la contraseña. La nueva clave inició sesión en Android; la anterior fue rechazada en un único intento; Leo volvió a iniciar sesión con la nueva.
- La prueba de registro y verificación de una tercera cuenta no aplica: las dos cuentas de prueba ya existen. Leo confirmó que ambas contienen solo datos sintéticos. El buzón `.03` se consultó desde Outlook de Windows porque Outlook del POCO no completó su configuración.
- La entrada `.03` de `.credenciales-pruebas.local.md` se actualizó con la clave invertida y se verificó que el archivo sigue ignorado por Git. Un primer comando de actualización dejó temporalmente vacío solo ese campo; se recuperó su valor original desde el historial local de VS Code y se rehizo la inversión, comprobando que las demás líneas del archivo coinciden con la copia local. No se mostraron claves.
- Fase 1, completado en POCO `f18c5937`: ADB y `uinput` disponibles; la app instalada abrió el formulario «Olvidé mi contraseña», aceptó la solicitud para la cuenta de prueba y mostró el aviso genérico sin error.
- La casilla de prueba no quedó configurada en Outlook del POCO; Leo encontró el correo en Outlook de Windows. El acceso a Outlook web indicó que el inicio de sesión con contraseña no estaba disponible y ofreció otros métodos. Esto no afectó la recuperación de Firebase.
- Reintento posterior: Outlook Android quedó más de un minuto en «Autenticación en curso»; tras reiniciar solo esa app, la casilla `.03` seguía sin aparecer en sus cuentas. El Wi-Fi del POCO respondió por Internet y al servidor de Microsoft. Se dejó abierto el formulario de inicio de sesión de Outlook web en el navegador para que Leo complete el acceso allí, si el móvil continúa sin avanzar.
- Diagnóstico en PC: Outlook de Windows está instalado y tenía la casilla `.03`; Leo encontró allí el correo en No deseados. La herramienta de control no pudo leer esa ventana, por lo que Leo abrió el mensaje y el enlace. No se modificó la seguridad de la cuenta Microsoft.
- Fase 3, comprobación parcial en la SPA local como visitante: la vista previa conserva «VERSIÓN DE PRUEBA»; Descargar PDF e Imprimir abren el inicio de sesión; Enviar está deshabilitado. Falta repetirlo en Android y probar las salidas con sesión iniciada.
- Testing responsive parcial: en una ventana web de 390 × 844 píxeles, los controles del inicio de sesión y de recuperación quedaron visibles y accesibles. Se restauró el tamaño normal del navegador. Falta revisar registro, copias y presupuesto en móvil/PC y la interfaz del POCO.
- En ese momento, las fases 2, 4, 5, 6 y Testing aún no se habían ejecutado; la fase 3 solo tenía la comprobación parcial anterior. No hubo cambios de código, compilaciones ni validaciones automáticas.

- Fase 2, aprobada: A es el correo de prueba `.03` y B la cuenta Google de prueba. En Android, los clientes «Prueba CH cuenta A» y «Prueba CH cuenta B» persistieron tras reiniciar; cada cuenta vio solo el suyo antes de importar. En web, A vio su cliente y no B; B vio su cliente y no A. La clave anterior rechazada cubre el caso de credenciales incorrectas. No se creó una tercera cuenta sin verificar ni se intentó vincular proveedores porque las dos cuentas actuales ya están verificadas y deben permanecer separadas.

## Registro de ejecución del 3 de noviembre de 2026

- Fase 3, copias: A exportó un JSON desde el POCO a `Download`; existe fuera de la caché de la app. La copia anterior se importó en B desde la SPA: se añadieron solo los registros faltantes y se conservó el cliente propio de B; una segunda importación indicó cero altas. Un JSON `{}` externo se rechazó. En Configuración, la SPA mostró «Cambios sin guardar» durante la edición y descartó el cambio al navegar, sin aviso de salida adicional. Las acciones de presupuesto del visitante se comprobaron en web; falta repetir en Android. Con sesión Android, Descargar generó un PDF en Documentos y Enviar abrió la hoja de compartir sin envío. Imprimir no produjo una respuesta visible en el WebView; requiere diagnóstico.
- Fase 4, sincronización parcial: web A creó el material «Prueba CH material A» y un presupuesto para «Prueba CH cuenta A» por UYU 35,80; ambos aparecieron en el POCO. Un cambio de empresa hecho en web apareció en Android tras reiniciar la app, pero no al entrar solo en Configuración. Android añadió un teléfono sintético al cliente A, un segundo precio al material A y marcó el presupuesto aceptado; web A recibió los tres cambios. Web A volvió el presupuesto a pendiente y restauró el nombre y la dirección de la empresa. Web B no mostró el material ni el presupuesto creados en A después de la importación. Falta comprobar el regreso del estado pendiente en Android y cerrar la revisión de Configuración.
- Fase 5, copia previa: A exportó un JSON nuevo a `Download` del POCO antes de desconectar el Wi-Fi; se verificó la existencia del archivo. El teléfono no tiene SIM y `dumpsys connectivity` informó que no había red activa.
- Fase 5, escritura local y confirmación remota aprobadas para dos registros: sin Wi-Fi, Android añadió un segundo teléfono sintético al cliente A y un tercer precio al material A. Ambas fichas mostraron los cambios; en el material apareció el aviso «Cambio guardado en este dispositivo. Se sincronizará al recuperar conexión». Tras restablecer Wi-Fi, la SPA de A mostró el segundo teléfono y el tercer precio. No se observó directamente el aviso «Cambios sincronizados con Firebase» porque se reinició la app durante la prueba.
- Fase 5, **fallo reproducido dos veces**: después de forzar cierre y reabrir la app aún sin Wi-Fi, la cabecera pasó a «Calcula tu presupuesto» y la lista de Clientes se mostró vacía, incluso después de esperar. Ocurrió tras editar el cliente y nuevamente tras editar el material. La cabecera predeterminada y el dibujo del candado no demostraban que se hubiera cerrado la sesión; el diagnóstico posterior confirmó desde el menú que la sesión seguía activa y encontró un fallo de caché Firestore. No dar por aprobada la persistencia local tras reinicio.
- No se modificó código ni se compiló una APK durante estas comprobaciones. `PUBLICIDAD_DE_PRUEBA` sigue en `false`; la fase 6 requiere aprobación específica antes de cambiarlo o compilar.
- Fase 6, preparación autorizada posteriormente por Leo: `PUBLICIDAD_DE_PRUEBA` pasó a `true`; `npm run build:android` y `gradlew assembleDebug` finalizaron bien. La APK debug firmada indica el paquete `com.calculatupresupuesto.app`, versión `0.0.7`, y se instaló con `adb install -r` en `f18c5937`. La captura posterior no mostró banner, pero no se había comprobado la sesión desde su menú; una comprobación posterior confirmó que estaba activa. La ausencia de banner con sesión iniciada es el comportamiento esperado. Falta comprobar la carga sin sesión y recorrer los demás casos manuales. El script de la skill InstalarCel no se usó porque apunta a rutas de otro proyecto y no valida el paquete esperado.
- Fase 5, diagnóstico posterior: se repitió el cierre forzado y la apertura sin Wi-Fi. El menú de sesión mostró «Sesión activa: Leo» tanto antes como después de reiniciar: Firebase Auth sí conservó la sesión. Antes de desconectar, Clientes mostraba registros de A; después del reinicio sin red, la lista quedó vacía. Logcat registró `failed-precondition` al obtener acceso exclusivo a la capa de persistencia de Firestore y el SDK indicó que retrocedía a caché de memoria. La causa confirmada de la lista vacía en esta ejecución es ese retroceso; queda por probar una corrección y la persistencia de escrituras tras reiniciar. Se restauró el Wi-Fi del POCO. La web usa caché en memoria por decisión documentada y su prueba sin red sigue pendiente.
- Fase 5, corrección aprobada por Leo: `src/configuracion/firebase.ts` usa `persistentMultipleTabManager()` solo en Android. La compilación Android y la APK debug terminaron bien; se verificó el paquete `com.calculatupresupuesto.app` y se instaló en el POCO. Con A y clientes visibles, se apagó el Wi-Fi, se forzó el cierre y se abrió la app: los clientes siguieron visibles y no se repitió el aviso de retroceso a memoria. Sin red se modificó un teléfono sintético del cliente A; el valor persistió tras otro cierre y apertura. Al restaurar Wi-Fi, la ficha del mismo cliente en la SPA mostró el nuevo valor. Wi-Fi restaurado.
- Fase 5, SPA web con la cuenta B: con la pestaña abierta se simuló ausencia de red, se recorrieron lista y ficha de un cliente sintético, y se guardó un teléfono de prueba. Tras recuperar la conexión y recargar la página, el valor seguía visible. No se observó el aviso de sincronización. Esta prueba no demuestra apertura o recarga de la SPA sin red; la web conserva intencionalmente caché en memoria y no tiene PWA habilitada.

## Confirmaciones de Leo del 4 de noviembre de 2026

- Leo confirmó que el banner de AdMob aparece al cerrar sesión y se oculta al iniciar sesión. El comportamiento principal de publicidad queda aprobado por él; los casos adicionales de consentimiento, error de red, giro y tamaños de pantalla de la fase 6 no constan como comprobados.
- Leo se encargará de firmar el AAB. Los datos de la cuenta de prueba `.03` ya están exportados a JSON y Pablo guardará sus datos aparte; no se requiere migrar esos datos sintéticos a producción.

## Registro de ejecución del 4 de noviembre de 2026

- POCO Android `0.0.7`, visitante: Descargar e Imprimir en la vista previa abrieron el inicio de sesión; Enviar permaneció deshabilitado y la vista conservó la marca de prueba. En la cuenta A y luego en B, Descargar guardó el PDF en Documentos. Imprimir no abrió diálogo ni mostró aviso con sesión activa; `VistaPreviaPresupuestoPage.vue` llama a `window.print()` en Android. La salida Enviar con destinatario ya había abierto la hoja de compartir el 3 de noviembre; no se envió nada.
- Sincronización de presupuestos: la cuenta A mostró en el POCO el estado «Pendiente» restablecido desde web para «Prueba CH cuenta A». La cuenta B no mostró ese presupuesto nuevo de A, creado después de la importación deliberada.
- Android → web, configuración: se guardó en el POCO el nombre sintético «Developer CH prueba». Después de iniciar sesión con A en la SPA local, la cabecera y Configuración mostraron ese valor sin intervención manual sobre los datos. Se restauró «Developer» desde web; tras reiniciar la app Android con Wi-Fi activo, la cabecera volvió a mostrar «Developer». Queda confirmado el recorrido en ambos sentidos para configuración.
- Sin Wi-Fi y sin red móvil, el POCO mantuvo la sesión y mostró después de reiniciar el nombre de empresa temporal, «Prueba CH material A» y el presupuesto de A con estado «Pendiente». Se restauró el Wi-Fi y se comprobó red activa. Esto cierra la lectura persistente sin red para material, presupuesto y configuración; la edición simultánea web/Android aún no se probó.
- La herramienta de control de una ventana existente de Chrome se detuvo porque no pudo determinar su URL. La SPA local sí se abrió en un navegador de pruebas separado y permitió completar la verificación anterior. No hubo cambios de código, compilaciones, linters ni pruebas automatizadas en esta ejecución.

## Decisión del 5 de noviembre de 2026

- Leo pidió retirar Imprimir de Android y dejarlo solo en PC. `VistaPreviaPresupuestoPage.vue` muestra ahora el botón únicamente en navegador de escritorio; `ModalInicioSesion.vue` omite «imprimir» en las demás plataformas. Descargar y Enviar conservan su comportamiento. El código quedó actualizado, pero no se ejecutaron la app, pruebas, linters ni compilaciones por la regla de `AGENTS.md`; falta comprobar visualmente la nueva versión y compilar una APK con aprobación explícita antes de verla en el POCO.

- Confirmación posterior de Leo: Imprimir ya se comporta como pidió en Android y PC, y la exportación JSON desde web funciona. Decidió dejar como tareas futuras la prueba de ediciones simultáneas y la comprobación del aviso de sincronización.

## Fase 3 completada el 5 de noviembre de 2026

- En Android `0.0.7`, con la cuenta de prueba, se rechazó un archivo JSON `{}` antes de importar. Una edición temporal sin guardar bloqueó la descarga de copia con el aviso correspondiente; se descartó al salir y se confirmó que el nombre original permanecía.
- En Chrome del POCO, la vista previa como visitante no mostró Imprimir y Descargar abrió el inicio de sesión. En la SPA local de PC con sesión, Descargar PDF funcionó desde el presupuesto de prueba y su vista previa. Leo ya había confirmado Imprimir en PC y su ausencia en Android.
- La copia JSON exportada desde la SPA local tenía el tipo esperado, versión 1 y las secciones clientes, materiales, presupuestos y configuración. Se verificó únicamente su estructura; no se registraron los datos. La importación repetida y la copia externa Android ya estaban comprobadas en ejecuciones anteriores.
