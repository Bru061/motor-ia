import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import "../../styles/Layout.css";

function Header({ title = "MotorIA", initials = "MI" }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada correctamente.");
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <div className="header__spacer" />

      <div className="header__profile" aria-label="Perfil actual">
        <span className="header__initials" aria-hidden="true">
          {initials}
        </span>
        <strong>{title}</strong>
      </div>

      <button
        className="header__button"
        type="button"
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <FiLogOut aria-hidden="true" />
      </button>
    </header>
  );
}

export default Header;
