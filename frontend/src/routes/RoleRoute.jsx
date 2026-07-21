import { Navigate, Outlet, useLocation } from "react-router-dom";
import PageLoader from "../components/ui/PageLoader";
import useAuth from "../hooks/useAuth";

function RoleRoute({ allowedRole }) {
  const { role, loading } = useAuth();
  const location = useLocation();
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

  if (normalizedRole) {
    return (
      <Navigate
        to="/403"
        replace
        state={{ from: location.pathname, requiredRole: allowedRole }}
      />
    );
  }

  return <Navigate to="/login" replace />;
}

export default RoleRoute;
