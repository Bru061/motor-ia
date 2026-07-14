function clampPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
}

function SkillGapChart({ gaps }) {
  if (!gaps.length) {
    return (
      <p className="admin-muted-text">
        No hay brechas detectadas con los perfiles analizados.
      </p>
    );
  }

  return (
    <div className="skill-gap-chart">
      {gaps.map((gap, index) => {
        const percentage = clampPercentage(gap.porcentaje);

        return (
          <article className="skill-gap-item" key={gap.tecnologia}>
            <span className="skill-gap-item__rank">{index + 1}</span>
            <div className="skill-gap-item__content">
              <div className="skill-gap-item__header">
                <strong>{gap.tecnologia}</strong>
                <span>
                  {gap.usuarios_con_brecha} usuario
                  {gap.usuarios_con_brecha === 1 ? "" : "s"} con brecha
                </span>
              </div>
              <div className="skill-gap-item__track" aria-hidden="true">
                <span style={{ "--skill-gap-progress": `${percentage}%` }} />
              </div>
            </div>
            <strong className="skill-gap-item__percentage">
              {percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%
            </strong>
          </article>
        );
      })}
    </div>
  );
}

export default SkillGapChart;
