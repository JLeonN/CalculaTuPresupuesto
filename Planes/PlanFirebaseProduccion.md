# Firebase de producción y conservación del entorno de pruebas

## Descripción del plan

Preparar un proyecto Firebase independiente para la aplicación publicada, conservar el proyecto actual para experimentar y dejar un procedimiento claro para seleccionar el entorno en web y Android. Leo genera y firma el AAB y gestiona Play Console; CH prepara Firebase, las huellas, GitHub y la información necesaria para la revisión.

## Objetivo principal

- Conectar producción a Authentication y Firestore propios, con reglas de acceso verificadas.
- Mantener pruebas y producción separados y evitar combinar configuraciones web y nativas.
- Preparar el acceso de Google Play mediante una cuenta de revisión con datos ficticios.

## Contexto técnico verificado

- Leer `AGENTS.md`, `README.md`, `Memory.md` y las referencias comerciales necesarias antes de implementar. Esperar aprobación explícita de Leo para modificar código y otra para compilar; no ejecutar app, pruebas ni linters sin pedido explícito.
- Usar la cuenta de desarrollo indicada en `Memory.md` y verificar la cuenta activa antes de crear recursos. Leo completa PIN, MFA y consentimientos.
- Firebase de pruebas es `calculatupresupuesto-pru-b2e9a`, Firestore está en `southamerica-east1` y las reglas locales están en `firestore.rules`. No alterar ni borrar su configuración, cuentas o datos.
- `src/configuracion/firebase.ts` lee seis variables `QCLI_FIREBASE_*`; la autenticación nativa de `src/servicios/autenticacion/ServicioAutenticacionFirebase.ts` usa `@capacitor-firebase/authentication` y necesita configuración Android coherente con la web. `src-capacitor/capacitor.config.ts` conserva `com.calculatupresupuesto.app`.
- `.env.local` y `src-capacitor/android/app/google-services.json` están ignorados. `.firebaserc` define los alias `pruebas` y `produccion`. El workflow local recibe las variables Firebase de producción; GitHub Pages se publica al hacer push a `main` o mediante ejecución manual.
- Los datos de visitantes son locales; las cuentas verificadas usan Firestore por UID. Las cuentas y datos del entorno de pruebas no se migran automáticamente. Pablo conserva una copia JSON para importar cuando corresponda.
- Las claves de configuración Firebase del cliente son identificadores públicos; la seguridad depende de Authentication, reglas y configuración de servicios. No guardar credenciales ni datos reales en archivos versionados. La excepción local de credenciales autorizada por `AGENTS.md` se mantiene ignorada.

## Alcance

### Incluye

- Crear Firebase de producción, registrar las apps web y Android, configurar Authentication y Firestore y publicar reglas e índices locales.
- Selección explícita y documentada de entornos para web y Android, huellas de firma y variables de GitHub Actions.
- Preparar una cuenta de revisión dedicada y las instrucciones para Play Console.

### No incluye

- Generar o firmar el AAB, subirlo ni gestionar la publicación en Play Console: Leo se encarga.
- Publicar la SPA, hacer push o crear commits sin solicitud explícita. No migrar automáticamente cuentas o datos de pruebas ni implementar pagos, suscripciones o exenciones.
- Crear un paquete o variante Android adicional, activar Blaze o servicios adicionales sin necesidad y autorización, ni modificar el proyecto de pruebas para convertirlo en producción.

## Mapa de cambios

| Archivo o recurso                           | Acción                                                 | Símbolos principales                          | Propósito                                                     |
| ------------------------------------------- | ------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------- |
| Firebase Console, proyecto nuevo            | Crear y configurar                                     | Authentication, Firestore, apps web y Android | Aislar producción                                             |
| `.firebaserc`                               | Modificar                                              | `projects.produccion`                         | Identificar el proyecto sin cambiar `pruebas`                 |
| `.env.example` y archivos locales ignorados | Actualizar contrato y preparar configuraciones locales | `QCLI_FIREBASE_*`                             | Separar parámetros por entorno                                |
| `scripts/seleccionar-firebase.mjs`          | Crear                                                  | selección explícita `pruebas` o `produccion`  | Instalar juntos los archivos web y Android correctos          |
| `package.json`                              | Modificar                                              | scripts de selección                          | Facilitar el cambio seguro de entorno                         |
| `.github/workflows/deploy-pages.yml`        | Modificar                                              | paso `Compilar SPA`, variables de Actions     | Compilar Pages con producción y fallar si falta configuración |
| GitHub, variables del repositorio o entorno | Configurar                                             | seis variables `QCLI_FIREBASE_*`              | Suministrar configuración pública de producción               |
| `README.md`, `Memory.md`                    | Actualizar                                             | secciones Firebase y decisiones reutilizables | Documentar operación y estado real                            |
| Firebase Authentication y Play Console      | Preparar cuenta e instrucciones                        | cuenta de revisión                            | Permitir revisión de funciones protegidas                     |

