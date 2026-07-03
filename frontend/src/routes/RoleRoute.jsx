import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function RoleRoute({ allowedRole }) {
  const { role, loading } = useAuth();
  const normalizedRole = role?.toLowerCase();

  if (loading) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        Cargando sesión...
      </div>
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
