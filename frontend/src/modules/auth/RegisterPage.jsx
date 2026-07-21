import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import FloatingInput from "../../components/ui/FloatingInput";
import LoadingButton from "../../components/ui/LoadingButton";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import "../../styles/Auth.css";

function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
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
    setError("");
  };

  const notifyUnavailable = () => {
    toast.info("Esta opción aún no está disponible.", {
      title: "Próximamente",
    });
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
        aria-describedby={error ? "register-error" : undefined}
        noValidate
      >
        {error && (
          <div className="auth-form__error" id="register-error" role="alert">
            {error}
          </div>
        )}

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

export default RegisterPage;
