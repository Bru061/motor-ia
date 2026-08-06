# Definición del MVP — MotorIA
## Motor de personalización de rutas de aprendizaje con IA

**Empresa:** Develop Talent & Technology (Plurione S.A. de C.V.) — TODO Academy
**Criterio de clasificación:** MoSCoW (Must have / Should have / Could have / Won't have)
**Alcance total del proyecto:** 24 historias de usuario, 7 épicas, 134 story points

---

## 1. ¿Qué es MotorIA?

MotorIA es una plataforma web que genera rutas de aprendizaje personalizadas mediante inteligencia artificial. A partir del perfil tecnológico de un usuario (meta profesional, nivel actual y áreas de interés), el sistema construye de forma automática una ruta estructurada en módulos progresivos, con recursos y dependencias entre sí, visualizada como un grafo interactivo de nodos. La plataforma incluye también un panel administrativo con analítica de brechas de habilidades, orientado a apoyar decisiones de capacitación a nivel organizacional.

El sistema se compone de un backend en FastAPI con PostgreSQL, integrado con el modelo Gemini 2.5 Flash mediante la librería `google-genai`, y un frontend en React con Vite, con visualización de rutas mediante React Flow.

## 2. Criterio de clasificación

La clasificación MoSCoW de este documento se construyó a partir de la prioridad asignada a cada historia de usuario durante la planeación del proyecto, bajo el siguiente criterio de equivalencia:

| Prioridad de la historia | Categoría MoSCoW | Significado |
|---|---|---|
| Alta | **Must have** | Sin esta funcionalidad, el sistema no cumple su propósito central |
| Media | **Should have** | Agrega valor significativo, pero el sistema es funcional sin ella en un primer lanzamiento |
| Baja | **Could have** | Mejora complementaria, prescindible si el tiempo de desarrollo se reduce |
| *(excluido desde la planeación inicial)* | **Won't have** | Fuera del alcance de esta versión |

## 3. Must have — el MVP real

Estas 14 historias representan el núcleo mínimo funcional del sistema. Sin cualquiera de ellas, el flujo principal de MotorIA (registrarse, evaluar el perfil, generar una ruta, visualizarla y dar seguimiento) queda incompleto.

| ID | Historia | Área funcional | SP |
|---|---|---|---|
| US-01 | Registro con nombre, correo y contraseña | Autenticación | 5 |
| US-02 | Inicio de sesión con correo y contraseña | Autenticación | 3 |
| US-03 | Protección de rutas por rol | Autenticación | 5 |
| US-05 | Formulario de evaluación de habilidades | Skill Assessment | 8 |
| US-08 | Generación automática de la ruta de aprendizaje | Motor de IA | 13 |
| US-09 | Regeneración de ruta por cambio de meta | Motor de IA | 5 |
| US-11 | Validación de JSON del LLM | Motor de IA | 5 |
| US-12 | Visualización de ruta de aprendizaje | Roadmap | 13 |
| US-13 | Recursos del módulo | Roadmap | 8 |
| US-16 | Marcar módulo como completado | Seguimiento de progreso | 5 |
| US-17 | Dashboard con porcentaje de avance general | Seguimiento de progreso | 5 |
| US-19 | Listado de usuarios | Panel administrativo | 8 |
| US-20 | Gráfico de tecnologías más estudiadas | Panel administrativo | 5 |
| US-23 | Desplegar aplicación en producción | Infraestructura | 5 |

**Subtotal Must have: 14 historias — 93 story points (69.4% del total)**

**Estado: 14/14 entregadas.** Todas las historias Must have están implementadas y verificadas en el código, incluyendo el despliegue en producción (Railway + Vercel).

## 4. Should have

Funcionalidades que mejoran la experiencia y el valor del producto, pero que no son indispensables para que el flujo principal funcione.

| ID | Historia | Área funcional | SP | Estado |
|---|---|---|---|---|
| US-04 | Cierre de sesión | Autenticación | 2 | Entregada |
| US-06 | Edición de perfil | Skill Assessment | 3 | Entregada |
| US-10 | Caché de rutas similares | Motor de IA | 5 | Entregada |
| US-14 | Marcar recurso individual como "visto" | Roadmap | 5 | Entregada |
| US-15 | Pantalla de onboarding guiado | Roadmap | 5 | **No entregada** |
| US-21 | Skill Gap Analysis de progreso | Panel administrativo | 8 | Entregada |
| US-22 | Detalle de usuario específico | Panel administrativo | 5 | Entregada |
| US-24 | Plan de mantenimiento | Infraestructura | 3 | **No entregada** |

**Subtotal Should have: 8 historias — 36 story points (26.9% del total)**

**Estado: 6/8 entregadas (28 de 36 SP).** US-15 (onboarding guiado) no tiene ningún componente ni ruta en el frontend. US-24 (plan de mantenimiento) no cuenta con un documento de respaldo/mantenimiento post-entrega; existe una guía de despliegue, pero cubre un alcance distinto.

## 5. Could have

Mejoras complementarias, de menor impacto si se omiten en una primera versión.

| ID | Historia | Área funcional | SP |
|---|---|---|---|
| US-07 | Resumen de perfil en dashboard | Skill Assessment | 2 |
| US-18 | Notificaciones visuales de nivel completado | Seguimiento de progreso | 3 |

**Subtotal Could have: 2 historias — 5 story points (3.7% del total)**

**Estado: 2/2 entregadas.**

## 6. Won't have (esta versión)

Excluido explícitamente del alcance desde la fase de planeación inicial del proyecto.

| Funcionalidad | Justificación de exclusión |
|---|---|
| Pasarelas de pago | El proyecto no contempla un modelo de monetización en esta etapa |
| Alojamiento propio de videos o artículos | Los recursos de aprendizaje se enlazan a fuentes externas, evitando la complejidad y el costo de almacenar contenido multimedia propio |
| Evaluaciones automatizadas de código | Fuera del propósito del MVP, que se enfoca en la generación y el seguimiento de rutas, no en la evaluación técnica del aprendizaje |

## 7. Resumen general

| Categoría | Historias | Story Points | % del total |
|---|---|---|---|
| Must have | 14 | 93 | 69.4% |
| Should have | 8 | 36 | 26.9% |
| Could have | 2 | 5 | 3.7% |
| **Total** | **24** | **134** | **100%** |

El **91.7%** de las historias (Must + Should) concentra el **96.3%** de los story points totales, lo que indica que el alcance del proyecto está mayormente enfocado en funcionalidad esencial, con muy poco esfuerzo dedicado a mejoras marginales (Could have).

## 8. Estado de entrega respecto a este documento

Esta sección se agregó tras una revisión del código contra la definición original del MVP.

- **22 de 24 historias entregadas (129 de 134 story points, 96.3%).** Las 14 historias Must have y las 2 Could have están completas. De las 8 Should have, 6 están completas.
- **US-15 (Pantalla de onboarding guiado) — no entregada.** No se implementó ningún componente, pantalla ni ruta de onboarding en el frontend.
- **US-24 (Plan de mantenimiento) — no entregada.** No existe un documento de procedimiento de respaldo y mantenimiento post-entrega en el repositorio.
- **Corrección de dato técnico:** este documento originalmente decía "Gemini 2.0 Flash"; el modelo configurado y en uso real es **Gemini 2.5 Flash** (`GEMINI_MODEL` en `backend/app/core/config.py`).
