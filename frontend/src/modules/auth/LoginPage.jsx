import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import FloatingInput from "../../components/ui/FloatingInput";
import LoadingButton from "../../components/ui/LoadingButton";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import useToast from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/apiError";
import "../../styles/Auth.css";

function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { theme } = useTheme();
  const { login, loginWithGoogle, loading } = useAuth();

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");

    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      toast.success("Sesión iniciada correctamente.");
      redirectByRole(data.rol || data.role);
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "No fue posible iniciar sesión con Google.",
      );

      setError(message);
      toast.error(message);
    }
  };

  const handleGoogleError = () => {
    toast.error("No fue posible iniciar sesión con Google.");
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
      const message = getApiErrorMessage(
        err,
        "No fue posible iniciar sesión. Verifica tus credenciales.",
      );

      setError(message);
      toast.error(message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-tabs" aria-label="Acceso a Motor IA">
        <Link to="/register">Registrarse</Link>
        <Link
          className="auth-tabs__item--active"
          to="/login"
          aria-current="page"
        >
          Iniciar sesión
        </Link>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

      <Link className="auth-link-button" to="/forgot-password">
        ¿Olvidaste tu contraseña?
      </Link>

      <div className="auth-separator">
        <span>o continúa con</span>
      </div>

      <div className="auth-social">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text="signin_with"
          theme={theme === "dark" ? "filled_black" : "outline"}
          shape="pill"
          size="large"
          width="320"
        />
      </div>
    </section>
  );
}

export default LoginPage;
