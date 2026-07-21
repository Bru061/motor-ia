import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

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
import ConfiguracionPage from "../modules/configuracion/ConfiguracionPage";

import AdminDashboardPage from "../modules/admin/AdminDashboardPage";
import AdminUsuariosPage from "../modules/admin/AdminUsuariosPage";
import AdminUsuarioDetallePage from "../modules/admin/AdminUsuarioDetallePage";
import AdminAnaliticaPage from "../modules/analitica/AdminAnaliticaPage";
import ForbiddenPage from "../modules/errors/ForbiddenPage";
import NotFoundPage from "../modules/errors/NotFoundPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<RoleRoute allowedRole="estudiante" />}>
            <Route element={<StudentLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
              <Route path="/ruta" element={<RutaPage />} />
              <Route path="/progreso" element={<ProgresoPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/perfil" element={<PerfilPage />} />
              <Route path="/admin/configuracion" element={<ConfiguracionPage />} />
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
