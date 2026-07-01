import {
  FiAward,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiGitBranch,
  FiRepeat,
} from "react-icons/fi";

const recentActivity = [
  {
    icon: <FiBarChart2 />,
    title: 'Completaste el módulo "Hooks Avanzados en React"',
    time: "Hace 2 días",
  },
  {
    icon: <FiAward />,
    title: 'Badge desbloqueado: "API Master"',
    time: "Hace 3 días",
  },
  {
    icon: <FiCode />,
    title: "Ejercicio práctico: Autenticación con JWT",
    time: "Hace 5 días",
  },
];

function DashboardPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-grid">
        <article className="dashboard-card dashboard-card--profile">
          <div className="profile-avatar">AR</div>
          <div>
            <div className="profile-heading">
              <h1>Andrés Restrepo</h1>
              <span>Nivel Intermedio</span>
            </div>
            <p>Meta profesional: Desarrollador Full Stack Senior</p>
            <div className="profile-tags">
              {["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"].map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </article>

        <article className="dashboard-card dashboard-card--progress">
          <div className="progress-ring" style={{ "--value": "60%" }}>
            <strong>60%</strong>
            <span>completado</span>
          </div>
          <p>Avance General del Roadmap</p>
        </article>

        <article className="dashboard-card metric-card">
          <span className="metric-card__icon metric-card__icon--green">
            <FiCheckCircle />
          </span>
          <strong>12</strong>
          <p>Módulos Completados</p>
        </article>

        <article className="dashboard-card metric-card">
          <span className="metric-card__icon metric-card__icon--amber">
            <FiClock />
          </span>
          <strong>8</strong>
          <p>Módulos Pendientes</p>
        </article>

        <article className="dashboard-card metric-card">
          <span className="metric-card__icon metric-card__icon--pink">
            <FiClock />
          </span>
          <strong>34</strong>
          <p>Horas Restantes Estimadas</p>
        </article>

        <article className="dashboard-card activity-card">
          <div className="section-heading">
            <h2>Actividad Reciente</h2>
            <span>Últimos 7 días</span>
          </div>

          <div className="activity-list">
            {recentActivity.map((item) => (
              <div className="activity-item" key={item.title}>
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.time}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="dashboard-card quick-card">
          <h2>Accesos Rápidos</h2>
          <button type="button">
            <FiGitBranch />
            Ver Roadmap Completo
          </button>
          <button type="button">
            <FiRepeat />
            Repetir Assessment
          </button>
          <button type="button">
            <FiBarChart2 />
            Ver Analíticas
          </button>

          <div className="beta-note">
            <strong>BETA v0.9.2</strong>
            <span>Motor IA en mejora continua. Tu feedback importa.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default DashboardPage;
