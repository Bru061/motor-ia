import { useId } from "react";

const POINT_SPACING = 76;
const CHART_HEIGHT = 200;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 34;

/**
 * Gráfico de línea (con área rellena) para series de valores en el
 * tiempo, como registros por día. Hecho a mano con SVG, sin librerías
 * nuevas — mismo enfoque que el resto de gráficos de la app.
 */
function TrendLineChart({ items, labelKey, valueKey = "count", emptyLabel }) {
  const gradientId = useId();

  if (!items.length) {
    return <p className="admin-muted-text">{emptyLabel}</p>;
  }

  const maxValue = Math.max(
    ...items.map((item) => Number(item[valueKey]) || 0),
    1,
  );
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const width = Math.max(items.length - 1, 1) * POINT_SPACING + 40;

  const points = items.map((item, index) => {
    const value = Number(item[valueKey]) || 0;
    const x = 20 + index * POINT_SPACING;
    const y = PADDING_TOP + innerHeight - (value / maxValue) * innerHeight;
    return { x, y, value, label: item[labelKey] };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    `${linePath} ` +
    `L ${points[points.length - 1].x} ${PADDING_TOP + innerHeight} ` +
    `L ${points[0].x} ${PADDING_TOP + innerHeight} Z`;

  return (
    <div className="trend-line-chart">
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        width={width}
        height={CHART_HEIGHT}
        role="img"
        aria-label="Gráfico de línea de registros por día"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              style={{ stopColor: "rgba(var(--cyan-rgb), 0.32)" }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "rgba(var(--cyan-rgb), 0)" }}
            />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={linePath}
          fill="none"
          style={{ stroke: "var(--cyan)" }}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point) => (
          <g key={`${point.label}-${point.value}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              style={{ fill: "var(--cyan)" }}
            >
              <title>
                {point.label}: {point.value}
              </title>
            </circle>
            <text
              x={point.x}
              y={CHART_HEIGHT - 12}
              textAnchor="middle"
              className="trend-line-chart__label"
            >
              {point.label}
            </text>
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              className="trend-line-chart__value"
            >
              {point.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default TrendLineChart;
