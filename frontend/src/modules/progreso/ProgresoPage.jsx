import { FiCheckCircle, FiClock, FiCode } from "react-icons/fi";

function ProgresoPage() {
  return (
    <section className="dashboard-page">
      <div className="page-title">
        <h1>Progreso</h1>
        <p>Seguimiento de módulos, tiempos estimados y tareas pendientes.</p>
      </div>

      <div className="progress-overview">
        {[
          ["HTML, CSS y JavaScript", "100%", "Completado", <FiCheckCircle />],
          ["Git & CLI", "65%", "En progreso", <FiCode />],
          ["React.js", "25%", "En progreso", <FiClock />],
        ].map(([title, progress, status, icon]) => (
          <article className="dashboard-card progress-module" key={title}>
            <span>{icon}</span>
            <div>
              <h2>{title}</h2>
              <p>{status}</p>
              <i style={{ "--progress": progress }}>
                <b />
              </i>
            </div>
            <strong>{progress}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProgresoPage;
