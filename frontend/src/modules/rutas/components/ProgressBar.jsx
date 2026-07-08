function ProgressBar({ value }) {
  const normalizedValue = Math.min(100, Math.max(0, Number(value) || 0));
  const roundedValue = Math.round(normalizedValue);

  return (
    <div className="route-progress-bar">
      <div className="route-progress-bar__labels">
        <span>Avance de la ruta</span>
        <strong>{roundedValue}%</strong>
      </div>
      <div
        className="route-progress-bar__track"
        role="progressbar"
        aria-label="Porcentaje de módulos completados"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={roundedValue}
      >
        <span style={{ width: `${normalizedValue}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
