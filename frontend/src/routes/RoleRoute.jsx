import { Navigate, Outlet } from "react-router-dom";
import PageLoader from "../components/ui/PageLoader";
import useAuth from "../hooks/useAuth";

function RoleRoute({ allowedRole }) {
  const { role, loading } = useAuth();
  const normalizedRole = role?.toLowerCase();

  if (loading) {
    return (
      <PageLoader
        className="route-loading"
        title="Cargando sesión"
        description="Validando permisos de acceso."
      />
    );
  }

  if (normalizedRole === allowedRole) {
    return <Outlet />;
  }

  if (normalizedRole === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (normalizedRole === "estudiante") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default RoleRoute;
