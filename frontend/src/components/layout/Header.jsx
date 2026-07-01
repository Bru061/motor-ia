import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "../../styles/Layout.css";

function Header({ title = "MotorIA" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>Motor de personalización de rutas de aprendizaje con IA</p>
      </div>

      <button className="header__button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </header>
  );
}

export default Header;