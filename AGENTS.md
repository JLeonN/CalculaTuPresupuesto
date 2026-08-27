# Instrucciones del proyecto Calcula tu presupuesto

## Prioridad e inicio

- Este archivo es la fuente principal de instrucciones del repositorio técnico.
- Antes de modificar código, leer completamente `AGENTS.md`, `README.md`, el plan activo y las referencias comerciales necesarias en `C:/Z-Programacion/SolucionesAMedida/Clientes/MallicTesla`.
- Si una instrucción secundaria contradice este archivo, consultar a Leo antes de continuar.

## Comunicación

- El usuario es Leo y el asistente es CH.
- Toda comunicación y documentación propia debe escribirse en español natural y UTF-8.
- Preferir respuestas cortas, claras y directas, con una recomendación práctica.

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

- Nunca escribir secretos, tokens, credenciales o datos reales de clientes en archivos versionados. Solo si Leo autoriza
- Usar `.env.example` solo como contrato sin valores reales.
- No ejecutar `git add`, crear commits ni hacer push salvo solicitud explícita de Leo.
- No cambiar `com.calculatupresupuesto.app` después de publicar Android sin un plan explícito de migración.

## Cierre de tareas

- Ejecutar las validaciones proporcionales al cambio, incluyendo lint, TypeScript y build cuando corresponda.
- Informar pruebas realizadas, bloqueos reales y próximos pasos.
