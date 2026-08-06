import { useState } from "react";
import { Link } from "react-router-dom";
import FloatingInput from "../../components/ui/FloatingInput";
import LoadingButton from "../../components/ui/LoadingButton";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import "../../styles/Auth.css";

function ForgotPasswordPage() {
  const toast = useToast();
  const { forgotPassword, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.warning("Ingresa tu correo electrónico.");
      return;
    }

    try {
      await forgotPassword(email.trim());
      setSent(true);
      toast.success(
        "Si el correo está registrado, te llegará un enlace en breve.",
      );
    } catch {
      toast.error("Ocurrió un error. Intenta nuevamente en unos minutos.");
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-tabs" aria-label="Recuperar acceso a Motor IA">
        <Link to="/register">Registrarse</Link>
        <Link to="/login">Iniciar sesión</Link>
      </div>

      {sent ? (
        <p className="auth-form__hint">
          Si <strong>{email}</strong> está registrado, te enviamos un enlace
          para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).
        </p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <p className="auth-form__hint">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contraseña.
          </p>

          <FloatingInput
            id="forgot-email"
            name="email"
            type="email"
            label="Correo electrónico"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <LoadingButton
            className="auth-form__button"
            type="submit"
            isLoading={loading}
            loadingText="Enviando..."
          >
            Enviar enlace
          </LoadingButton>
        </form>
      )}

      <Link className="auth-link-button" to="/login">
        Volver a iniciar sesión
      </Link>
    </section>
  );
}

export default ForgotPasswordPage;
