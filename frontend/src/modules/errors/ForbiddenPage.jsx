import { Link } from "react-router-dom";
import { FiArrowLeft, FiLock } from "react-icons/fi";
import EmptyState from "../../components/ui/EmptyState";
import useAuth from "../../hooks/useAuth";
import { getUserHomePath } from "../../utils/user";

function ForbiddenPage() {
  const { role } = useAuth();

  return (
    <main className="error-page">
      <EmptyState
        icon={FiLock}
        tone="warning"
        eyebrow="403"
        title="Acceso sin permisos"
        description="Tu rol actual no tiene autorización para abrir esta sección."
        action={
          <Link className="route-button route-button--primary" to={getUserHomePath(role)}>
            <FiArrowLeft aria-hidden="true" />
            Volver al inicio
          </Link>
        }
      />
    </main>
  );
}

export default ForbiddenPage;
