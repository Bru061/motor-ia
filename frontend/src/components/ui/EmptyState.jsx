import { FiInfo } from "react-icons/fi";

function EmptyState({
  action,
  className = "",
  description,
  eyebrow,
  icon: Icon = FiInfo,
  title,
  tone = "info",
}) {
  return (
    <article className={`ui-empty-state ui-empty-state--${tone} ${className}`.trim()}>
      <span className="ui-empty-state__icon">
        <Icon aria-hidden="true" />
      </span>
      {eyebrow && <span className="ui-empty-state__eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="ui-empty-state__action">{action}</div>}
    </article>
  );
}

export default EmptyState;
