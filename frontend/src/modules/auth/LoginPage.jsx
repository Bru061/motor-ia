import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      redirectByRole(data.rol);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "No fue posible iniciar sesión. Verifica tus credenciales.";

      setError(message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-page__header">
        <h1>Iniciar sesión</h1>
        <p>Accede a tu cuenta de MotorIA.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-form__error">{error}</div>}

        <div className="auth-form__group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
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
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="auth-form__footer">
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </section>
  );
}

export default LoginPage;