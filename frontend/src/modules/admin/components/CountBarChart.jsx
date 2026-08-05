/**
 * Gráfico de barras verticales para valores absolutos (conteos), no
 * porcentajes. Reutiliza el mismo CSS que ColumnChart (column-chart,
 * column-chart__col, etc.) pero normaliza la altura contra el valor
 * máximo del set en vez de asumir una escala 0-100, y muestra el
 * número real arriba de cada barra en vez de un "%".
 */
function CountBarChart({ items, labelKey, valueKey = "count", emptyLabel }) {
  if (!items.length) {
    return <p className="admin-muted-text">{emptyLabel}</p>;
  }

  const maxValue = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);

  return (
    <div className="column-chart">
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const heightPercentage = (value / maxValue) * 100;
        const label = item[labelKey];

        return (
          <div className="column-chart__col" key={item.id || label}>
            <span className="column-chart__value">{value}</span>
            <div className="column-chart__track" aria-hidden="true">
              <span
                className="column-chart__bar"
                style={{
                  "--column-height": `${value > 0 ? Math.max(heightPercentage, 4) : 0}%`,
                }}
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

export default CountBarChart;