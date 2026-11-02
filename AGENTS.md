# Instrucciones del proyecto Calcula tu presupuesto

## Prioridad e inicio

- Este archivo es la fuente principal de instrucciones del repositorio técnico.
- Antes de modificar código, leer completamente `AGENTS.md`, `README.md`, el plan activo y las referencias comerciales necesarias en `C:/Z-Programacion/SolucionesAMedida/Clientes/MallicTesla`.
- Si una instrucción secundaria contradice este archivo, consultar a Leo antes de continuar.

## Comunicación

- El usuario es Leo y el asistente es CH.
- Toda comunicación y documentación propia debe escribirse en español natural y UTF-8.
- Preferir respuestas cortas, claras y directas, con una recomendación práctica.

## Flujo de trabajo

- Antes de modificar código, revisá el proyecto y los archivos relacionados.
- Explicame brevemente qué entendiste, qué encontraste y cómo pensás resolverlo.
- Esperá mi aprobación explícita antes de implementar.
- Cuando apruebe la implementación, hacé los cambios y contame qué quedó hecho.
- No ejecutes la aplicación, pruebas, compilaciones ni linters, salvo que yo te lo pida explícitamente.
- Yo voy a probar el resultado.
- Si encontrás un riesgo o una decisión importante durante el trabajo, explicámelo de forma breve y proponé una solución práctica.

## Teléfono Android de pruebas por USB

- Usar únicamente el POCO dedicado a pruebas, con serial ADB `f18c5937`. Este procedimiento no se aplica al teléfono personal de Leo. Consultar la [guía de control Android por USB](<Y:/Yoomat75/Control Android por USB del teléfono de pruebas/Control Android por USB en el teléfono de pruebas.md>).
- Verificar que `adb devices` muestre `f18c5937 device`. Antes de instalar una APK ya creada, comprobar que su paquete sea `com.calculatupresupuesto.app`. En PowerShell:

```powershell
adb devices
adb -s f18c5937 install -r 'C:\ruta\app.apk'
adb -s f18c5937 shell monkey -p com.calculatupresupuesto.app 1
adb -s f18c5937 shell screencap -p /sdcard/ch_pantalla.png
adb -s f18c5937 pull /sdcard/ch_pantalla.png .\ch_pantalla.png
& 'Y:\Yoomat75\Control Android por USB del teléfono de pruebas\Control Android por USB.ps1' -Accion tocar -X 400 -Y 480
& 'Y:\Yoomat75\Control Android por USB del teléfono de pruebas\Control Android por USB.ps1' -Accion escribir -Texto wifi
```

- El script se ejecuta una vez por cada toque o escritura; antes de escribir, enfocar el campo de texto. Consultar la guía para los límites de caracteres y el funcionamiento de `uinput`.
- Antes de modificar código o compilar una APK, explicar el motivo a Leo y pedir su aprobación explícita.

## Stack y arquitectura

- Usar Quasar CLI con Vue 3, TypeScript estricto, Vite, Vue Router, Pinia y Composition API mediante `<script setup>`.
- Mantener una única base responsive para SPA web y Android mediante Capacitor.
- Crear componentes pequeños con una responsabilidad clara.
- No instalar una dependencia sin una necesidad validada y documentada.
- No implementar módulos comerciales fuera del alcance del plan activo.

## Convenciones

- Variables y funciones: camelCase y español, por ejemplo `clienteSeleccionado` y `calcularTotalPresupuesto`.
- Constantes: MAYÚSCULAS con guiones bajos, por ejemplo `ESTADOS_PRESUPUESTO`.
- Componentes Vue: PascalCase, por ejemplo `FormularioCliente.vue`.
- Composables: prefijo `use`, por ejemplo `usePresupuestos.ts`.
- Clases CSS globales y variables CSS semánticas: kebab-case, por ejemplo `tarjeta-presupuesto` y `--color-fondo-principal`.
- Centralizar colores, tipografía, espaciados, bordes, radios, sombras y tamaños reutilizables en `src/css/Variables.css`.
- No repetir valores visuales fuera de `Variables.css`, salvo una excepción local explicada con un comentario.

## Seguridad y Git

- Nunca escribir secretos, tokens, credenciales o datos reales de clientes en archivos versionados.
- Excepción autorizada por Leo: `.credenciales-pruebas.local.md` puede guardar en texto plano credenciales de cuentas de prueba y de la cuenta dedicada al desarrollo de Firebase. Debe permanecer ignorado por Git y nunca copiarse a archivos versionados, chat, comandos, registros o respuestas. Consultarlo solo cuando una tarea de desarrollo o pruebas lo necesite; no imprimir su contenido. Leo completa personalmente PIN, MFA y consentimientos.
- Usar `.env.example` solo como contrato sin valores reales.
- No ejecutar `git add`, crear commits ni hacer push salvo solicitud explícita de Leo.
- No cambiar `com.calculatupresupuesto.app` después de publicar Android sin un plan explícito de migración.

## Memoria del proyecto

- `Memory.md` contiene decisiones y aprendizajes reutilizables de trabajos anteriores. Consúltalo cuando una tarea necesite ese contexto; este `AGENTS.md` conserva la prioridad.
- Al terminar un trabajo, actualiza `Memory.md` solo si apareció información útil para tareas futuras. Corrige o elimina entradas obsoletas y verifica los hechos contra el código y los documentos vigentes.
- Mantén la memoria breve, idealmente por debajo de 100 líneas. Evita duplicar historiales, planes, reglas de este archivo, datos temporales y secretos.

## Cierre de tareas

- Informar los cambios realizados, las validaciones solicitadas por Leo, los bloqueos reales y los próximos pasos.
