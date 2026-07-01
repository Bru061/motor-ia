const categories = [
  ["Frontend", "82%", "cyan"],
  ["Backend", "54%", "amber"],
  ["DevOps", "35%", "pink"],
  ["Data", "61%", "violet"],
];

const bars = [
  ["React", "88%", "cyan"],
  ["Python", "76%", "violet"],
  ["TypeScript", "71%", "green"],
  ["Docker", "58%", "amber"],
  ["AWS", "45%", "pink"],
];

function AdminAnaliticaPage() {
  return (
    <section className="admin-page">
      <div className="page-title">
        <h1>Analítica Administrativa</h1>
        <p>Tecnologías demandadas y skill gaps por categoría.</p>
      </div>

      <div className="admin-insights admin-insights--wide">
        <article className="admin-panel">
          <div className="section-heading">
            <h2>Tecnologías Más Estudiadas</h2>
            <span>Últimos 30 días</span>
          </div>

          <div className="tech-ranking tech-ranking--large">
            {bars.map(([name, progress, tone]) => (
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
            {categories.map(([label, value, tone]) => (
              <div className={`gap-card gap-card--${tone}`} key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{Number.parseInt(value, 10) > 70 ? "Bajo gap" : "Medio"}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminAnaliticaPage;