## FASE 1: Crear y proteger Firebase de producción

### Objetivo

Disponer de recursos de producción separados y configurados para las mismas funciones que pruebas.

### Pasos de ejecución

- [x] Verificar cuenta activa y recursos existentes para evitar duplicados; crear un proyecto de producción con nombre e identificador inequívocos, registrar el ID definitivo y conservar el proyecto de pruebas. Seleccionar Spark mientras alcance, sin activar facturación sin acuerdo de Leo.
- [x] Registrar app web y app Android `com.calculatupresupuesto.app`. Configurar Authentication con correo/contraseña y Google; revisar nombre público, correo de soporte, plantillas y enlaces de verificación y recuperación en español. Añadir el dominio efectivo de GitHub Pages a los dominios autorizados.
- [x] Crear Firestore en `southamerica-east1`, confirmar la ubicación antes de crear la base y publicar `firestore.rules` y `firestore.indexes.json` apuntando explícitamente al ID de producción. Comprobar que las reglas publicadas coinciden y restringen datos al propietario con correo verificado.
- [x] Añadir a `.firebaserc` el alias `produccion` con el ID real, conservando `pruebas`; usar siempre `--project` explícito en operaciones de despliegue. No copiar cuentas ni datos de prueba.

## FASE 2: Seleccionar entorno y registrar firmas

### Objetivo

Poder preparar una compilación coherente para cada entorno conservando el paquete Android actual.

### Pasos de ejecución

- [x] Crear `scripts/seleccionar-firebase.mjs`, ejecutado con Node, que acepte exclusivamente `pruebas` o `produccion` y lea configuraciones locales ignoradas `.env.firebase.pruebas`, `.env.firebase.produccion`, `google-services.pruebas.json` y `google-services.produccion.json`. Agregar las rutas exactas de los dos JSON a `.gitignore`; `.env*` ya está ignorado. Obtener los JSON oficiales desde el proyecto y app Android correspondientes y preservar la configuración actual de pruebas antes de cualquier sustitución.
- [x] El script debe validar antes de escribir que ambos archivos de origen existen, que las variables obligatorias (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `APP_ID`, con prefijo `QCLI_FIREBASE_`) están completas, que el `project_id` del JSON coincide con `QCLI_FIREBASE_PROJECT_ID`, y que el JSON contiene el paquete Android esperado. Ante error, informar sin imprimir valores ni modificar destinos. Tras validar, copiar ambos archivos a `.env.local` y `src-capacitor/android/app/google-services.json`; mostrar solo entorno e ID de proyecto. Si falla alguna copia, restaurar ambos destinos previos y avisar; nunca dejar una pareja mezclada.
- [x] Agregar a `package.json` los scripts `firebase:pruebas` y `firebase:produccion` que invoquen el selector con el argumento correspondiente. Actualizar `.env.example` como contrato sin valores reales y `README.md` con rutas, comandos, advertencia de reiniciar Quasar y verificación del entorno antes de cada compilación.
- [x] Obtener de Play Console las huellas SHA-1 y SHA-256 del certificado de firma de la aplicación y registrar las necesarias en la app Android de Firebase de producción; si no están disponibles, documentar el paso como pendiente y no afirmar que Google Login publicado quedó validado. Registrar también las huellas de otras firmas solo si se utilizarán en ese proyecto. Nunca solicitar ni copiar clave privada o contraseña.
- [x] Descargar nuevamente el `google-services.json` de producción después de configurar Google y huellas; verificar proyecto y paquete. Preparar las configuraciones sin compilar ni instalar hasta autorización específica de Leo.

