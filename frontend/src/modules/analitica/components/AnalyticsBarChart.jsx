function clampPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
}

function AnalyticsBarChart({
  items,
  labelKey,
  valueKey = "porcentaje",
  countKey,
  emptyLabel,
}) {
  if (!items.length) {
    return <p className="admin-muted-text">{emptyLabel}</p>;
  }

  return (
    <div className="analytics-bars">
      {items.map((item) => {
        const percentage = clampPercentage(item[valueKey]);
        const label = item[labelKey];
        const count = item[countKey];

        return (
          <article className="analytics-bar-row" key={item.categoria_id || label}>
            <div className="analytics-bar-row__header">
              <div>
                <strong>{label}</strong>
                {item.descripcion && <span>{item.descripcion}</span>}
              </div>
              <div className="analytics-bar-row__value">
                <strong>{percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%</strong>
                {count !== undefined && <span>{count} usuario{count === 1 ? "" : "s"}</span>}
              </div>
            </div>
            <div className="analytics-bar-row__track" aria-hidden="true">
              <span style={{ "--analytics-progress": `${percentage}%` }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default AnalyticsBarChart;
