# Firebase: avance del entorno de pruebas (30 de octubre de 2026)

## Configuración aplicada

- Cuenta de trabajo: la de desarrollo indicada en `Memory.md`. Proyecto `calculatupresupuesto-pru-b2e9a`, separado de la app publicada, plan Spark.
- Cloud Firestore Standard en `southamerica-east1`; reglas publicadas por CLI. Solo el `uid` dueño con correo verificado puede acceder a clientes, materiales, presupuestos y configuración. Rutas no declaradas permanecen cerradas.
- Firebase Authentication con correo/contraseña y Google. `localhost` está autorizado para pruebas web. Se registraron app web y app Android `com.calculatupresupuesto.app`; solo las huellas SHA de depuración.
- Configuración web en `.env.local` y configuración Android en `google-services.json`, ambos ignorados por Git. Se comprobó que este último corresponde al proyecto y paquete correctos.
- No se activaron Blaze, Storage, Analytics ni Functions. El logo se limita a 350 KB en documento; cualquier registro mayor a 900 KB se rechaza.

## Código y pruebas

- Se eliminó el usuario/contraseña provisional del código y del entorno local. La cuenta Firebase registra, verifica, recupera contraseña, inicia sesión con Google y permite vincular Google a una cuenta existente.
- Los cuatro repositorios seleccionan almacenamiento local para visitantes y Firestore por `uid` para cuentas autenticadas. Los stores se limpian al cambiar de cuenta, se remontan las páginas y se ignoran lecturas tardías. Las escrituras que aún no reciben confirmación del servidor quedan en la cola local y muestran su estado. Las copias JSON se importan bajo la cuenta activa y se abortan si cambia durante la operación.
- Pasaron `npm run typecheck`, `npm run lint:check`, `npm run build`, `npm run build:android`, seis pruebas de reglas con emulador y dos pruebas locales (importación repetida y escritura pendiente). La compilación Android fue local; no se instaló sobre el teléfono ni se publicó. El registro web se revisó visualmente a 390 px sin desbordamiento ni errores de consola.

## Pendientes antes de considerar cerrada la prueba

- Probar con cuentas sintéticas los flujos completos de correo, Google y cambio de cuenta en navegador y Android; comprobar que el mismo `uid` muestra los mismos datos en ambos.
- Registrar la huella SHA de la firma de Play antes de publicar Android. Solo están registradas las de depuración; la compilación local no verifica Google Login en una versión firmada para producción.
- Comprobar edición sin red y al reconectar. El SDK tiene caché persistente en Android y caché en memoria en web, pero la experiencia de guardado sin red todavía no está validada.
- Probar manualmente una importación JSON en Firestore y Descargar, Imprimir y Enviar con cuenta y como visitante. La repetición idempotente ya pasó en repositorios locales con datos sintéticos.
- Revisar privacidad y Seguridad de los datos de Play antes de publicar. Configurar variables web en el entorno de despliegue cuando se decida publicar la SPA.
- Revisar la contraseña provisional que quedó en el historial Git antes de `v0.0.7`; si se reutilizó fuera de esta app, cambiarla allí.

## Comprobaciones posteriores (2 de noviembre de 2026)

- Android `0.0.7`, cuenta de prueba por correo `.03`: recuperación aprobada. La solicitud desde «Olvidé mi contraseña» mostró el aviso genérico; el correo real y el formulario de cambio llegaron en español. La nueva contraseña permitió iniciar sesión, la anterior fue rechazada y se restauró la sesión. La credencial local ignorada por Git quedó actualizada sin registrar la clave aquí.
- Android `0.0.7`: la cuenta Google y la cuenta `.03` ya existían; Leo confirmó que ambas contienen solo datos de prueba. La creación y verificación de una tercera cuenta no era necesaria.
- Web local como visitante: vista previa con marca de prueba; Descargar PDF e Imprimir solicitan iniciar sesión; Enviar aparece deshabilitado. Falta repetir en Android y con sesión iniciada.
- Android `0.0.7`, aislamiento aprobado: en A (correo de prueba `.03`) se creó «Prueba CH cuenta A» y persistió tras detener y reabrir la app, con la sesión intacta. Al entrar en B (Google de prueba), Clientes estaba vacío; se creó «Prueba CH cuenta B» y persistió tras reabrir. Al volver a A, la búsqueda de B no encontró coincidencias.
- SPA local, aislamiento aprobado: Google B mostró «Prueba CH cuenta B» creado en Android y no encontró al cliente A. El correo de prueba A mostró «Prueba CH cuenta A» creado en Android y no encontró al cliente B.
- Android `0.0.7`, respaldo parcial: A exportó una copia JSON a la carpeta Download del POCO, fuera de la app. Se verificó que el archivo existe y tiene el formato `calcula-tu-presupuesto-respaldo`, versión 1, con 5 clientes, 6 materiales, 5 presupuestos y configuración. La copia temporal para la importación está fuera del repositorio.
- SPA local, importación A → B aprobada: la vista previa mostró 5 clientes, 6 materiales y 5 presupuestos nuevos, más la configuración faltante; la confirmación identificó la cuenta Google B como destino. Tras importar, el cliente propio de B seguía presente junto con los de A. Al seleccionar otra vez el mismo archivo, el resumen mostró cero altas y preservación de la configuración existente. Los registros de A presentes en B desde este punto son resultado esperado de la importación.