## FASE 3: Conectar GitHub Pages a producción

### Objetivo

Preparar el workflow para compilar con Firebase de producción sin publicar todavía.

### Pasos de ejecución

- [x] En GitHub configurar las seis variables públicas `QCLI_FIREBASE_API_KEY`, `QCLI_FIREBASE_AUTH_DOMAIN`, `QCLI_FIREBASE_PROJECT_ID`, `QCLI_FIREBASE_APP_ID`, `QCLI_FIREBASE_STORAGE_BUCKET` y `QCLI_FIREBASE_MESSAGING_SENDER_ID` con los valores de la app web de producción; comprobar repositorio y cuenta antes de escribir. Mantener secretos reales fuera de estas variables.
- [x] En `.github/workflows/deploy-pages.yml`, pasar las seis variables del contexto `vars` al entorno del paso `Compilar SPA`. Añadir validación previa que falle de forma explícita si falta una variable obligatoria o el proyecto no coincide con producción, sin imprimir valores sensibles. No cambiar el disparador ni ejecutar el workflow sin solicitud de Leo.
- [x] Documentar en `README.md` dónde se configuran las variables, que se incorporan al compilar y que son públicas, y que el despliegue existente se activa con push a `main` o manualmente.

## FASE 4: Cuenta de revisión de Google Play

### Objetivo

Permitir que los revisores accedan a las funciones con sesión en la app de producción sin usar cuentas de clientes reales.

### Pasos de ejecución

- [x] Preparar la cuenta elegida por Leo para revisión en Firebase de producción con correo/contraseña, correo verificado y acceso a las funciones protegidas existentes. Leo decidió reutilizar su cuenta de pruebas con los datos que ya tenía, en lugar de una cuenta exclusiva. No se crearon mecanismos especiales de acceso ni se saltaron las reglas de Firestore.
- [x] Guardar las credenciales únicamente en `.credenciales-pruebas.local.md`, si Leo autoriza su uso para esta cuenta, y verificar que Git lo ignora; no imprimirlas ni incluirlas en el plan, archivos versionados, comandos o registros. Si no existe un correo adecuado o no es posible verificarlo, dejar la fase pendiente y solicitarlo a Leo.
- [ ] Preparar instrucciones breves en inglés para Play Console: abrir acceso, elegir correo y contraseña, ingresar con la cuenta de revisión y localizar las funciones protegidas. Explicar a Leo dónde cargar credenciales e instrucciones; él gestiona Play Console. Asegurar que la cuenta sea reutilizable y no requiera intervención, código temporal ni ubicación específica en cada revisión.
- [ ] Si posteriormente se implementan funciones de pago, revisar que la cuenta tenga acceso de revisión conforme a las reglas vigentes; pagos y exenciones no se implementan en este plan.

### Instrucciones preparadas para Play Console

Leo debe cargar el correo y la contraseña de la aplicación en **Política y programas > Contenido de la app > Datos de acceso**. El siguiente texto queda preparado en inglés y debe validarse con la cuenta antes de enviarlo a revisión:

```text
1. Open the app and tap “Iniciar sesión”.
2. Enter the email and password provided in the sign-in details, then tap “Entrar”.
3. Use “Clientes” and “Presupuestos” to review the sample data. For materials, tap “Más” and then “Materiales”.
4. Open a budget to review its preview and available export or sharing options.
```

El correo fue verificado y el acceso con contraseña se comprobó en la web y Android. Las credenciales constan en el archivo privado ignorado por Git; Leo debe cargarlas en Play Console. No incluir aquí ninguna contraseña ni credencial.

## FASE TESTING

### Objetivo

Comprobar aislamiento, autenticación y configuración web y Android; ejecutar comandos y pruebas solo cuando Leo lo solicite explícitamente.

### Pruebas automatizadas

- [ ] Con autorización, ejecutar `npm run typecheck`, `npm run lint:check`, `npm run test:firebase` y `npm run test:respaldo`; registrar resultados y distinguir fallos preexistentes. El test Firebase usa el proyecto emulado `demo-calcula-pruebas`, no producción.
- [ ] Con autorización para compilar, comprobar compilaciones de los entornos necesarios sin publicar. Verificar el selector con archivos de prueba locales, incluyendo proyecto incompatible y archivo ausente; confirmar que no deja destinos mezclados. No exponer claves o credenciales en salidas.

