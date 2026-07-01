import {
  FiBriefcase,
  FiCode,
  FiCpu,
  FiDatabase,
  FiEdit3,
  FiFeather,
  FiServer,
} from "react-icons/fi";

const techGroups = [
  {
    title: "Frontend",
    icon: <FiCode />,
    tone: "cyan",
    items: ["React", "Vue.js", "TypeScript", "Angular", "Next.js"],
  },
  {
    title: "Backend",
    icon: <FiServer />,
    tone: "green",
    items: ["Node.js", "Python", "Java", "Go", "Rust"],
  },
  {
    title: "DevOps",
    icon: <FiBriefcase />,
    tone: "amber",
    items: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
  },
  {
    title: "Data",
    icon: <FiDatabase />,
    tone: "yellow",
    items: ["SQL", "PostgreSQL", "MongoDB", "Redis", "Spark"],
  },
];

function PerfilPage() {
  return (
    <section className="assessment-page">
      <div className="assessment-shell">
        <div className="stepper" aria-label="Progreso del assessment">
          {["Experiencia", "Meta", "Tecnologías"].map((step, index) => (
            <div className="stepper__item" key={step}>
              <span>{index + 1}</span>
              <div className={index <= 1 ? "stepper__bar is-active" : "stepper__bar"} />
              <strong>{step}</strong>
            </div>
          ))}
        </div>

        <h1>¿Cuál es tu nivel de experiencia?</h1>

        <div className="experience-grid">
          <button className="experience-card" type="button">
            <FiFeather />
            <strong>Junior</strong>
            <span>0-2 años de experiencia. Aprendiendo fundamentos y buenas prácticas.</span>
          </button>

          <button className="experience-card experience-card--active" type="button">
            <FiCode />
            <strong>Mid</strong>
            <span>2-5 años de experiencia. Construyendo soluciones de forma autónoma.</span>
          </button>

          <button className="experience-card" type="button">
            <FiCpu />
            <strong>Senior</strong>
            <span>5+ años de experiencia. Liderando arquitectura y decisiones técnicas.</span>
          </button>
        </div>

        <div className="assessment-block">
          <h2>Define tu Meta Profesional</h2>
          <p>Escribe el rol o especialización que deseas alcanzar</p>
          <input
            type="text"
            placeholder="Ej: Desarrollador Backend, Ingeniero DevOps, Data Engineer..."
          />
        </div>

        <div className="assessment-block">
          <h2>Selecciona tus tecnologías</h2>

          <div className="tech-grid">
            {techGroups.map((group) => (
              <article className={`tech-panel tech-panel--${group.tone}`} key={group.title}>
                <h3>
                  {group.icon}
                  {group.title}
                </h3>

                <div className="tech-tags">
                  {group.items.map((item, index) => (
                    <button
                      className={index % 2 === 0 ? "tech-tag tech-tag--selected" : "tech-tag"}
                      type="button"
                      key={item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="assessment-actions">
          <button className="ghost-action" type="button">
            ← Volver al inicio
          </button>
          <button className="ghost-action" type="button">
            Saltar por ahora
          </button>
          <button className="primary-action" type="button">
            Generar Ruta con IA
            <FiEdit3 />
          </button>
        </div>
      </div>
    </section>
  );
}

export default PerfilPage;
