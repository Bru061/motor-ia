import { NavLink } from "react-router-dom";
import {
  FiActivity,
  FiBarChart2,
  FiDatabase,
  FiGitBranch,
  FiHome,
  FiMap,
  FiUsers,
} from "react-icons/fi";
import "../../styles/Layout.css";

function Sidebar({ type = "student" }) {
  const studentLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: FiBarChart2,
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
    </aside>
  );
}

export default Sidebar;
