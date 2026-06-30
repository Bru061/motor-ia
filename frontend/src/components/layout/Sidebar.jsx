import { NavLink } from "react-router-dom";
import { FiHome, FiUser, FiMap, FiBarChart2, FiUsers, FiPieChart } from "react-icons/fi";
import "./Layout.css";

function Sidebar({ type = "student" }) {
  const studentLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <FiHome />,
    },
    {
      to: "/perfil",
      label: "Perfil",
      icon: <FiUser />,
    },
    {
      to: "/ruta",
      label: "Mi ruta",
      icon: <FiMap />,
    },
    {
      to: "/progreso",
      label: "Progreso",
      icon: <FiBarChart2 />,
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
      label: "Analítica",
      icon: <FiPieChart />,
    },
  ];

  const links = type === "admin" ? adminLinks : studentLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <h2>MotorIA</h2>
        <span>{type === "admin" ? "Admin" : "Estudiante"}</span>
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
    </aside>
  );
}

export default Sidebar;