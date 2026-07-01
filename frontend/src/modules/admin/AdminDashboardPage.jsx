import { FiActivity, FiBarChart2, FiClock, FiUsers } from "react-icons/fi";

const adminMetrics = [
  { icon: <FiUsers />, value: "48", label: "Usuarios activos", tone: "cyan" },
  { icon: <FiBarChart2 />, value: "73%", label: "Avance promedio", tone: "green" },
  { icon: <FiClock />, value: "18h", label: "Tiempo medio semanal", tone: "amber" },
  { icon: <FiActivity />, value: "12", label: "Rutas generadas hoy", tone: "violet" },
];

function AdminDashboardPage() {
  return (
    <section className="admin-page">
      <div className="page-title">
        <h1>Dashboard Administrativo</h1>
        <p>Vista ejecutiva del uso, avance y adopción de Motor IA.</p>
      </div>

      <div className="admin-metric-grid">
        {adminMetrics.map((metric) => (
          <article className={`dashboard-card metric-card metric-card--${metric.tone}`} key={metric.label}>
            <span className="metric-card__icon">{metric.icon}</span>
            <strong>{metric.value}</strong>
            <p>{metric.label}</p>
          </article>
        ))}
      </div>

      <div className="admin-insights">
        <article className="admin-panel">
          <div className="section-heading">
            <h2>Actividad de Plataforma</h2>
            <span>Últimas 24 horas</span>
          </div>
          <div className="timeline-list">
            {[
              "14 usuarios completaron módulos frontend",
              "6 nuevas rutas fueron regeneradas con IA",
              "3 usuarios alcanzaron nivel avanzado",
              "2 administradores exportaron reportes",
            ].map((item) => (
              <div className="timeline-item" key={item}>
                <i />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="section-heading">
            <h2>Distribución por Rol</h2>
            <span>Cohorte actual</span>
          </div>
          <div className="role-stack">
            <span className="role-stack__frontend">Frontend 38%</span>
            <span className="role-stack__backend">Backend 27%</span>
            <span className="role-stack__data">Data 21%</span>
            <span className="role-stack__devops">DevOps 14%</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
