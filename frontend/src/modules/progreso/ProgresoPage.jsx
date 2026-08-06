import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import ProgressSummary from "../rutas/components/ProgressSummary";
import RouteProgressPath from "./components/RouteProgressPath";
import "../../styles/ruta.css";

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildProgressSummary(modules, apiSummary) {
  const safeModules = Array.isArray(modules) ? modules : [];
  const modulesWithDuration = safeModules.filter(
    (module) =>
      module.tiempo_estimado_hrs !== undefined &&
      module.tiempo_estimado_hrs !== null &&
      module.tiempo_estimado_hrs !== "" &&
      Number.isFinite(Number(module.tiempo_estimado_hrs)),
  );
  const completedModules = safeModules.filter(
    (module) => module.estado === "completado",
  );
  const totalHours = modulesWithDuration.reduce(
    (total, module) => total + safeNumber(module.tiempo_estimado_hrs),
    0,
  );
  const completedHours = completedModules.reduce(
    (total, module) => total + safeNumber(module.tiempo_estimado_hrs),
    0,
  );

  return {
    total_modulos: safeNumber(apiSummary?.total_modulos ?? safeModules.length),
    porcentaje_avance: safeNumber(apiSummary?.porcentaje_avance),
    modulos_completados: safeNumber(
      apiSummary?.modulos_completados ?? completedModules.length,
    ),
    modulos_en_progreso: safeNumber(apiSummary?.modulos_en_progreso),
    modulos_pendientes: safeNumber(apiSummary?.modulos_pendientes),
    hasDurations: modulesWithDuration.length > 0,
    horas_completadas: completedHours,
    horas_restantes: Math.max(0, totalHours - completedHours),
    horas_totales: totalHours,
  };
}

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
  const navigate = useNavigate();
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

      if (
        routeResult.status === "rejected" &&
        !isNotFound(routeResult.reason)
      ) {
        const message = getProgressError(routeResult.reason);
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      if (
        summaryResult.status === "rejected" &&
        !isNotFound(summaryResult.reason)
      ) {
        const message = getProgressError(summaryResult.reason);
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      setRoute(routeResult.status === "fulfilled" ? routeResult.value : null);
      setSummary(
        summaryResult.status === "fulfilled" ? summaryResult.value : null,
      );
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

  const progressSummary = useMemo(
    () => buildProgressSummary(modules, summary),
    [modules, summary],
  );

  const nextModule = useMemo(
    () =>
      modules.find((module) => (module.estado || "pendiente") === "pendiente"),
    [modules],
  );

  const handleOpenModule = () => {
    navigate("/ruta");
  };

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
        <ProgressSummary
          summary={progressSummary}
          nextModule={nextModule}
          onOpenModule={handleOpenModule}
        />

        <RouteProgressPath modules={modules} />

        <div className="progress-overview progress-overview--real">
          {modules.map((module) => (
            <article
              className="dashboard-card progress-module progress-module--compact"
              key={module.id}
            >
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
                  {module.estado.replace("_", " ")} ·{" "}
                  {formatHours(module.tiempo_estimado_hrs)}
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
