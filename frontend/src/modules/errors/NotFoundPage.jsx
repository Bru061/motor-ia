import { Link } from "react-router-dom";
import { FiAlertCircle, FiHome } from "react-icons/fi";
import EmptyState from "../../components/ui/EmptyState";
import useAuth from "../../hooks/useAuth";
import { getUserHomePath } from "../../utils/user";

function NotFoundPage() {
  const { isAuthenticated, role } = useAuth();
  const homePath = isAuthenticated ? getUserHomePath(role) : "/login";

  return (
    <main className="error-page">
      <EmptyState
        icon={FiAlertCircle}
        tone="warning"
        eyebrow="404"
        title="Página no encontrada"
        description="La pantalla que buscas no existe o ya no está disponible."
        action={
          <Link className="route-button route-button--primary" to={homePath}>
            Ir al inicio
            <FiHome aria-hidden="true" />
          </Link>
        }
      />
    </main>
  );
}

export default NotFoundPage;
