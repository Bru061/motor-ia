import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import useAuth from "../../hooks/useAuth";
import "../../styles/Layout.css";

function Header({ title = "MotorIA", initials = "MI" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <div className="header__spacer" />

      <div className="header__profile" aria-label="Perfil actual">
        <span className="header__initials">{initials}</span>
        <strong>{title}</strong>
      </div>

      <button
        className="header__button"
        type="button"
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <FiLogOut />
      </button>
    </header>
  );
}

export default Header;