## Comprobaciones posteriores (3 de noviembre de 2026)

- POCO Android `0.0.7`, A: el respaldo JSON se guardó nuevamente en `Download` antes de cortar el Wi-Fi. Sin red activa y sin SIM, se editaron un cliente y un material sintéticos; las fichas mostraron los cambios y el material avisó que la sincronización quedaba pendiente. Al reconectar, la SPA de A mostró ambos cambios. La escritura local y la confirmación remota pasaron para esos dos documentos.
- POCO Android `0.0.7`, A: los primeros arranques con Wi-Fi apagado mostraron la cabecera genérica y Clientes vacío. Auth conservó la sesión; Logcat informó `failed-precondition` al abrir la persistencia Firestore y retroceso a memoria. El fallo se corrigió y se volvió a probar más adelante, según el último punto de esta sección. No se comprobó el aviso de sincronización posterior al reinicio.
- Sincronización A: web creó material y presupuesto sintéticos que aparecieron en Android; Android modificó cliente, material y estado de presupuesto, y web mostró los cambios. Web restauró el estado pendiente y los datos temporales de empresa. La configuración cambiada en web apareció en Android tras reiniciar, pero no al entrar de nuevo en la sección. B no recibió las altas nuevas de A posteriores a la importación.
- Salidas y copias: el PDF del presupuesto se guardó en Documentos de Android; Enviar abrió la hoja de compartir sin enviar. Imprimir en Android no mostró una acción visible. Un JSON inválido se rechazó en web. Configuración mostró cambios sin guardar y los descartó al navegar, sin advertencia adicional. Falta la prueba de salidas como visitante en Android y la validación completa de Imprimir.
- Publicidad: Leo aprobó activar `PUBLICIDAD_DE_PRUEBA`, compilar e instalar. Pasaron la compilación Android y la APK debug firmada del paquete correcto se instaló en el único POCO. No se veía el banner porque había una sesión activa, lo cual coincide con la regla del producto. Falta comprobar la carga como visitante y los casos de consentimiento e interfaz.
- Corrección de caché Android aprobada: Firestore ahora usa acceso compartido a su caché persistente solo en Android. La APK debug del paquete correcto se instaló en el POCO. Con A, Clientes siguió visible después de cerrar y abrir sin Wi-Fi; una edición sintética también sobrevivió a otro reinicio sin red y apareció en la SPA tras reconectar. No volvió a registrarse el retroceso de Firestore a memoria. Se dejó el Wi-Fi encendido.
- Web con B: con la pestaña abierta y sin red simulada, la lista y la ficha de un cliente sintético siguieron accesibles y se guardó un teléfono de prueba. Al reconectar y recargar, el valor persistió. No se vio el aviso de sincronización; una recarga de la SPA mientras sigue sin red no está validada y no forma parte del diseño actual de caché en memoria.
- 5 de noviembre, POCO Android `0.0.7`, cuenta A: la recuperación de contraseña sin Wi-Fi mostró el error de conexión; tras reconectar, el reintento mostró la respuesta genérica esperada. No se verificó la recepción del correo en este reintento. La edición simultánea y el aviso de sincronización siguen trasladados a tareas futuras.

## Comprobaciones posteriores (4 de noviembre de 2026)

