# Memoria del proyecto

Este archivo conserva decisiones y aprendizajes útiles para trabajos futuros en Calcula tu presupuesto. Git guarda el historial y `Planes/` conserva los planes.

## Cómo mantener esta memoria

- Registrar solo información reutilizable que no sea fácil de recuperar del código o los documentos vigentes.
- Añadir fecha y archivos relacionados cuando ayuden a entender una decisión.
- Verificar cada entrada antes de usarla; corregirla o quitarla si quedó obsoleta.
- Mantener el archivo breve, idealmente por debajo de 100 líneas, sin secretos ni datos reales de clientes.

## Puntos de referencia

- `AGENTS.md` contiene las reglas del repositorio y tiene prioridad sobre esta memoria.
- `README.md` describe el producto, su arquitectura y la operación vigente.
- `Planes/` conserva los planes activos y terminados; `Planes/PlanesFuturos/TareasPendientes.md` reúne tareas sin plan propio.
- La versión actual se consulta en `package.json`.

## Decisiones y aprendizajes

- 2026-10-29: Se adopta una memoria curada para conservar contexto reutilizable entre trabajos. Se agregarán decisiones concretas cuando aparezcan, tras verificarlas contra el proyecto vigente.
- 2026-10-30: Para Firebase y cualquier otro servicio o tarea de desarrollo de este proyecto, usar la cuenta `leodevapps.75@gmail.com`. Verificar la cuenta activa antes de crear o modificar recursos. No usar la cuenta personal destinada a asuntos de la casa.
- 2026-10-30: Firebase de pruebas `calculatupresupuesto-pru-b2e9a` quedó separado de la app publicada, en Spark y con Firestore en São Paulo (`southamerica-east1`). Se configuraron correo/contraseña y Google. No convertir este proyecto en producción sin migración y revisión de privacidad.
- 2026-10-30: Los datos del visitante permanecen locales; los de una cuenta verificada van a Firestore bajo su `uid`. La migración prevista es exportar/importar JSON sin borrar el origen. Android usa caché persistente y la web solo memoria por el riesgo de equipos compartidos. La sincronización sin red exige prueba manual antes de publicar.
- 2026-10-30: Storage no se activó porque exige Blaze; los logos se limitan a 350 KB dentro de documentos. Las suscripciones, la exención de Pablo y Billing quedan para un plan comercial posterior. Las reglas Firestore de pruebas están publicadas y solo admiten al dueño con correo verificado.
- 2026-10-30: El `.env.local` previo a `v0.0.7` contenía usuario y contraseña provisionales en el historial Git. Ya no se usan en el cliente. Si esa contraseña se reutilizó fuera de esta app, cambiarla allí; no imprimir ni recuperar su valor.