### Pruebas manuales

- [ ] Verificar en Firebase la configuración publicada, el dominio web, las huellas disponibles y el aislamiento: una cuenta sintética en cada proyecto no ve datos del otro; comprobar correo verificado, registro, recuperación e inicio con Google sin datos reales.
- [ ] Cuando Leo autorice la prueba Android, comprobar el proyecto seleccionado, la sesión y los datos correspondientes en el POCO dedicado; para Google Login distribuido por Play se requiere una versión firmada por Play. Anotar por separado cualquier validación pendiente de esa versión.
- [ ] Verificar que el workflow recibe las variables de producción y falla si faltan, sin desplegar salvo autorización. Confirmar que la cuenta de revisión puede iniciar sesión y acceder a las funciones previstas; Leo carga sus datos en Play Console.
- [ ] Actualizar `README.md` y, solo si corresponde, `Memory.md` con hechos comprobados, pendientes y procedimiento de importación JSON sin borrar el origen. Registrar bloqueos reales y pruebas no ejecutadas.

## Progreso del plan

- 9 de noviembre: se creó el proyecto `calculatupresupuesto-prod` en la cuenta de desarrollo y se registraron las apps web y Android. Firebase CLI creó inicialmente una base vacía en `nam5` al publicar las reglas. Con autorización de Leo, se eliminó y se recreó en `southamerica-east1`; se confirmó su región y nivel gratuito, y se publicaron las reglas y los índices locales. No se cargaron datos de usuarios. Authentication, huellas y demás pasos siguen pendientes; la fase 1 no está completa.

- [x] Fase 1: Crear y proteger Firebase de producción
- [x] Fase 2: Seleccionar entorno y registrar firmas
- [x] Fase 3: Conectar GitHub Pages a producción
- [ ] Fase 4: Cuenta de revisión de Google Play
- [ ] Fase Testing

Fecha de creación: 09 de noviembre de 2026  
Fecha de última actualización: 10 de noviembre de 2026  
Estado: EN PROCESO

Avance posterior del 9 de noviembre: Authentication tiene correo y Google habilitados, dominio de GitHub Pages autorizado y plantillas de verificación y recuperación en español latinoamericano; no se enviaron correos de prueba. Se registraron SHA-1 y SHA-256 de las firmas de Play actual y anterior y se descargó de nuevo el JSON Android de producción. Se prepararon archivos locales ignorados para ambos entornos, el selector y el workflow; los archivos activos siguen siendo los de pruebas. Se guardaron las seis variables en GitHub Actions. Leo decidió dejar la cuenta de revisión pendiente hasta elegir el correo. No se ejecutaron app, pruebas, linters, compilaciones ni publicación; falta verificar el selector y los flujos reales antes de completar las fases restantes.

Avance posterior: Leo eligió una cuenta de pruebas existente para la revisión, creó personalmente un usuario con correo y contraseña en producción y pidió conservar los datos originales. Se copiaron a esa cuenta 6 clientes, 6 materiales, 6 presupuestos y 1 configuración desde pruebas, sin borrar el origen. La cuenta de producción todavía tiene el correo sin verificar y no puede acceder a sus datos con las reglas actuales. Leo anotará la contraseña en el archivo privado y cargará las credenciales en Play Console; aún no se entregaron a Google. Queda pendiente verificar el correo y comprobar el acceso de revisión.

Comprobaciones posteriores autorizadas por Leo: el selector pasó a producción y restauró exactamente los archivos iniciales de pruebas; rechazó un entorno inválido. Pasaron `typecheck`, las dos pruebas de respaldo, las seis pruebas de reglas en emulador y ESLint. El formato general señaló dos archivos preexistentes; se corrigió el formato de este plan. No se compiló ni publicó. La app local iniciada temporalmente en producción aceptó la contraseña de la cuenta de revisión, pero el reenvío de verificación mostró un error genérico; se investiga antes de dar por validado el acceso.

