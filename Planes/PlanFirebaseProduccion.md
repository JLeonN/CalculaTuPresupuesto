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
- `.env.local` y `src-capacitor/android/app/google-services.json` están ignorados. `.firebaserc` solo define el alias `pruebas`. El workflow `.github/workflows/deploy-pages.yml` compila sin variables Firebase. GitHub Pages se publica al hacer push a `main` o mediante ejecución manual.
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

| Archivo o recurso | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| Firebase Console, proyecto nuevo | Crear y configurar | Authentication, Firestore, apps web y Android | Aislar producción |
| `.firebaserc` | Modificar | `projects.produccion` | Identificar el proyecto sin cambiar `pruebas` |
| `.env.example` y archivos locales ignorados | Actualizar contrato y preparar configuraciones locales | `QCLI_FIREBASE_*` | Separar parámetros por entorno |
| `scripts/seleccionar-firebase.mjs` | Crear | selección explícita `pruebas` o `produccion` | Instalar juntos los archivos web y Android correctos |
| `package.json` | Modificar | scripts de selección | Facilitar el cambio seguro de entorno |
| `.github/workflows/deploy-pages.yml` | Modificar | paso `Compilar SPA`, variables de Actions | Compilar Pages con producción y fallar si falta configuración |
| GitHub, variables del repositorio o entorno | Configurar | seis variables `QCLI_FIREBASE_*` | Suministrar configuración pública de producción |
| `README.md`, `Memory.md` | Actualizar | secciones Firebase y decisiones reutilizables | Documentar operación y estado real |
| Firebase Authentication y Play Console | Preparar cuenta e instrucciones | cuenta de revisión | Permitir revisión de funciones protegidas |

## FASE 1: Crear y proteger Firebase de producción

### Objetivo

Disponer de recursos de producción separados y configurados para las mismas funciones que pruebas.

### Pasos de ejecución

- [ ] Verificar cuenta activa y recursos existentes para evitar duplicados; crear un proyecto de producción con nombre e identificador inequívocos, registrar el ID definitivo y conservar el proyecto de pruebas. Seleccionar Spark mientras alcance, sin activar facturación sin acuerdo de Leo.
- [ ] Registrar app web y app Android `com.calculatupresupuesto.app`. Configurar Authentication con correo/contraseña y Google; revisar nombre público, correo de soporte, plantillas y enlaces de verificación y recuperación en español. Añadir el dominio efectivo de GitHub Pages a los dominios autorizados.
- [ ] Crear Firestore en `southamerica-east1`, confirmar la ubicación antes de crear la base y publicar `firestore.rules` y `firestore.indexes.json` apuntando explícitamente al ID de producción. Comprobar que las reglas publicadas coinciden y restringen datos al propietario con correo verificado.
- [ ] Añadir a `.firebaserc` el alias `produccion` con el ID real, conservando `pruebas`; usar siempre `--project` explícito en operaciones de despliegue. No copiar cuentas ni datos de prueba.

## FASE 2: Seleccionar entorno y registrar firmas

### Objetivo

Poder preparar una compilación coherente para cada entorno conservando el paquete Android actual.

### Pasos de ejecución

- [ ] Crear `scripts/seleccionar-firebase.mjs`, ejecutado con Node, que acepte exclusivamente `pruebas` o `produccion` y lea configuraciones locales ignoradas `.env.firebase.pruebas`, `.env.firebase.produccion`, `google-services.pruebas.json` y `google-services.produccion.json`. Agregar las rutas exactas de los dos JSON a `.gitignore`; `.env*` ya está ignorado. Obtener los JSON oficiales desde el proyecto y app Android correspondientes y preservar la configuración actual de pruebas antes de cualquier sustitución.
- [ ] El script debe validar antes de escribir que ambos archivos de origen existen, que las variables obligatorias (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `APP_ID`, con prefijo `QCLI_FIREBASE_`) están completas, que el `project_id` del JSON coincide con `QCLI_FIREBASE_PROJECT_ID`, y que el JSON contiene el paquete Android esperado. Ante error, informar sin imprimir valores ni modificar destinos. Tras validar, copiar ambos archivos a `.env.local` y `src-capacitor/android/app/google-services.json`; mostrar solo entorno e ID de proyecto. Si falla alguna copia, restaurar ambos destinos previos y avisar; nunca dejar una pareja mezclada.
- [ ] Agregar a `package.json` los scripts `firebase:pruebas` y `firebase:produccion` que invoquen el selector con el argumento correspondiente. Actualizar `.env.example` como contrato sin valores reales y `README.md` con rutas, comandos, advertencia de reiniciar Quasar y verificación del entorno antes de cada compilación.
- [ ] Obtener de Play Console las huellas SHA-1 y SHA-256 del certificado de firma de la aplicación y registrar las necesarias en la app Android de Firebase de producción; si no están disponibles, documentar el paso como pendiente y no afirmar que Google Login publicado quedó validado. Registrar también las huellas de otras firmas solo si se utilizarán en ese proyecto. Nunca solicitar ni copiar clave privada o contraseña.
- [ ] Descargar nuevamente el `google-services.json` de producción después de configurar Google y huellas; verificar proyecto y paquete. Preparar las configuraciones sin compilar ni instalar hasta autorización específica de Leo.

