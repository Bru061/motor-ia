import { Link } from "react-router-dom";
import { FiArrowRight, FiGitBranch, FiUserCheck } from "react-icons/fi";
import { formatDate, getInitials } from "../../../utils/formatters";

function BooleanBadge({ active, icon: Icon, labelActive, labelInactive }) {
  return (
    <span
      className={active ? "admin-badge admin-badge--success" : "admin-badge"}
    >
      <Icon aria-hidden="true" />
      {active ? labelActive : labelInactive}
    </span>
  );
}

function AdminUsersTable({ users }) {
  return (
    <div className="users-table" role="table" aria-label="Usuarios registrados">
      <div className="users-table__head" role="row">
        <span role="columnheader">Usuario</span>
        <span role="columnheader">Meta profesional</span>
        <span role="columnheader">Perfil</span>
        <span role="columnheader">Ruta activa</span>
        <span role="columnheader">Registro</span>
        <span role="columnheader">Acción</span>
      </div>

      {users.map((user) => (
        <div className="users-table__row" role="row" key={user.id}>
          <span className="user-initial user-initial--cyan" aria-hidden="true">
            {getInitials(user.nombre, user.email)}
          </span>
          <div className="users-table__identity">
            <Link
              className="users-table__name-link"
              to={`/admin/usuarios/${user.id}`}
            >
              <strong>{user.nombre || "Sin nombre"}</strong>
            </Link>
            <span>{user.email}</span>
          </div>
          <span className="admin-badge admin-badge--role">
            {user.meta_profesional || "Sin perfil"}
          </span>
          <BooleanBadge
            active={user.tiene_perfil}
            icon={FiUserCheck}
            labelActive="Completo"
            labelInactive="Pendiente"
          />
          <BooleanBadge
            active={user.tiene_ruta_activa}
            icon={FiGitBranch}
            labelActive="Activa"
            labelInactive="Sin ruta"
          />
          <span>
            {formatDate(user.created_at, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <Link className="admin-row-action" to={`/admin/usuarios/${user.id}`}>
            Ver detalle
            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      ))}
    </div>
  );
}

export default AdminUsersTable;
