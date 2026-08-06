import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiGitBranch,
  FiRefreshCw,
  FiTrendingUp,
  FiTarget,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import {
  obtenerTecnologiasDemandadasAdmin,
  obtenerUsuariosAdmin,
} from "../../api/adminApi";
import EmptyState from "../../components/ui/EmptyState";
import LoadingButton from "../../components/ui/LoadingButton";
import PageHeading from "../../components/ui/PageHeading";
import PageLoader from "../../components/ui/PageLoader";
import useToast from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/apiError";
import ProgressDonut from "../progreso/components/ProgressDonut";
import AdminMetricCard from "./components/AdminMetricCard";
import ColumnChart from "../analitica/components/ColumnChart";
import TrendLineChart from "./components/TrendLineChart";

// Cuántos usuarios traer para calcular los resúmenes. El backend no
// expone todavía un endpoint de agregados (conteos por día, % con
// perfil sobre el total real), así que se calculan aquí mismo a partir
// de esta muestra. Para una base de usuarios grande de verdad, lo ideal
// sería un endpoint de agregados en el backend; para el alcance de la
// estadía, 200 cubre sobradamente el total esperado de usuarios.
const DASHBOARD_SAMPLE_LIMIT = 100;
const GROWTH_DAYS = 14;

function buildGrowthSeries(usuarios) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: GROWTH_DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (GROWTH_DAYS - 1 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
      }),
      count: 0,
    };
  });

  const byKey = new Map(days.map((day) => [day.key, day]));

  usuarios.forEach((usuario) => {
    if (!usuario.created_at) {
      return;
    }

    const key = new Date(usuario.created_at).toISOString().slice(0, 10);
    const day = byKey.get(key);

    if (day) {
      day.count += 1;
    }
  });

  return days;
}

function AdminDashboardPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [tecnologias, setTecnologias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignoreResults = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [usuariosResponse, tecnologiasResponse] = await Promise.all([
          obtenerUsuariosAdmin({ page: 1, limit: DASHBOARD_SAMPLE_LIMIT }),
          obtenerTecnologiasDemandadasAdmin().catch(() => null),
        ]);

        if (!ignoreResults) {
          setData(usuariosResponse);
          setTecnologias(tecnologiasResponse?.tecnologias || []);
        }
      } catch (err) {
        if (!ignoreResults) {
          const message = getApiErrorMessage(
            err,
            "No fue posible cargar el dashboard administrativo.",
          );

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
    const muestra = usuarios.length || 1;

    return {
      totalUsuarios: data?.total ?? 0,
      muestraActual: usuarios.length,
      conPerfil: usuarios.filter((user) => user.tiene_perfil).length,
      conRutaActiva: usuarios.filter((user) => user.tiene_ruta_activa).length,
      porcentajeConPerfil:
        (usuarios.filter((user) => user.tiene_perfil).length / muestra) * 100,
      porcentajeConRuta:
        (usuarios.filter((user) => user.tiene_ruta_activa).length / muestra) *
        100,
    };
  }, [data]);

  const growth = useMemo(() => buildGrowthSeries(data?.usuarios || []), [data]);

  const topTecnologias = useMemo(() => tecnologias.slice(0, 5), [tecnologias]);

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
      <PageHeading
        eyebrow="Panel administrativo"
        icon={FiUsers}
        title="Dashboard Administrativo"
        description="Consulta usuarios registrados, su avance y accede al detalle de cada cuenta."
      />

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
          caption={`Últimos ${DASHBOARD_SAMPLE_LIMIT} registros consultados`}
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

      <div className="admin-insights admin-insights--wide analytics-layout">
        <article className="admin-panel analytics-panel">
          <div className="section-heading">
            <div className="section-heading__title-group">
              <span className="section-heading__icon">
                <FiTrendingUp aria-hidden="true" />
              </span>
              <div>
                <h2>Registros por día</h2>
                <span>Últimos {GROWTH_DAYS} días, según fecha de registro</span>
              </div>
            </div>
          </div>

          <TrendLineChart
            items={growth}
            labelKey="label"
            valueKey="count"
            emptyLabel="No hay registros en este periodo."
          />
        </article>

        <article className="admin-panel analytics-panel">
          <div className="section-heading">
            <div className="section-heading__title-group">
              <span className="section-heading__icon section-heading__icon--violet">
                <FiUserCheck aria-hidden="true" />
              </span>
              <div>
                <h2>Estado de la muestra</h2>
                <span>
                  Perfil y ruta activa, sobre {metrics.muestraActual} usuarios
                </span>
              </div>
            </div>
          </div>

          <div className="admin-donut-row">
            <ProgressDonut
              label="Con perfil"
              value={metrics.porcentajeConPerfil}
              caption={`${metrics.conPerfil} de ${metrics.muestraActual} usuarios`}
            />
            <ProgressDonut
              label="Con ruta activa"
              value={metrics.porcentajeConRuta}
              caption={`${metrics.conRutaActiva} de ${metrics.muestraActual} usuarios`}
            />
          </div>
        </article>
      </div>

      {topTecnologias.length > 0 && (
        <article className="admin-panel analytics-panel">
          <div className="section-heading">
            <div className="section-heading__title-group">
              <span className="section-heading__icon section-heading__icon--amber">
                <FiTarget aria-hidden="true" />
              </span>
              <div>
                <h2>Tecnologías más demandadas</h2>
                <span>Top 5 · vista completa en Analítica</span>
              </div>
            </div>
            <Link className="admin-row-action" to="/admin/analitica">
              Ver analítica
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>

          <ColumnChart
            items={topTecnologias}
            labelKey="nombre"
            valueKey="porcentaje"
            emptyLabel="No hay tecnologías demandadas para mostrar."
          />
        </article>
      )}
    </section>
  );
}

export default AdminDashboardPage;
