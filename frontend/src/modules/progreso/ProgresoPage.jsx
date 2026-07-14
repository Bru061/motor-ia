import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiGitBranch,
  FiLayers,
  FiRefreshCw,
} from "react-icons/fi";
import {
  obtenerResumenProgreso,
  obtenerRutaActiva,
} from "../../api/progresoApi";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";
import useToast from "../../hooks/useToast";
import KpiCard from "../rutas/components/KpiCard";
import ProgressBar from "../rutas/components/ProgressBar";
import "../../styles/ruta.css";

function isNotFound(error) {
  return error?.response?.status === 404;
}

function getProgressError(error) {
  if (!error.response) {
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  }

  return error.response?.data?.detail || "No fue posible cargar tu progreso.";
}

function formatHours(value) {
  const hours = Number(value);
  return Number.isFinite(hours) ? `${hours} h` : "Sin estimación";
}

function ProgresoPage() {
  const toast = useToast();
  const [route, setRoute] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignoreResults = false;

    const loadProgress = async () => {
      setIsLoading(true);
      setError("");

      const [routeResult, summaryResult] = await Promise.allSettled([
        obtenerRutaActiva(),
        obtenerResumenProgreso(),
      ]);

      if (ignoreResults) {
        return;
      }

      if (
        routeResult.status === "rejected" &&
        summaryResult.status === "rejected" &&
        isNotFound(routeResult.reason) &&
        isNotFound(summaryResult.reason)
      ) {
        setRoute(null);
        setSummary(null);
        setIsLoading(false);
        return;
      }

      if (routeResult.status === "rejected" && !isNotFound(routeResult.reason)) {
        const message = getProgressError(routeResult.reason);
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      if (summaryResult.status === "rejected" && !isNotFound(summaryResult.reason)) {
        const message = getProgressError(summaryResult.reason);
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      setRoute(routeResult.status === "fulfilled" ? routeResult.value : null);
      setSummary(summaryResult.status === "fulfilled" ? summaryResult.value : null);
      setIsLoading(false);
    };

    loadProgress();

    return () => {
      ignoreResults = true;
    };
  }, [retryCount, toast]);

  const modules = useMemo(
    () =>
      [...(route?.modulos || [])].sort(
        (first, second) => Number(first.orden) - Number(second.orden),
      ),
    [route],
  );

  if (isLoading) {
    return (
      <PageLoader
        title="Cargando progreso"
        description="Consultando tu ruta activa y resumen de avance."
      />
    );
  }

  if (error) {
    return (
      <section className="dashboard-page">
        <EmptyState
          icon={FiAlertCircle}
          tone="error"
          title="No pudimos cargar tu progreso"
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

  if (!route || !summary) {
    return (
      <section className="dashboard-page">
        <EmptyState
          icon={FiGitBranch}
          title="Aún no tienes progreso registrado"
          description="Genera una ruta de aprendizaje para comenzar a ver tu avance."
          action={
            <Link className="route-button route-button--primary" to="/ruta">
              Ir a mi ruta
              <FiGitBranch aria-hidden="true" />
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="page-title">
        <h1>Progreso</h1>
        <p>{route.titulo}</p>
      </div>

      <div className="route-progress-dashboard progreso-dashboard">
        <div className="route-progress-kpis">
          <KpiCard
            icon={FiCheckCircle}
            value={summary.modulos_completados}
            label="Módulos completados"
            tone="success"
          />
          <KpiCard
            icon={FiClock}
            value={summary.modulos_en_progreso}
            label="Módulos en progreso"
            tone="warning"
          />
          <KpiCard
            icon={FiLayers}
            value={summary.modulos_pendientes}
            label="Módulos pendientes"
            tone="muted"
          />
          <KpiCard
            icon={FiGitBranch}
            value={`${Math.round(summary.porcentaje_general ?? summary.porcentaje_avance)}%`}
            label="Avance general"
            tone="primary"
          />
        </div>

        <ProgressBar value={summary.porcentaje_avance} />

        <div className="progress-overview progress-overview--real">
          {modules.map((module) => (
            <article className="dashboard-card progress-module" key={module.id}>
              <span>
                {module.estado === "completado" ? (
                  <FiCheckCircle aria-hidden="true" />
                ) : module.estado === "en_progreso" ? (
                  <FiClock aria-hidden="true" />
                ) : (
                  <FiLayers aria-hidden="true" />
                )}
              </span>
              <div>
                <h2>{module.titulo}</h2>
                <p>
                  {module.estado.replace("_", " ")} · {formatHours(module.tiempo_estimado_hrs)}
                </p>
              </div>
              <strong>{module.orden}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProgresoPage;
