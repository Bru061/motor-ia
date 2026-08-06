# Product Requirements Document (PRD)
## MotorIA — Motor de personalización de rutas de aprendizaje con IA

**Empresa:** Develop Talent & Technology (Plurione S.A. de C.V.) — TODO Academy
**Periodo de desarrollo:** Mayo – Agosto 2026
**Estado del documento:** Versión 1.1

---

## 1. Resumen ejecutivo

MotorIA es una plataforma web que genera rutas de aprendizaje personalizadas mediante inteligencia artificial. A partir del perfil tecnológico de un usuario (meta profesional, nivel actual y áreas de interés), el sistema construye de forma automática una ruta estructurada en módulos progresivos, con recursos y dependencias entre sí. La plataforma incluye además un panel administrativo con analítica de brechas de habilidades, pensado para apoyar decisiones de capacitación a nivel organizacional.

El sistema se compone de un backend en FastAPI con PostgreSQL, integrado con el modelo Gemini 2.5 Flash a través de la librería `google-genai`, y un frontend en React con Vite, que incluye visualización interactiva del roadmap mediante React Flow.

## 2. Problema y justificación

Las plataformas de capacitación tecnológica actuales suelen ofrecer catálogos de contenido genéricos, sin adaptarse al nivel ni a la meta profesional específica de cada usuario. Un estudiante interesado en desarrollo backend recibe, en la mayoría de los casos, el mismo catálogo que uno interesado en ciencia de datos o en frontend, con la única diferencia de que debe filtrar manualmente los cursos relevantes para su objetivo. Esto genera desorientación sobre qué aprender, en qué orden hacerlo y cómo medir el avance real hacia una meta concreta.

A este problema se suma una segunda limitación: representar visualmente una progresión coherente de habilidades, desde un nivel inicial hasta uno avanzado, requiere estructuras capaces de enlazar conceptos y prerrequisitos de forma lógica, algo que un listado lineal de cursos no logra comunicar con claridad. Finalmente, a nivel organizacional, quienes coordinan procesos de capacitación suelen carecer de visibilidad sobre las brechas de habilidades reales de su equipo, lo que dificulta tomar decisiones informadas sobre en qué áreas reforzar la formación.

MotorIA responde a estas tres condiciones combinando un mecanismo de evaluación inicial del perfil del estudiante (Skill Assessment), un motor de generación de rutas basado en un modelo de lenguaje de gran escala, una representación visual de la ruta mediante un grafo interactivo de nodos, y un panel de analítica para administradores.

## 3. Usuarios objetivo

| Perfil | Descripción | Necesidad principal |
|---|---|---|
| **Estudiante** | Persona que busca desarrollar habilidades tecnológicas hacia una meta profesional específica | Recibir una ruta de aprendizaje clara, ordenada y adaptada a su nivel, y poder dar seguimiento a su progreso |
| **Administrador** | Responsable de coordinar procesos de capacitación dentro de la organización | Visibilidad agregada sobre los usuarios, sus rutas activas y las tecnologías con mayor demanda o rezago |

## 4. Objetivo general del producto

Desarrollar una plataforma web que, a partir del perfil tecnológico de un usuario, genere de forma automatizada una ruta de aprendizaje personalizada mediante la integración de un modelo de lenguaje de gran escala, permitiendo el seguimiento del progreso del estudiante y proporcionando al administrador analítica de brechas de habilidades para apoyar decisiones de capacitación.

### Métricas de éxito propuestas

| Métrica | Objetivo |
|---|---|
| Tasa de validación exitosa de rutas generadas por IA | ≥ 90% de las respuestas del modelo pasan la validación de Pydantic sin necesidad de reintento |
| Tiempo de generación de una ruta | Respuesta completa en menos de X segundos (definir con datos reales de Gemini 2.5 Flash) |
| Tasa de uso de caché | % de solicitudes de generación resueltas por caché en lugar de llamada al LLM |
| Cobertura de pruebas de endpoints | 100% de los endpoints documentados probados en Postman |
| Compatibilidad responsiva | Interfaz funcional en resoluciones de escritorio y móvil |

## 5. Alcance del producto

El producto cubre siete áreas funcionales:

