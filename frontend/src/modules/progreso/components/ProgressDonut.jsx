function clampPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
}

function ProgressDonut({ caption, label, value }) {
  const percentage = Math.round(clampPercentage(value));

  return (
    <article className="progress-chart-card progress-chart-card--donut">
      <div
        className="progress-donut"
        style={{ "--progress-donut": `${percentage}%` }}
        role="img"
        aria-label={`${label}: ${percentage}%`}
      >
        <strong>{percentage}%</strong>
        <span>{label}</span>
      </div>
      {caption && <p>{caption}</p>}
    </article>
  );
}

export default ProgressDonut;
