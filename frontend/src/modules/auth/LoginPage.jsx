import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import FloatingInput from "../../components/ui/FloatingInput";
import LoadingButton from "../../components/ui/LoadingButton";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import "../../styles/Auth.css";

function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
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
    setError("");
  };

  const redirectByRole = (role) => {
    if (role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  const notifyUnavailable = () => {
    toast.info("Esta opción aún no está disponible.", {
      title: "Próximamente",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      const message = "Ingresa tu correo y contraseña.";
      setError(message);
      toast.warning(message);
      return;
    }

    try {
      const data = await login(formData);
      toast.success("Sesión iniciada correctamente.");
      redirectByRole(data.rol || data.role);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "No fue posible iniciar sesión. Verifica tus credenciales.";

      setError(message);
      toast.error(message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-tabs" aria-label="Acceso a Motor IA">
        <Link to="/register">Registrarse</Link>
        <Link className="auth-tabs__item--active" to="/login" aria-current="page">
          Iniciar sesión
        </Link>
      </div>

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        aria-describedby={error ? "login-error" : undefined}
        noValidate
      >
        {error && (
          <div className="auth-form__error" id="login-error" role="alert">
            {error}
          </div>
        )}

        <FloatingInput
          id="login-email"
          name="email"
          type="email"
          label="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          aria-invalid={Boolean(error && !formData.email.trim())}
        />

        <FloatingInput
          id="login-password"
          name="password"
          type="password"
          label="Contraseña"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          aria-invalid={Boolean(error && !formData.password.trim())}
        />

        <LoadingButton
          className="auth-form__button"
          type="submit"
          isLoading={loading}
          loadingText="Iniciando sesión..."
        >
          Iniciar sesión
        </LoadingButton>
      </form>

      <button className="auth-link-button" type="button" onClick={notifyUnavailable}>
        ¿Olvidaste tu contraseña?
      </button>

      <div className="auth-separator">
        <span>o continúa con</span>
      </div>

      <button
        className="auth-social"
        type="button"
        aria-label="Continuar con Google"
        onClick={notifyUnavailable}
      >
        <FcGoogle aria-hidden="true" />
        <span>Google</span>
      </button>
    </section>
  );
}

export default LoginPage;
