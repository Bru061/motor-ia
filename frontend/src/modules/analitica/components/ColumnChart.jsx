function clampPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
}

/**
 * Gráfico de barras verticales (columnas), dibujado a mano con divs
 * (sin librería de gráficas). Es la vista alterna a las listas con
 * barra de progreso horizontal que ya existían en Analítica.
 */
function ColumnChart({ items, labelKey, valueKey = "porcentaje", emptyLabel }) {
  if (!items.length) {
    return <p className="admin-muted-text">{emptyLabel}</p>;
  }

  return (
    <div className="column-chart">
      {items.map((item) => {
        const percentage = clampPercentage(item[valueKey]);
        const label = item[labelKey];

        return (
          <div className="column-chart__col" key={item.categoria_id || label}>
            <span className="column-chart__value">
              {percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%
            </span>
            <div className="column-chart__track" aria-hidden="true">
              <span
                className="column-chart__bar"
                style={{ "--column-height": `${Math.max(percentage, 2)}%` }}
              />
            </div>
            <span className="column-chart__label" title={label}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default ColumnChart;