- POCO Android `0.0.7`, visitante: Descargar e Imprimir en vista previa solicitaron inicio de sesión; Enviar quedó deshabilitado. Con A y B, Descargar guardó el PDF en Documentos. Imprimir con sesión activa no abrió diálogo ni mostró aviso en dos presupuestos. El código usa `window.print()` en esa pantalla, por lo que la impresión Android continúa pendiente de corrección. Enviar con destinatario ya había abierto la hoja de compartir sin envío el día anterior.
- Presupuestos: el estado «Pendiente» restablecido desde web volvió a verse en el POCO para el presupuesto sintético de A. B no mostró esa alta de A posterior a la importación.
- Configuración: Android guardó el nombre sintético «Developer CH prueba» y web A lo mostró en su cabecera y formulario. Web restauró «Developer»; tras reiniciar Android con Wi-Fi, la cabecera volvió a «Developer». Sin Wi-Fi, antes de restaurar el valor, la configuración temporal, el material sintético y el presupuesto de A permanecieron visibles tras reiniciar. Wi-Fi restablecido y red activa al terminar.
- La comprobación web se hizo en la SPA local mediante un navegador de pruebas. El control de una ventana de Chrome existente no pudo confirmar su URL; no afectó la prueba posterior. No hubo cambios de código ni compilación. Quedan pendientes la impresión Android, algunos casos de salida y respaldo, el aviso visible de sincronización, la edición simultánea y las pruebas adicionales de publicidad e interfaz.

## Decisión posterior (5 de noviembre de 2026)

- Leo decidió que Imprimir quede solo en navegador de escritorio. El botón de la vista previa se ocultó en Android y navegador móvil; el texto de inicio de sesión se ajustó para esas plataformas. Todavía no se ejecutó una compilación ni se instaló una APK con este cambio, por lo que el comportamiento anterior sigue en la versión `0.0.7` instalada en el POCO.

## Cierre de salidas y copias (5 de noviembre de 2026)

- Leo confirmó que Imprimir quedó como pidió en Android y PC. En Chrome del POCO, la vista previa no mostró Imprimir y la descarga como visitante solicitó inicio de sesión. Con sesión en la SPA de PC se descargó el PDF desde el presupuesto y desde la vista previa.
- La exportación JSON de la SPA produjo el tipo esperado, versión 1 y las cuatro secciones de datos. En el POCO, un JSON inválido se rechazó; una configuración modificada sin guardar impidió generar una copia y mostró la indicación de guardar o descartar. Se descartó el cambio de prueba y se comprobó el valor original.
- La fase 3 del plan de cierre queda completada junto con las pruebas previas de copia externa, importación repetida y hoja de compartir. No se enviaron presupuestos a terceros.

## Cuentas y vinculación (5 de noviembre de 2026)

- En el POCO, la cuenta A intentó vincular la cuenta Google B, ya asociada a otro usuario. La app mostró que la cuenta Google ya estaba vinculada a otro usuario; tras reiniciar se mantuvieron la sesión A y su cliente de prueba. No se vinculó ni fusionó ninguna cuenta.
- La cuenta A mostró el mismo UID en Android y la SPA de PC; se comparó sin registrar el identificador. Su sesión se conservó al reiniciar Android y recargar la web.
- Una cuenta Google libre se vinculó correctamente a A desde el POCO. Tras cerrar sesión y entrar con Google se verificó el mismo UID y el cliente de prueba. En la sesión web existente, Firebase reconoce también el proveedor vinculado.
- Leo confirmó que probó la vinculación desde la web. La cuenta B ya pertenecía a otro usuario y la vinculación de Google con A se restauró tras la prueba anterior en Android.

## Registro nuevo (6 de noviembre de 2026)

- POCO Android `0.0.7`: se creó una cuenta sintética con un alias de la casilla de prueba. La app rechazó el ingreso antes de verificar; el mensaje de verificación llegó a la casilla, la página confirmó la verificación y el ingreso posterior funcionó. Los datos de acceso se guardaron únicamente en el archivo privado ignorado. No se comprobó el reenvío de verificación.
- Leo confirmó el desplazamiento táctil del formulario con teclado abierto. En orientación horizontal, con el formulario de registro abierto, el banner de prueba apareció hacia la izquierda y Leo aceptó esa posición; la revisión responsiva restante sigue pendiente.
- SPA local: se comprobó mediante medidas que el cuadro de registro cabe en la ventana sin desbordamiento horizontal a 390 × 844 y 1440 × 900; se comprobó también el cuadro de inicio en escritorio. No se simuló teclado móvil ni se evaluó accesibilidad completa.

- 6 de noviembre, edición simultánea con cuenta de prueba: se abrió el mismo cliente sintético en la SPA y el POCO antes de modificarlo. Se guardó primero el nombre web y luego el nombre Android; al recargar la SPA apareció el nombre Android. La última escritura prevaleció en este caso. El cliente creado para la prueba se eliminó después.

## Testing posterior del 6 de noviembre de 2026

