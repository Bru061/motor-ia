import { NavLink, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiBarChart2,
  FiDatabase,
  FiGitBranch,
  FiHome,
  FiLogOut,
  FiMap,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import "../../styles/Layout.css";

function Sidebar({ type = "student" }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();

  const studentLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: FiBarChart2,
    },
    {
      to: "/perfil",
      label: "Perfil tecnológico",
      icon: FiDatabase,
    },
    {
      to: "/ruta",
      label: "Ruta",
      icon: FiMap,
    },
    {
      to: "/progreso",
      label: "Progreso",
      icon: FiActivity,
    },
  ];

  const adminLinks = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: FiHome,
    },
    {
      to: "/admin/usuarios",
      label: "Usuarios",
      icon: FiUsers,
    },
    {
      to: "/admin/analitica",
      label: "Analítica",
      icon: FiDatabase,
    },
  ];

  const links = type === "admin" ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada correctamente.");
    navigate("/login", { replace: true });
  };

  const notifySettings = () => {
    toast.info("La configuración estará disponible en una siguiente versión.", {
      title: "Próximamente",
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <FiGitBranch aria-hidden="true" />
        <h2>Motor IA</h2>
      </div>

      <nav className="sidebar__nav" aria-label="Navegación principal">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
              }
            >
              <span className="sidebar__icon">
                <Icon aria-hidden="true" focusable="false" />
              </span>
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__action" type="button" onClick={notifySettings}>
          <FiSettings aria-hidden="true" />
          <span>Configuración</span>
        </button>

        <button className="sidebar__action" type="button" onClick={handleLogout}>
          <FiLogOut aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