1. **Autenticación y gestión de usuarios por rol** — registro, inicio de sesión, protección de rutas y cierre de sesión, con roles diferenciados de estudiante y administrador.
2. **Evaluación de perfil tecnológico (Skill Assessment)** — captura de meta profesional, nivel actual y categorías de interés del estudiante.
3. **Motor de generación de rutas mediante IA** — generación y regeneración de rutas personalizadas, con validación estructurada de la respuesta del modelo y uso de caché para perfiles equivalentes.
4. **Visualización interactiva del roadmap** — representación de la ruta como un grafo de nodos y dependencias, con panel de detalle por módulo y sus recursos asociados.
5. **Seguimiento de progreso del estudiante** — actualización del estado de cada módulo (pendiente, en progreso, completado) y dashboard con indicadores de avance.
6. **Panel de administración y analítica** — listado y detalle de usuarios registrados, gráficas de tecnologías más demandadas y análisis de brechas de habilidades (Skill Gap Analysis).
7. **Infraestructura, seguridad y despliegue** — autenticación JWT, control de acceso por rol, despliegue en Railway (backend) y Vercel (frontend).

De estas siete áreas, las funcionalidades consideradas indispensables para el primer lanzamiento (registro, login, protección de rutas, Skill Assessment, generación de rutas con IA, validación de la respuesta del modelo, visualización del roadmap con sus recursos, seguimiento de progreso, listado de usuarios, analítica básica de tecnologías demandadas y despliegue en producción) representan el núcleo mínimo funcional del sistema. El resto de las funcionalidades (edición de perfil, caché de rutas, onboarding guiado, Skill Gap Analysis detallado, notificaciones de progreso, plan de mantenimiento documentado) aportan valor adicional pero no son bloqueantes para que el flujo principal opere correctamente.

Quedan explícitamente fuera del alcance de esta versión:

- **Pasarelas de pago** — el proyecto no contempla un modelo de monetización en esta etapa.
- **Alojamiento propio de videos o artículos** — los recursos de aprendizaje se enlazan a fuentes externas, evitando la complejidad y el costo de almacenar contenido multimedia propio.
- **Evaluaciones automatizadas de código** — fuera del propósito del producto, que se enfoca en la generación y el seguimiento de rutas, no en la evaluación técnica del aprendizaje.

## 6. Requisitos funcionales

### 6.1 Autenticación y gestión de usuarios

- El sistema debe permitir el registro de un nuevo usuario con nombre, correo y contraseña, validando que el correo no esté duplicado.
- El sistema debe permitir iniciar sesión con correo y contraseña, retornando un token JWT válido por 24 horas.
- El sistema debe rechazar el acceso a rutas administrativas por parte de usuarios con rol de estudiante, respondiendo con un error 403.
- El sistema debe permitir cerrar sesión, eliminando el token almacenado en el cliente.

### 6.2 Evaluación de perfil tecnológico

- El sistema debe permitir capturar la meta profesional, el nivel actual (Junior/Mid/Senior) y las categorías tecnológicas de interés del estudiante.
- El sistema debe permitir editar un perfil tecnológico existente, precargando la información previamente registrada.
- El sistema debe mostrar un resumen del perfil actual dentro del dashboard del estudiante.

### 6.3 Motor de generación de rutas con IA

- El sistema debe generar una ruta de aprendizaje con un mínimo de tres módulos, validada contra un esquema definido con Pydantic antes de almacenarse.
- El sistema debe permitir regenerar la ruta de un estudiante cuando este cambie su meta profesional, sin perder el historial de rutas anteriores.
- El sistema debe verificar si existe una ruta generada para un perfil equivalente antes de invocar al modelo de lenguaje, reutilizando su estructura mediante clonación para reducir costos y tiempo de respuesta.
- El sistema debe implementar lógica de reintento (máximo dos reintentos adicionales al primer intento) cuando la respuesta del modelo no cumpla con la estructura esperada.

### 6.4 Visualización del roadmap

- El sistema debe representar la ruta de aprendizaje como un grafo interactivo, con un nodo por módulo y conexiones dirigidas según las dependencias definidas.
- El sistema debe mostrar, al seleccionar un nodo, un panel de detalle con la descripción del módulo, su nivel, duración estimada y recursos asociados (videos, artículos, documentación).
- El sistema debe permitir marcar un recurso individual como visto.

### 6.5 Seguimiento de progreso

- El sistema debe permitir actualizar el estado de un módulo entre pendiente, en progreso y completado.
- El sistema debe calcular y mostrar el porcentaje de avance general de la ruta activa del estudiante.
- El sistema debe identificar automáticamente el siguiente módulo pendiente según el orden de la ruta.

### 6.6 Panel de administración y analítica

- El sistema debe mostrar un listado paginado y filtrable de los usuarios registrados.
- El sistema debe mostrar el detalle individual de un usuario, incluyendo su perfil tecnológico y su ruta activa.
- El sistema debe generar una gráfica de las tecnologías más demandadas entre los perfiles registrados.
- El sistema debe generar un análisis de brechas de habilidades (Skill Gap Analysis) a partir del progreso agregado de los estudiantes.

