const LEVEL_LABELS = {
  junior: "Junior",
  intermediate: "Intermedio",
  mid: "Mid",
  advanced: "Avanzado",
  senior: "Senior",
};

function buildLevelRows(modules) {
  const groups = new Map();

  modules.forEach((module) => {
    const key = module.nivel || "sin_nivel";
    const current = groups.get(key) || {
      completed: 0,
      key,
      label: LEVEL_LABELS[key] || key,
      total: 0,
    };

    current.total += 1;

    if (module.estado === "completado") {
      current.completed += 1;
    }

    groups.set(key, current);
  });

  return Array.from(groups.values()).map((row) => ({
    ...row,
    percentage: row.total ? Math.round((row.completed * 10000) / row.total) / 100 : 0,
  }));
}

function ProgressLevelChart({ modules }) {
  const rows = buildLevelRows(modules);

  return (
    <article className="progress-chart-card">
      <div className="progress-chart-card__heading">
        <h2>Avance por nivel</h2>
        <span>Datos de la ruta activa</span>
      </div>

      {rows.length > 0 ? (
        <div className="progress-level-chart">
          {rows.map((row) => (
            <div className="progress-level-row" key={row.key}>
              <div>
                <strong>{row.label}</strong>
                <span>
                  {row.completed} de {row.total} módulos completados
                </span>
              </div>
              <strong>{Math.round(row.percentage)}%</strong>
              <i aria-hidden="true">
                <b style={{ "--progress-level": `${row.percentage}%` }} />
              </i>
            </div>
          ))}
        </div>
      ) : (
        <p className="progress-chart-card__empty">
          La ruta activa no contiene niveles para graficar.
        </p>
      )}
    </article>
  );
}

export default ProgressLevelChart;
