import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { FiAlertCircle, FiHome } from "react-icons/fi";

import PublicLayout from "../layouts/PublicLayout";
import StudentLayout from "../layouts/StudentLayout";
import AdminLayout from "../layouts/AdminLayout";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";

import LoginPage from "../modules/auth/LoginPage";
import RegisterPage from "../modules/auth/RegisterPage";

import DashboardPage from "../modules/dashboard/DashboardPage";
import PerfilPage from "../modules/perfil/PerfilPage";
import RutaPage from "../modules/rutas/RutaPage";
import ProgresoPage from "../modules/progreso/ProgresoPage";

import AdminDashboardPage from "../modules/admin/AdminDashboardPage";
import AdminUsuariosPage from "../modules/admin/AdminUsuariosPage";
import AdminUsuarioDetallePage from "../modules/admin/AdminUsuarioDetallePage";
import AdminAnaliticaPage from "../modules/analitica/AdminAnaliticaPage";
import EmptyState from "../components/ui/EmptyState";

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <EmptyState
        icon={FiAlertCircle}
        tone="warning"
        eyebrow="404"
        title="Página no encontrada"
        description="La pantalla que buscas no existe o ya no está disponible."
        action={
          <Link className="route-button route-button--primary" to="/login">
            Ir al inicio
            <FiHome aria-hidden="true" />
          </Link>
        }
      />
    </main>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<RoleRoute allowedRole="estudiante" />}>
            <Route element={<StudentLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/ruta" element={<RutaPage />} />
              <Route path="/progreso" element={<ProgresoPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
              <Route
                path="/admin/usuarios/:id"
                element={<AdminUsuarioDetallePage />}
              />
              <Route path="/admin/analitica" element={<AdminAnaliticaPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
