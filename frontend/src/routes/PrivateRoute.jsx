import { Navigate, Outlet, useLocation } from "react-router-dom";
import PageLoader from "../components/ui/PageLoader";
import useAuth from "../hooks/useAuth";

function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <PageLoader
        className="route-loading"
        title="Cargando sesión"
        description="Estamos verificando tus credenciales."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default PrivateRoute;
