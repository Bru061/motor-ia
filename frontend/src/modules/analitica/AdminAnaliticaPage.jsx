import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiBarChart2, FiRefreshCw, FiTarget, FiUsers } from "react-icons/fi";
import {
  obtenerSkillGapAdmin,
  obtenerTecnologiasDemandadasAdmin,
} from "../../api/adminApi";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";
import useToast from "../../hooks/useToast";
import AdminMetricCard from "../admin/components/AdminMetricCard";
import AnalyticsBarChart from "./components/AnalyticsBarChart";
import SkillGapChart from "./components/SkillGapChart";

function AdminAnaliticaPage() {
  const toast = useToast();
  const [analytics, setAnalytics] = useState({
    tecnologiasDemandadas: null,
    skillGap: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignoreResults = false;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [tecnologiasDemandadas, skillGap] = await Promise.all([
          obtenerTecnologiasDemandadasAdmin(),
          obtenerSkillGapAdmin(),
        ]);

        if (!ignoreResults) {
          setAnalytics({ tecnologiasDemandadas, skillGap });
        }
      } catch (err) {
        if (!ignoreResults) {
          const message =
            err.response?.data?.detail ||
            "No fue posible cargar la analítica administrativa.";

          setError(message);
          toast.error(message);
        }
      } finally {
        if (!ignoreResults) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      ignoreResults = true;
    };
  }, [retryCount, toast]);

  const tecnologias = useMemo(
    () => analytics.tecnologiasDemandadas?.tecnologias || [],
    [analytics.tecnologiasDemandadas],
  );
  const brechas = useMemo(
    () => analytics.skillGap?.brechas || [],
    [analytics.skillGap],
  );
  const topTecnologia = tecnologias[0];
  const topBrecha = brechas[0];

  if (isLoading) {
    return (
      <PageLoader
        title="Cargando analítica"
        description="Consultando tecnologías demandadas y skill gap."
      />
    );
  }

  if (error) {
    return (
      <section className="admin-page">
        <EmptyState
          icon={FiAlertCircle}
          tone="error"
          title="No pudimos cargar la analítica"
          description={error}
          action={
            <button
              className="route-button route-button--primary"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              <FiRefreshCw aria-hidden="true" />
              Reintentar
            </button>
          }
        />
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Analítica Administrativa</h1>
          <p>
            Tecnologías demandadas y brechas de habilidades calculadas por el backend.
          </p>
        </div>
      </div>

      <div className="admin-metric-grid analytics-kpi-grid">
        <AdminMetricCard
          icon={FiUsers}
          value={analytics.tecnologiasDemandadas?.total_perfiles_analizados ?? 0}
          label="Perfiles analizados"
          tone="cyan"
          caption="Tecnologías demandadas"
        />
        <AdminMetricCard
          icon={FiBarChart2}
          value={tecnologias.length}
          label="Tecnologías reportadas"
          tone="violet"
          caption="Categorías con demanda"
        />
        <AdminMetricCard
          icon={FiUsers}
          value={analytics.skillGap?.total_perfiles_analizados ?? 0}
          label="Perfiles clasificados"
          tone="green"
          caption="Skill gap analysis"
        />
        <AdminMetricCard
          icon={FiTarget}
          value={analytics.skillGap?.total_perfiles_sin_clasificar ?? 0}
          label="Sin clasificar"
          tone="amber"
          caption="Metas no identificadas"
        />
      </div>

      <div className="admin-insights admin-insights--wide analytics-layout">
        <article className="admin-panel analytics-panel">
          <div className="section-heading">
            <div>
              <h2>Tecnologías más demandadas</h2>
              <span>GET /admin/analitica/tecnologias-demandadas</span>
            </div>
            {topTecnologia && (
              <span className="admin-badge admin-badge--success">
                Top: {topTecnologia.nombre}
              </span>
            )}
          </div>

          <AnalyticsBarChart
            items={tecnologias}
            labelKey="nombre"
            countKey="total_usuarios"
            emptyLabel="No hay tecnologías demandadas para mostrar."
          />
        </article>

        <article className="admin-panel analytics-panel">
          <div className="section-heading">
            <div>
              <h2>Skill Gap Analysis</h2>
              <span>GET /admin/analitica/skill-gap</span>
            </div>
            {topBrecha && (
              <span className="admin-badge admin-badge--en_progreso">
                Mayor brecha: {topBrecha.tecnologia}
              </span>
            )}
          </div>

          <SkillGapChart gaps={brechas} />
        </article>
      </div>
    </section>
  );
}

export default AdminAnaliticaPage;