- SPA local autenticada: Enviar generó el PDF y preparó un enlace de WhatsApp para un presupuesto sintético. Se interceptó la apertura; no se envió ningún mensaje. El presupuesto y el PDF temporales se eliminaron.
- En web se rechazó un logo mayor de 350 KB con su mensaje específico. Un cliente mayor de 900 KB se rechazó sin guardarse, pero inicialmente mostró un error genérico. Leo autorizó corregirlo: tras el cambio se mostró el mensaje específico al crear y editar en web y al crear en el POCO con la nueva APK. En ancho móvil no se observó desbordamiento.
- `npm run typecheck` y la comprobación de Prettier y ESLint del archivo modificado pasaron. `npm run lint:check` general informó formato previo en `src/css/app.css` y en este resumen. La compilación Android y `assembleDebug` pasaron; se verificó el paquete y se instaló la APK en `f18c5937`.
- En web, inicio, registro y recuperación a 390 × 844 y 1440 × 900 no mostraron desbordamiento horizontal; sus controles visibles tuvieron nombre y posibilidad de foco. No se ha probado todavía un lector de pantalla.
- En Android se creó una cuenta sintética sin verificar y la app confirmó el reenvío tras completar nuevamente los campos. Los primeros intentos mostraron un error genérico, pero no permiten concluir que exista un fallo reproducible de la app. Gmail del POCO mostró mensajes de verificación en el buzón de prueba; desde la lista no se pudo identificar con certeza el último reenvío, así que su llegada sigue sin confirmarse.
- Revisión posterior de accesibilidad web: en los cuatro modos del diálogo, Tab recorrió los controles sin alcanzar controles interactivos del fondo; al completar el ciclo pasó por el cuerpo antes de volver al diálogo. El diálogo tiene `aria-modal`, pero no un nombre accesible asociado a su título visible. Se propuso corregirlo; queda pendiente la prueba con lector de pantalla.
- Corrección autorizada por Leo: el título visible del diálogo quedó asociado mediante `aria-labelledby`. El árbol de accesibilidad del navegador mostró el nombre correcto en inicio, registro, recuperación y verificación. Pasaron `typecheck`, Prettier y ESLint del componente. No se ha probado un lector de pantalla real ni se compiló una APK con este cambio.
- Después se compiló e instaló en `f18c5937` una APK debug autorizada, con el paquete comprobado y publicidad de prueba. El árbol de accesibilidad de Android mostró los cuatro nombres correctos. Se activó TalkBack, pero el tutorial impidió completar la prueba auditiva con el control USB; se desactivó y se verificó que volvió a su estado previo. La prueba con lector real continúa pendiente.
- El 7 de noviembre se retomó la prueba con TalkBack: Leo confirmó que el lector leyó el título del acceso y anunció de forma comprensible los controles de correo, contraseña y «Entrar». TalkBack se dejó desactivado, como estaba antes. No se comprobó auditivamente el recorrido completo de los demás modos.
- En una segunda pasada, Leo confirmó que TalkBack leyó de forma comprensible los títulos de registro, recuperación y verificación. El lector volvió a quedar desactivado; no se comprobó auditivamente cada control de esos modos.
- El 7 de noviembre, Leo confirmó que todo está bien respecto de TalkBack y pidió dar por terminada la revisión relacionada. Se cierra por su conformidad, manteniendo la distinción de los controles que CH no observó auditivamente.
- El 7 de noviembre, Leo mostró la conversación de la cuenta sintética: llegaron varios correos de verificación con el asunto y el cuerpo en español. Se confirma la recepción del reenvío; no se abrió ningún enlace como parte de esta comprobación.

## Comprobaciones del 7 de noviembre de 2026

- Con una misma cuenta de prueba, se crearon cliente, material y presupuesto sintéticos y se modificó la configuración en el POCO. Los cuatro cambios aparecieron en la web; la configuración requirió recargar. Después se editaron los cuatro desde la web y se observaron en Android. Se restauró la configuración y se eliminaron los tres registros temporales.
- Los cuatro formularios de acceso pasaron una revisión geométrica de controles y desbordamiento en la web a 390 × 844 y 1440 × 900. En el POCO, con teclado abierto, los controles se pudieron alcanzar mediante desplazamiento programático y las validaciones de campos vacíos no desbordaron; Leo había confirmado el gesto táctil en la prueba anterior.
- Chrome del POCO abrió la app de desarrollo por la dirección de red local, pero la pantalla quedó en blanco en HTTP no seguro; el contexto no proporcionaba `crypto.randomUUID`. Esa apertura no permite aprobar la revisión de formularios en Chrome móvil. No se modificó código ni configuración del navegador para esta comprobación.
