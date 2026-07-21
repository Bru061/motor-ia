const STATUS_ITEMS = [
  {
    key: "modulos_completados",
    label: "Completados",
    tone: "success",
  },
  {
    key: "modulos_en_progreso",
    label: "En progreso",
    tone: "warning",
  },
  {
    key: "modulos_pendientes",
    label: "Pendientes",
    tone: "muted",
  },
];

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function ProgressStatusChart({ summary }) {
  const total =
    safeNumber(summary?.total_modulos) ||
    STATUS_ITEMS.reduce((count, item) => count + safeNumber(summary?.[item.key]), 0);

  return (
    <article className="progress-chart-card">
      <div className="progress-chart-card__heading">
        <h2>Módulos completados vs pendientes</h2>
        <span>{total} módulos</span>
      </div>

      <div className="progress-status-bars">
        {STATUS_ITEMS.map((item) => {
          const value = safeNumber(summary?.[item.key]);
          const percentage = total ? Math.round((value * 10000) / total) / 100 : 0;

          return (
            <div className="progress-status-row" key={item.key}>
              <div>
                <span className={`progress-status-dot progress-status-dot--${item.tone}`} />
                <strong>{item.label}</strong>
              </div>
              <span>{value}</span>
              <i aria-hidden="true">
                <b
                  className={`progress-status-fill progress-status-fill--${item.tone}`}
                  style={{ "--progress-status": `${percentage}%` }}
                />
              </i>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default ProgressStatusChart;