Diagnóstico posterior: Firebase devolvió `auth/too-many-requests` durante el reenvío; no se identificó si el límite corresponde al ingreso o al envío ni cuándo se levantará. La contraseña sí permitió alcanzar el aviso de correo sin verificar. Se retiró el diagnóstico temporal, se detuvo la app local y se restauró la configuración de pruebas. Quedan pendientes el reintento de verificación, la comprobación de acceso con la cuenta y las pruebas finales.

Comprobación adicional: el selector rechazó archivos ausentes y un proyecto incorrecto en una carpeta temporal aislada, sin modificar los archivos de destino. Se prepararon instrucciones en inglés para la revisión de Play, pendientes de validación con la cuenta verificada.

Revisión de GitHub: las seis variables del repositorio coinciden con la configuración web de producción y Pages está configurado con GitHub Actions. El workflow actualizado está en el commit local, pero todavía no en `main` remoto; las ejecuciones anteriores corresponden al workflow anterior. La publicación y la comprobación del workflow desplegado siguen pendientes de que Leo decida hacer push.

10 de noviembre: Leo solicitó el reenvío desde la app local de producción y completó la verificación con el correo más reciente. Firebase confirmó que la dirección está verificada; Leo inició sesión con correo y contraseña y se observaron los 6 clientes, 6 materiales y 6 presupuestos copiados. Se cerró la sesión, se detuvo la app y se restauró la configuración local de pruebas. Falta validar las acciones de salida, la versión Android y la entrega de instrucciones a Play Console.

Comprobación posterior en el POCO `f18c5937`: la app Android instalada y las APK debug existentes contienen la configuración de Firebase de pruebas, por lo que no permiten validar Android con producción. La web publicada en GitHub Pages responde correctamente, su workflow remoto terminó con éxito y sus módulos contienen el identificador de Firebase de producción, no el de pruebas. Chrome del POCO abrió esa web y mostró el acceso; al seleccionar la cuenta de prueba para Google Login, Google solicitó una verificación de identidad y configuración de bloqueo de pantalla. No se completó la verificación ni se cambió la seguridad del teléfono. Siguen pendientes Google Login y las acciones autenticadas en móvil, así como una APK de producción autorizada para probar el acceso nativo.

Continuación: Leo configuró el bloqueo y completó personalmente la verificación de Google. En Chrome del POCO, Google Login abrió una sesión en la web de producción y apareció un cliente de ejemplo previamente copiado. Esta comprobación corresponde a la web móvil, no a la app Android nativa. Leo indicó que no desea conservar el bloqueo de pantalla en este teléfono de pruebas; debe retirarlo él si así lo decide. Las demás acciones autenticadas y la APK nativa de producción siguen pendientes.

Prueba Android del 10 de noviembre: con autorización de Leo se compiló e instaló en el POCO una APK debug conectada a producción, con publicidad de prueba; la app abrió y se confirmó el paquete. Luego se restauró el selector local a pruebas. El acceso con Google no se completó. La huella debug de esta PC ya pertenece a otro proyecto OAuth con el mismo paquete y Firebase rechazó registrarla también en producción (conflicto 409). No se modificó la firma del proyecto de pruebas. Una firma debug distinta requeriría una nueva instalación incompatible con la firma actual, por lo que hay que preservar o respaldar primero los datos locales del teléfono. La validación con la firma de Play sigue pendiente de una distribución firmada por Play. La contraseña de la cuenta de revisión no consta en el archivo privado; no se entregaron credenciales a Google Play.

Se corrigió el formato de los dos archivos señalados anteriormente y `npm run lint:check` pasó completo, incluyendo Prettier y ESLint. El resto de las pruebas automatizadas aprobadas está registrado arriba; las comprobaciones pendientes no se dan por terminadas.

Prueba posterior en Android: la contraseña anotada en el archivo privado permitió ingresar en la APK de producción del POCO. Se consultaron presupuestos y materiales, se abrió la vista previa y se comprobó que se creó un PDF en Documentos. Se detectó que la pantalla «Más» mostraba «Próximamente» en Materiales y Configuración aunque sus enlaces funcionan; con autorización de Leo se quitó el texto del código. El cambio todavía no está compilado en la APK instalada. El acceso con Google de la APK debug y de una distribución firmada por Play sigue pendiente. Leo conserva la gestión de Play Console y del AAB.
