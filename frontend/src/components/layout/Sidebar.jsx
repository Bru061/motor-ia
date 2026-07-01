import { NavLink, useNavigate } from "react-router-dom";
import {
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
import "../../styles/Layout.css";

function Sidebar({ type = "student" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const studentLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <FiBarChart2 />,
    },
    {
      to: "/perfil",
      label: "Skill Assessment",
      icon: <FiDatabase />,
    },
    {
      to: "/ruta",
      label: "Roadmap",
      icon: <FiMap />,
    },
  ];

  const adminLinks = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: <FiHome />,
    },
    {
      to: "/admin/usuarios",
      label: "Usuarios",
      icon: <FiUsers />,
    },
    {
      to: "/admin/analitica",
      label: "Datos y Exportar",
      icon: <FiDatabase />,
    },
  ];

  const links = type === "admin" ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <FiGitBranch />
        <h2>Motor IA</h2>
      </div>

      <nav className="sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
            }
          >
            <span className="sidebar__icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__action" type="button">
          <FiSettings />
          <span>Configuración</span>
        </button>

        <button className="sidebar__action" type="button" onClick={handleLogout}>
          <FiLogOut />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
