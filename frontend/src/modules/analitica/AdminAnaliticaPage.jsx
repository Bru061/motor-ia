import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBarChart2,
  FiList,
  FiRefreshCw,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import {
  obtenerSkillGapAdmin,
  obtenerTecnologiasDemandadasAdmin,
} from "../../api/adminApi";
import EmptyState from "../../components/ui/EmptyState";
import PageHeading from "../../components/ui/PageHeading";
import PageLoader from "../../components/ui/PageLoader";
import useToast from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/apiError";
import AdminMetricCard from "../admin/components/AdminMetricCard";
import AnalyticsBarChart from "./components/AnalyticsBarChart";
import ColumnChart from "./components/ColumnChart";
import SkillGapChart from "./components/SkillGapChart";

function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="Cambiar visualización">
      <button
        type="button"
        className={view === "lista" ? "view-toggle__btn is-active" : "view-toggle__btn"}
        aria-pressed={view === "lista"}
        onClick={() => onChange("lista")}
        title="Ver como lista"
      >
        <FiList aria-hidden="true" />
      </button>
      <button
        type="button"
        className={view === "barras" ? "view-toggle__btn is-active" : "view-toggle__btn"}
        aria-pressed={view === "barras"}
        onClick={() => onChange("barras")}
        title="Ver como gráfico de barras"
      >
        <FiBarChart2 aria-hidden="true" />
      </button>
    </div>
  );
}

function AdminAnaliticaPage() {
  const toast = useToast();
  const [analytics, setAnalytics] = useState({
    tecnologiasDemandadas: null,
    skillGap: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [vistaTecnologias, setVistaTecnologias] = useState("lista");
  const [vistaSkillGap, setVistaSkillGap] = useState("lista");

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
          const message = getApiErrorMessage(
            err,
            "No fue posible cargar la analítica administrativa."
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
      <PageHeading
        eyebrow="Panel administrativo"
        icon={FiBarChart2}
        title="Analítica Administrativa"
        description="Tecnologías demandadas y brechas de habilidades."
      />

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
          <div className="section-heading__title-group">
            <span className="section-heading__icon section-heading__icon--amber">
              <FiTarget aria-hidden="true" />
            </span>
            <div>
              <h2>Tecnologías más demandadas</h2>
            </div>
            <div className="section-heading__actions">
              {topTecnologia && (
                <span className="admin-badge admin-badge--success">
                  Top: {topTecnologia.nombre}
                </span>
              )}
              <ViewToggle view={vistaTecnologias} onChange={setVistaTecnologias} />
            </div>
          </div>

          <div className="analytics-panel__body">
          {vistaTecnologias === "lista" ? (
            <AnalyticsBarChart
              items={tecnologias}
              labelKey="nombre"
              countKey="total_usuarios"
              emptyLabel="No hay tecnologías demandadas para mostrar."
            />
          ) : (
            <ColumnChart
              items={tecnologias}
              labelKey="nombre"
              valueKey="porcentaje"
              emptyLabel="No hay tecnologías demandadas para mostrar."
            />
          )}
          </div>
        </article>

        <article className="admin-panel analytics-panel">
          <div className="section-heading__title-group">
            <span className="section-heading__icon section-heading__icon--violet">
              <FiTarget aria-hidden="true" />
            </span>
            <div>
              <h2>Skill Gap Analysis</h2>
            </div>
            <div className="section-heading__actions">
              {topBrecha && (
                <span className="admin-badge admin-badge--en_progreso">
                  Mayor brecha: {topBrecha.tecnologia}
                </span>
              )}
              <ViewToggle view={vistaSkillGap} onChange={setVistaSkillGap} />
            </div>
          </div>

          <div className="analytics-panel__body">
          {vistaSkillGap === "lista" ? (
            <SkillGapChart gaps={brechas} />
          ) : (
            <ColumnChart
              items={brechas}
              labelKey="tecnologia"
              valueKey="porcentaje"
              emptyLabel="No hay brechas de habilidades para mostrar."
            />
          )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminAnaliticaPage;
