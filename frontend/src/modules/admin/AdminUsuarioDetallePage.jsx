function AdminUsuarioDetallePage() {
  return (
    <section className="admin-page">
      <div className="page-title">
        <h1>Detalle de Usuario</h1>
        <p>Perfil, avance y ruta asignada del estudiante seleccionado.</p>
      </div>

      <article className="admin-panel user-detail-panel">
        <div className="profile-heading">
          <div className="profile-avatar">ML</div>
          <div>
            <h2>Marta Linares</h2>
            <p>Full-Stack Developer · 85% de avance</p>
          </div>
        </div>

        <div className="profile-tags">
          {["React", "Python", "Docker", "PostgreSQL", "Testing"].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </article>
    </section>
  );
}

export default AdminUsuarioDetallePage;
