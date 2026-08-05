import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FloatingInput from "../../components/ui/FloatingInput";
import LoadingButton from "../../components/ui/LoadingButton";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import "../../styles/Auth.css";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { resetPassword, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
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

    if (!token) {
      const message = "El enlace de recuperación no es válido.";
      setError(message);
      toast.error(message);
      return;
    }

    if (formData.password.length < 8) {
      const message = "La contraseña debe tener al menos 8 caracteres.";
      setError(message);
      toast.warning(message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      const message = "Las contraseñas no coinciden.";
      setError(message);
      toast.warning(message);
      return;
    }

    try {
      const data = await resetPassword(token, formData.password);
      toast.success("Contraseña actualizada. Sesión iniciada.");
      redirectByRole(data.rol || data.role);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "El enlace es inválido o expiró. Solicita uno nuevo.";

      setError(message);
      toast.error(message);
    }
  };

  if (!token) {
    return (
      <section className="auth-page">
        <p className="auth-form__hint">
          Este enlace de recuperación no es válido o ya fue usado.
        </p>
        <Link className="auth-link-button" to="/forgot-password">
          Solicitar un enlace nuevo
        </Link>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-tabs" aria-label="Restablecer contraseña">
        <span>Restablecer contraseña</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FloatingInput
          id="reset-password"
          name="password"
          type="password"
          label="Nueva contraseña"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          aria-invalid={Boolean(error && formData.password.length < 8)}
        />

        <FloatingInput
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          label="Confirmar contraseña"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          aria-invalid={Boolean(error && formData.password !== formData.confirmPassword)}
        />

        <LoadingButton
          className="auth-form__button"
          type="submit"
          isLoading={loading}
          loadingText="Guardando..."
        >
          Restablecer contraseña
        </LoadingButton>
      </form>

      <Link className="auth-link-button" to="/login">
        Volver a iniciar sesión
      </Link>
    </section>
  );
}

export default ResetPasswordPage;
