# Motor IA

Plataforma web inteligente que genera rutas de aprendizaje personalizadas para estudiantes y profesionales de TI mediante integración con modelos de lenguaje de gran escala (LLM).

## Descripción

Analiza el perfil tecnológico del usuario (conocimientos actuales, nivel y meta profesional) y genera automáticamente un roadmap de aprendizaje estructurado en niveles Junior, Intermediate y Advanced. Cada nivel contiene módulos con temas, recursos sugeridos y tiempos estimados.

## Módulos principales

- **Módulo del Estudiante** — Skill assessment, roadmap interactivo (React Flow) y dashboard de progreso
- **Módulo del Administrador** — Analítica de tecnologías más demandadas y Skill Gap Analysis
- **Motor de IA** — Integración con Gemini API con generación de JSON validado con Pydantic

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite, Tailwind CSS, React Flow, React Router, Axios |
| Backend | FastAPI (Python), SQLAlchemy, Alembic, python-jose |
| Motor de IA | GoogleGenAI, Gemini API, JsonOutputParser, Pydantic |
| Base de datos | PostgreSQL |
| Deploy | Railway (backend + BD), Vercel (frontend) |

## Estructura del proyecto

```
motor-ia/
├── backend/          # API REST con FastAPI
├── frontend/         # SPA con React + Vite
└── docs/             # Diagramas y documentación técnica
```

## Instalación y configuración

### Requisitos previos

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Cuenta en Google AI Studio (para Gemini API key)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Completa las variables de entorno
alembic upgrade head            # Ejecuta las migraciones
uvicorn app.main:app --reload   # Inicia el servidor en http://localhost:8000
```

La documentación de la API estará disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # Completa las variables de entorno
npm run dev                     # Inicia en http://localhost:5173
```

## Convención de ramas

```
main        ← código estable, se actualiza en cada entrega
feature/*   ← una rama por historia de usuario (ej. feature/us-01-auth)
hotfix/*    ← correcciones urgentes sobre main
```

## Convención de commits

```
feat:      nueva funcionalidad
fix:       corrección de bug
docs:      cambios en documentación
refactor:  refactorización sin cambio de funcionalidad
test:      añade o modifica pruebas
chore:     tareas de mantenimiento y dependencias
```

## Información del proyecto

- **Empresa:** PluriOne S.A. de C.V. / Develop Talent & Technology
- **Periodo:** 25 de mayo — 21 de agosto de 2026
- **Asesor evaluador:** Edgar Loheffemman
