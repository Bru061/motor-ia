import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiLogOut,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import UserAvatar from "../ui/UserAvatar";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import {
  getUserDisplayName,
  getUserProfilePath,
  getUserSettingsPath,
} from "../../utils/user";
import "../../styles/Layout.css";

function Header() {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout, role, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const displayName = getUserDisplayName(user);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    toast.info("Sesión cerrada correctamente.");
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <div className="header__spacer" />

      <div className="header-user-menu" ref={menuRef}>
        <button
          className="header-user-menu__trigger"
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-controls="header-user-menu"
        >
          <UserAvatar label={displayName} value={displayName} />
          <strong>{displayName}</strong>
          <FiChevronDown aria-hidden="true" />
        </button>

        {isMenuOpen && (
          <div className="header-user-dropdown" id="header-user-menu" role="menu">
            <Link
              to={getUserProfilePath(role)}
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              <FiUser aria-hidden="true" />
              <span>Mi Perfil</span>
            </Link>
            <Link
              to={getUserSettingsPath(role)}
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              <FiSettings aria-hidden="true" />
              <span>Configuración</span>
            </Link>
            <button type="button" role="menuitem" onClick={handleLogout}>
              <FiLogOut aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
