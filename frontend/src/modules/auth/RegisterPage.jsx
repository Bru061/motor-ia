import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import useAuth from "../../hooks/useAuth";
import "../../styles/Auth.css";

function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    nombre: "",
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.nombre.trim()) {
      setError("Ingresa tu nombre.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      const data = await register(formData);
      const role = data.rol || data.role;

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "No fue posible crear la cuenta. Intenta nuevamente.";

      setError(message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-tabs">
        <Link className="auth-tabs__item--active" to="/register">
          Registrarse
        </Link>
        <Link to="/login">Iniciar Sesión</Link>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-form__error">{error}</div>}

        <div className="auth-form__group">
          <label htmlFor="nombre">Nombre completo</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            placeholder="Ej: María González"
            value={formData.nombre}
            onChange={handleChange}
            autoComplete="name"
          />
        </div>

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
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        <button className="auth-form__button" type="submit" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta y comenzar"}
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

export default RegisterPage;
