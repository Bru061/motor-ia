import { FiChevronLeft, FiChevronRight, FiFilter, FiSearch } from "react-icons/fi";

const users = [
  ["ML", "Marta Linares", "Full-Stack Developer", "85%", "Activo", "Hace 2h", "cyan"],
  ["CR", "Carlos Rueda", "Data Scientist", "62%", "Activo", "Hace 5h", "amber"],
  ["SV", "Sandra Villamizar", "UX/UI Designer", "91%", "Activo", "Hace 1d", "violet"],
  ["JP", "Jorge Peñaloza", "DevOps Engineer", "38%", "Pausado", "Hace 3d", "pink"],
  ["LT", "Lucía Torres", "ML Engineer", "74%", "Activo", "Hace 8h", "green"],
];

const studiedTech = [
  ["React", "88%", "cyan"],
  ["Python", "76%", "violet"],
  ["TypeScript", "71%", "green"],
  ["Docker", "58%", "amber"],
  ["AWS", "45%", "pink"],
  ["Figma", "39%", "green"],
];

function AdminUsuariosPage() {
  return (
    <section className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-search">
          <FiSearch />
          <input type="search" placeholder="Buscar usuarios, metas o tecnologías..." />
        </div>
        <button type="button">
          <FiFilter />
          Filtros
        </button>
      </div>

      <article className="admin-panel users-panel">
        <div className="section-heading">
          <h1>Usuarios y Progreso</h1>
          <div className="admin-panel__actions">
            <span>48 usuarios activos</span>
            <button type="button">Exportar</button>
          </div>
        </div>

        <div className="users-table">
          <div className="users-table__head">
            <span>Usuario</span>
            <span>Meta Profesional</span>
            <span>Progreso</span>
            <span>Estado</span>
            <span>Última Actividad</span>
          </div>

          {users.map(([initials, name, goal, progress, status, activity, tone]) => (
            <div className="users-table__row" key={name}>
              <span className={`user-initial user-initial--${tone}`}>{initials}</span>
              <strong>{name}</strong>
              <span>{goal}</span>
              <span className="table-progress" style={{ "--progress": progress }}>
                <i />
                <b>{progress}</b>
              </span>
              <span className={status === "Activo" ? "status-active" : "status-paused"}>
                {status}
              </span>
              <span>{activity}</span>
            </div>
          ))}
        </div>

        <div className="table-footer">
          <span>Mostrando 1-5 de 48</span>
          <div className="pagination">
            <button type="button" aria-label="Página anterior">
              <FiChevronLeft />
            </button>
            {["1", "2", "3", "...", "10"].map((page) => (
              <button className={page === "1" ? "is-active" : ""} type="button" key={page}>
                {page}
              </button>
            ))}
            <button type="button" aria-label="Página siguiente">
              <FiChevronRight />
            </button>
          </div>
        </div>
      </article>

      <div className="admin-insights">
        <article className="admin-panel">
          <div className="section-heading">
            <h2>Tecnologías Más Estudiadas</h2>
            <span>Últimos 30 días</span>
          </div>

          <div className="tech-ranking">
            {studiedTech.map(([name, progress, tone]) => (
              <div className={`ranking-row ranking-row--${tone}`} key={name}>
                <span>{name}</span>
                <i style={{ "--progress": progress }}>
                  <b />
                </i>
                <strong>{progress}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="section-heading">
            <h2>Skill Gaps por Equipo</h2>
            <span>Análisis por categoría</span>
          </div>

          <div className="gap-grid">
            {[
              ["Frontend", "82%", "Bajo gap", "cyan"],
              ["Backend", "54%", "Medio", "amber"],
              ["DevOps", "35%", "Alto gap", "pink"],
              ["Data", "61%", "Medio", "violet"],
            ].map(([label, value, caption, tone]) => (
              <div className={`gap-card gap-card--${tone}`} key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{caption}</small>
              </div>
            ))}
          </div>

          <div className="gap-bars">
            {["CI/CD", "Testing", "Security", "Cloud", "API"].map((bar, index) => (
              <span className={`gap-bars__item gap-bars__item--${index}`} key={bar}>
                {bar}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminUsuariosPage;
