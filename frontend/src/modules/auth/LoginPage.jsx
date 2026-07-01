import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import useAuth from "../../hooks/useAuth";
import "../../styles/Auth.css";

function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const redirectByRole = (role) => {
    if (role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    try {
      const data = await login(formData);
      redirectByRole(data.rol || data.role);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "No fue posible iniciar sesión. Verifica tus credenciales.";

      setError(message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-tabs">
        <Link to="/register">Registrarse</Link>
        <Link className="auth-tabs__item--active" to="/login">
          Iniciar Sesión
        </Link>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-form__error">{error}</div>}

        <div className="auth-form__group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>

        <div className="auth-form__group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>

        <button className="auth-form__button" type="submit" disabled={loading}>
          {loading ? "Iniciando..." : "Iniciar sesión"}
        </button>
      </form>

      <button className="auth-link-button" type="button">
        ¿Olvidaste tu contraseña?
      </button>

      <div className="auth-separator">
        <span>o continúa con</span>
      </div>

      <button className="auth-social" type="button">
        <FcGoogle />
        <span>Google</span>
      </button>
    </section>
  );
}

export default LoginPage;
