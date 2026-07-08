function KpiCard({ icon: Icon, value, label, tone = "default" }) {
  return (
    <article className={`route-progress-kpi route-progress-kpi--${tone}`}>
      <span className="route-progress-kpi__icon">
        <Icon aria-hidden="true" />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
  );
}

export default KpiCard;