### 6.7 Infraestructura y despliegue

- El sistema debe desplegar el backend y la base de datos PostgreSQL en Railway, y el frontend en Vercel.
- El sistema debe contar con un procedimiento documentado de respaldo y mantenimiento post-entrega. *(Ver sección 10 — no entregado a la fecha de esta revisión.)*

## 7. Requisitos no funcionales

| Categoría | Requisito |
|---|---|
| **Seguridad** | Autenticación mediante JWT con expiración de 24 horas. Contraseñas almacenadas con hash mediante bcrypt (nunca en texto plano). Control de acceso basado en roles (RBAC) para diferenciar estudiante y administrador. |
| **Rendimiento** | Las respuestas de endpoints no relacionados con IA deben resolverse en tiempos bajos, propios de una API REST estándar sobre FastAPI. La generación de rutas depende de la latencia del servicio externo de IA, por lo que debe contar con retroalimentación visual de carga en el frontend. |
| **Disponibilidad** | Despliegue en Railway (backend + PostgreSQL) y Vercel (frontend), con variables de entorno separadas por ambiente. |
| **Usabilidad** | Interfaz responsiva, validada en resoluciones de escritorio y dispositivos móviles. Estados de carga y notificaciones visuales (toast) para retroalimentación de cada operación. |
| **Mantenibilidad** | Backend organizado por módulos (rutas, modelos, esquemas, servicios). Frontend organizado por responsabilidad (api, components, context, hooks, layouts, modules, routes, styles, utils). Migraciones de base de datos versionadas con Alembic. |
| **Compatibilidad** | Frontend compatible con navegadores modernos actualizados (sin soporte definido para versiones legacy). |

## 8. Riesgos y dependencias

| Riesgo | Impacto | Estado / mitigación |
|---|---|---|
| Límite de cuota en el nivel gratuito de la API de generación de IA | Alto — bloquea la funcionalidad principal del sistema | **Resuelto.** Se migró de la integración inicial (Gemini con LangChain) a Gemini 2.5 Flash con integración directa mediante `google-genai`, eliminando la dependencia de LangChain como capa intermedia. |
| Respuestas mal formadas o incompletas del modelo de lenguaje | Medio — puede generar rutas inconsistentes en la base de datos | Mitigado mediante validación estricta con Pydantic y lógica de reintento antes de persistir la respuesta. |
| Dependencia de un único proveedor de IA (Google Gemini) | Medio — cualquier cambio de política o disponibilidad del servicio afecta directamente al producto | No mitigado actualmente. Riesgo abierto para una futura versión (posible soporte a un proveedor alterno). |
| Desarrollo individual sin equipo de respaldo | Medio — cualquier ausencia o bloqueo detiene el avance del proyecto | Mitigado parcialmente mediante documentación detallada de cada etapa de desarrollo. |

## 9. Fuera de alcance (esta versión)

- Pasarelas de pago.
- Alojamiento propio de videos o artículos (los recursos se enlazan externamente).
- Evaluaciones automatizadas de código.

## 10. Estado de entrega respecto a este documento

Esta sección se agregó tras una revisión del código contra este PRD.

- **Modelo de IA:** el documento original decía "Gemini 2.0 Flash" en varias secciones; el modelo configurado y en uso real es **Gemini 2.5 Flash** (`GEMINI_MODEL` en `backend/app/core/config.py`). Ya corregido en este documento.
- **Sección 6.2, "resumen del perfil en el dashboard":** entregado.
- **Sección 6.5, "identificar automáticamente el siguiente módulo pendiente":** entregado.
- **Sección 6.7, "procedimiento documentado de respaldo y mantenimiento post-entrega":** **no entregado.** No existe actualmente un documento de este tipo en el repositorio.
- **Onboarding guiado** (mencionado en la sección 5 como funcionalidad de valor adicional, correspondiente a la historia US-15 del MVP): **no entregado.** No hay ningún componente ni pantalla de onboarding en el frontend.
- **Métrica "Cobertura de pruebas de endpoints... en Postman" (sección 4):** no se encontró ninguna colección de Postman versionada en el repositorio; si existe, vive fuera del control de versiones del proyecto.
- El resto de los requisitos funcionales de las secciones 6.1 a 6.6, y el despliegue en producción de la sección 6.7, están verificados en el código y activos (se confirmó una URL de producción real de Railway en la configuración del frontend).
