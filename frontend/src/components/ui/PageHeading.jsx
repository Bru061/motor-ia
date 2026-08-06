/**
 * Encabezado de página reutilizable: mismo formato que ya usan
 * Dashboard, Ruta de aprendizaje y Perfil tecnológico (eyebrow con
 * ícono + título grande + descripción), para que Progreso, el
 * Dashboard administrativo, Usuarios, Detalle de usuario y Analítica
 * se vean consistentes con el resto de la app.
 */
function PageHeading({ eyebrow, icon: Icon, title, description, action }) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && (
          <span className="page-heading__eyebrow">
            {Icon && <Icon aria-hidden="true" />}
            {eyebrow}
          </span>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-heading__action">{action}</div>}
    </header>
  );
}

export default PageHeading;
