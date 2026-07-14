import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiGitBranch,
  FiRefreshCw,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { obtenerUsuariosAdmin } from "../../api/adminApi";
import EmptyState from "../../components/ui/EmptyState";
import LoadingButton from "../../components/ui/LoadingButton";
import PageLoader from "../../components/ui/PageLoader";
import useToast from "../../hooks/useToast";
import AdminMetricCard from "./components/AdminMetricCard";

function AdminDashboardPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignoreResults = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await obtenerUsuariosAdmin({ page: 1, limit: 5 });

        if (!ignoreResults) {
          setData(response);
        }
      } catch (err) {
        if (!ignoreResults) {
          const message =
            err.response?.data?.detail ||
            "No fue posible cargar el dashboard administrativo.";

          setError(message);
          toast.error(message);
        }
      } finally {
        if (!ignoreResults) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      ignoreResults = true;
    };
  }, [retryCount, toast]);

  const metrics = useMemo(() => {
    const usuarios = data?.usuarios || [];

    return {
      totalUsuarios: data?.total ?? 0,
      muestraActual: usuarios.length,
      conPerfil: usuarios.filter((user) => user.tiene_perfil).length,
      conRutaActiva: usuarios.filter((user) => user.tiene_ruta_activa).length,
    };
  }, [data]);

  if (isLoading) {
    return (
      <PageLoader
        title="Cargando administración"
        description="Consultando usuarios registrados."
      />
    );
  }

  if (error) {
    return (
      <section className="admin-page">
        <EmptyState
          icon={FiRefreshCw}
          tone="error"
          title="No pudimos cargar el panel"
          description={error}
          action={
            <LoadingButton
              className="route-button route-button--primary"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              <FiRefreshCw aria-hidden="true" />
              Reintentar
            </LoadingButton>
          }
        />
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Dashboard Administrativo</h1>
          <p>Consulta usuarios registrados y accede al detalle de cada cuenta.</p>
        </div>
        <Link className="route-button route-button--primary" to="/admin/usuarios">
          Ver usuarios
          <FiArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className="admin-metric-grid">
        <AdminMetricCard
          icon={FiUsers}
          value={metrics.totalUsuarios}
          label="Usuarios registrados"
          tone="cyan"
          caption="Total devuelto por el backend"
        />
        <AdminMetricCard
          icon={FiUsers}
          value={metrics.muestraActual}
          label="Usuarios en muestra"
          tone="violet"
          caption="Primeros registros consultados"
        />
        <AdminMetricCard
          icon={FiUserCheck}
          value={metrics.conPerfil}
          label="Con perfil"
          tone="green"
          caption="Dentro de la muestra actual"
        />
        <AdminMetricCard
          icon={FiGitBranch}
          value={metrics.conRutaActiva}
          label="Con ruta activa"
          tone="amber"
          caption="Dentro de la muestra actual"
        />
      </div>

      <article className="admin-panel admin-entry-panel">
        <div className="section-heading">
          <div>
            <h2>Módulo de usuarios</h2>
            <span>GET /api/v1/admin/usuarios</span>
          </div>
        </div>
        <p>
          Desde este módulo puedes buscar usuarios por nombre o correo, revisar
          si tienen perfil tecnológico, confirmar si poseen ruta activa y abrir
          el detalle administrativo de cada cuenta.
        </p>
        <Link className="secondary-action admin-entry-panel__action" to="/admin/usuarios">
          <FiArrowRight aria-hidden="true" />
          Entrar al listado de usuarios
        </Link>
      </article>
    </section>
  );
}

export default AdminDashboardPage;
