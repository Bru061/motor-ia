import {
  FiBox,
  FiCheck,
  FiCode,
  FiDatabase,
  FiGitBranch,
  FiLayers,
  FiPlus,
  FiServer,
  FiShield,
  FiZap,
} from "react-icons/fi";

const modules = [
  { title: "HTML Básico", status: "completed", level: "JUNIOR", icon: <FiCode /> },
  { title: "CSS Fundamentos", status: "completed", icon: <FiBox /> },
  { title: "JavaScript ES6+", status: "completed", icon: <FiDatabase /> },
  { title: "Responsive Design", status: "completed", icon: <FiLayers /> },
  { title: "Git & CLI", status: "active", icon: <FiZap /> },
  { title: "React.js", status: "active", level: "MID", icon: <FiCode /> },
  { title: "State Management", status: "pending", icon: <FiGitBranch /> },
  { title: "APIs REST", status: "pending", icon: <FiServer /> },
  { title: "Testing Unitario", status: "pending", icon: <FiShield /> },
  { title: "Arquitectura Frontend", status: "pending", level: "ADVANCED", icon: <FiLayers /> },
  { title: "Performance", status: "pending", icon: <FiZap /> },
  { title: "SSR & SSG", status: "pending", icon: <FiDatabase /> },
  { title: "CI/CD & DevOps", status: "pending", icon: <FiPlus /> },
];

function RutaPage() {
  return (
    <section className="roadmap-page">
      <div className="roadmap-header">
        <div>
          <h1>Ruta de Aprendizaje: Desarrollo Frontend</h1>
          <p>Tu roadmap personalizado basado en tu evaluación de habilidades</p>
        </div>

        <div className="roadmap-legend">
          <span>
            <i className="dot dot--pending" />
            Pendiente
          </span>
          <span>
            <i className="dot dot--active" />
            En progreso
          </span>
          <span>
            <i className="dot dot--completed" />
            Completado
          </span>
        </div>
      </div>

      <div className="roadmap-layout">
        <div className="roadmap-track" aria-label="Roadmap visual">
          {modules.map((module) => (
            <div className="roadmap-node-wrap" key={module.title}>
              {module.level && <span className="roadmap-level">{module.level}</span>}

              <article className={`roadmap-node roadmap-node--${module.status}`}>
                <span className="roadmap-node__icon">{module.icon}</span>
                <div>
                  <strong>{module.title}</strong>
                  <small>
                    {module.status === "completed"
                      ? "Completado"
                      : module.status === "active"
                        ? "En progreso"
                        : "Pendiente"}
                  </small>
                </div>
              </article>
            </div>
          ))}
        </div>

        <aside className="module-detail">
          <div className="module-detail__top">
            <span>DETALLE DEL MÓDULO</span>
            <strong>6/13</strong>
          </div>

          <div className="module-detail__title">
            <span>
              <FiCode />
            </span>
            <div>
              <h2>React.js</h2>
              <small>En progreso · Módulo Mid</small>
            </div>
          </div>

          <p>
            Aprende los fundamentos de React: componentes, JSX, props, estado y
            ciclo de vida. Domina la creación de interfaces modulares y
            reutilizables con la librería más popular del ecosistema frontend.
          </p>

          <div className="module-progress">
            <div>
              <span>Progreso del módulo</span>
              <strong>25%</strong>
            </div>
            <i>
              <b />
            </i>
          </div>

          <div className="resource-list">
            <h3>Recursos sugeridos</h3>
            {[
              "Intro a React - Curso Completo",
              "Documentación oficial de React",
              "Hooks en profundidad",
              "Patrones de componentes",
              "Proyecto práctico: Todo App",
            ].map((resource, index) => (
              <label key={resource}>
                <input type="checkbox" defaultChecked={index < 2} />
                <span>{resource}</span>
              </label>
            ))}
          </div>

          <div className="module-actions">
            <button className="primary-action primary-action--green" type="button">
              <FiCheck />
              Marcar como completado
            </button>
            <button className="secondary-action" type="button">
              Ver recursos completos
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default RutaPage;