## FASE 3: Conectar GitHub Pages a producción

### Objetivo

Preparar el workflow para compilar con Firebase de producción sin publicar todavía.

### Pasos de ejecución

- [ ] En GitHub configurar las seis variables públicas `QCLI_FIREBASE_API_KEY`, `QCLI_FIREBASE_AUTH_DOMAIN`, `QCLI_FIREBASE_PROJECT_ID`, `QCLI_FIREBASE_APP_ID`, `QCLI_FIREBASE_STORAGE_BUCKET` y `QCLI_FIREBASE_MESSAGING_SENDER_ID` con los valores de la app web de producción; comprobar repositorio y cuenta antes de escribir. Mantener secretos reales fuera de estas variables.
- [ ] En `.github/workflows/deploy-pages.yml`, pasar las seis variables del contexto `vars` al entorno del paso `Compilar SPA`. Añadir validación previa que falle de forma explícita si falta una variable obligatoria o el proyecto no coincide con producción, sin imprimir valores sensibles. No cambiar el disparador ni ejecutar el workflow sin solicitud de Leo.
- [ ] Documentar en `README.md` dónde se configuran las variables, que se incorporan al compilar y que son públicas, y que el despliegue existente se activa con push a `main` o manualmente.

## FASE 4: Cuenta de revisión de Google Play

### Objetivo

Permitir que los revisores accedan a las funciones con sesión en la app de producción sin usar cuentas de clientes reales.

### Pasos de ejecución

- [ ] Preparar una cuenta exclusiva de revisión en Firebase de producción con correo/contraseña, correo verificado y acceso a las funciones protegidas existentes. Usar únicamente datos ficticios; no crear mecanismos especiales de acceso ni saltar las reglas de Firestore. Coordinar con Leo la verificación del correo y cualquier contraseña o MFA que deba introducir personalmente.
- [ ] Guardar las credenciales únicamente en `.credenciales-pruebas.local.md`, si Leo autoriza su uso para esta cuenta, y verificar que Git lo ignora; no imprimirlas ni incluirlas en el plan, archivos versionados, comandos o registros. Si no existe un correo adecuado o no es posible verificarlo, dejar la fase pendiente y solicitarlo a Leo.
- [ ] Preparar instrucciones breves en inglés para Play Console: abrir acceso, elegir correo y contraseña, ingresar con la cuenta de revisión y localizar las funciones protegidas. Explicar a Leo dónde cargar credenciales e instrucciones; él gestiona Play Console. Asegurar que la cuenta sea reutilizable y no requiera intervención, código temporal ni ubicación específica en cada revisión.
- [ ] Si posteriormente se implementan funciones de pago, revisar que la cuenta tenga acceso de revisión conforme a las reglas vigentes; pagos y exenciones no se implementan en este plan.

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

- [ ] Fase 1: Crear y proteger Firebase de producción
- [ ] Fase 2: Seleccionar entorno y registrar firmas
- [ ] Fase 3: Conectar GitHub Pages a producción
- [ ] Fase 4: Cuenta de revisión de Google Play
- [ ] Fase Testing

Fecha de creación: 09 de noviembre de 2026  
Fecha de última actualización: 09 de noviembre de 2026  
Estado: BORRADOR
