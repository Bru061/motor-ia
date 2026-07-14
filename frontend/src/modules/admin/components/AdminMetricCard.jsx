function AdminMetricCard({ icon: Icon, label, value, tone = "cyan", caption }) {
  return (
    <article className={`dashboard-card metric-card metric-card--${tone}`}>
      <span className="metric-card__icon">
        <Icon aria-hidden="true" />
      </span>
      <strong>{value}</strong>
      <p>{label}</p>
      {caption && <small>{caption}</small>}
    </article>
  );
}

export default AdminMetricCard;
