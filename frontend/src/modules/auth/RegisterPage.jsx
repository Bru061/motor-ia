import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import FloatingInput from "../../components/ui/FloatingInput";
import LoadingButton from "../../components/ui/LoadingButton";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import useToast from "../../hooks/useToast";
import "../../styles/Auth.css";

function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { theme } = useTheme();
  const { register, loginWithGoogle, loading } = useAuth();

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
    setError("");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");

    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      const role = data.rol || data.role;

      toast.success("Cuenta creada correctamente.");

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "No fue posible registrarte con Google.";

      setError(message);
      toast.error(message);
    }
  };

  const handleGoogleError = () => {
    toast.error("No fue posible registrarte con Google.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.nombre.trim()) {
      const message = "Ingresa tu nombre.";
      setError(message);
      toast.warning(message);
      return;
    }

    if (!formData.email.trim()) {
      const message = "Ingresa tu correo electrónico.";
      setError(message);
      toast.warning(message);
      return;
    }

    if (formData.password.length < 8) {
      const message = "La contraseña debe tener al menos 8 caracteres.";
      setError(message);
      toast.warning(message);
      return;
    }

    try {
      const data = await register(formData);
      const role = data.rol || data.role;

      toast.success("Cuenta creada correctamente.");

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
      toast.error(message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-tabs" aria-label="Acceso a Motor IA">
        <Link className="auth-tabs__item--active" to="/register" aria-current="page">
          Registrarse
        </Link>
        <Link to="/login">Iniciar sesión</Link>
      </div>

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >

        <FloatingInput
          id="register-name"
          name="nombre"
          type="text"
          label="Nombre completo"
          value={formData.nombre}
          onChange={handleChange}
          autoComplete="name"
          aria-invalid={Boolean(error && !formData.nombre.trim())}
        />

        <FloatingInput
          id="register-email"
          name="email"
          type="email"
          label="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          aria-invalid={Boolean(error && !formData.email.trim())}
        />

        <FloatingInput
          id="register-password"
          name="password"
          type="password"
          label="Contraseña"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          aria-invalid={Boolean(error && formData.password.length < 8)}
        />

        <LoadingButton
          className="auth-form__button"
          type="submit"
          isLoading={loading}
          loadingText="Creando cuenta..."
        >
          Crear cuenta y comenzar
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
          text="signup_with"
          theme={theme === "dark" ? "filled_black" : "outline"}
          shape="pill"
          size="large"
          width="320"
        />
      </div>
    </section>
  );
}

export default RegisterPage;
