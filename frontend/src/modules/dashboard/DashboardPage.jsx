import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiGitBranch,
  FiLayers,
  FiRefreshCw,
  FiTarget,
  FiUser,
} from "react-icons/fi";
import { obtenerPerfilActual } from "../../api/perfilApi";
import {
  obtenerResumenProgreso,
  obtenerRutaActiva,
} from "../../api/progresoApi";
import PageLoader from "../../components/ui/PageLoader";
import Skeleton from "../../components/ui/Skeleton";
import useToast from "../../hooks/useToast";
import "../../styles/dashboard.css";

const EMPTY_SUMMARY = {
  porcentaje_avance: 0,
  modulos_completados: 0,
  modulos_en_progreso: 0,
  modulos_pendientes: 0,
};

const INITIAL_DASHBOARD = {
  profile: null,
  profileStatus: "loading",
  route: null,
  routeStatus: "loading",
  summary: EMPTY_SUMMARY,
  summaryStatus: "loading",
  errorMessage: "",
};

function isNotFound(result) {
  return result.status === "rejected" && result.reason?.response?.status === 404;
}

function hasConnectionError(results) {
  return results.some(
    (result) => result.status === "rejected" && !result.reason?.response,
  );
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeSummary(summary) {
  return {
    porcentaje_avance: Math.min(
      100,
      Math.max(0, safeNumber(summary?.porcentaje_avance)),
    ),
    modulos_completados: safeNumber(summary?.modulos_completados),
    modulos_en_progreso: safeNumber(summary?.modulos_en_progreso),
    modulos_pendientes: safeNumber(summary?.modulos_pendientes),
  };
}

function DashboardLoading() {
  return (
    <section className="student-dashboard">
      <PageLoader
        className="student-dashboard-state"
        title="Cargando dashboard"
        description="Estamos consultando tu perfil, ruta y progreso actual."
      >
        <div className="student-dashboard-skeleton" aria-hidden="true">
          <Skeleton height="112px" />
          <Skeleton height="112px" />
          <Skeleton height="150px" />
        </div>
      </PageLoader>
    </section>
  );
}

function DashboardPage() {
  const toast = useToast();
  const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignoreResults = false;

    const loadDashboard = async () => {
      setDashboard((current) => ({
        ...current,
        profileStatus: "loading",
        routeStatus: "loading",
        summaryStatus: "loading",
        errorMessage: "",
      }));

      const results = await Promise.allSettled([
        obtenerPerfilActual(),
        obtenerRutaActiva(),
        obtenerResumenProgreso(),
      ]);

      if (ignoreResults) {
        return;
      }

      const [profileResult, routeResult, summaryResult] = results;
      const hasUnexpectedError = results.some(
        (result) => result.status === "rejected" && !isNotFound(result),
      );
      const errorMessage = hasUnexpectedError
        ? hasConnectionError(results)
          ? "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
          : "No fue posible cargar toda la información del dashboard. Puedes reintentar en un momento."
        : "";

      if (errorMessage) {
        toast.error(errorMessage, { title: "Dashboard incompleto" });
      }

      setDashboard({
        profile:
          profileResult.status === "fulfilled" ? profileResult.value : null,
        profileStatus:
          profileResult.status === "fulfilled"
            ? "exists"
            : isNotFound(profileResult)
              ? "missing"
              : "error",
        route: routeResult.status === "fulfilled" ? routeResult.value : null,
        routeStatus:
          routeResult.status === "fulfilled"
            ? "exists"
            : isNotFound(routeResult)
              ? "missing"
              : "error",
        summary:
          summaryResult.status === "fulfilled"
            ? normalizeSummary(summaryResult.value)
            : EMPTY_SUMMARY,
        summaryStatus:
          summaryResult.status === "fulfilled"
            ? "exists"
            : isNotFound(summaryResult)
              ? "missing"
              : "error",
        errorMessage,
      });
    };

    loadDashboard();

    return () => {
      ignoreResults = true;
    };
  }, [retryCount, toast]);

  const isLoading = [
    dashboard.profileStatus,
    dashboard.routeStatus,
    dashboard.summaryStatus,
  ].some((status) => status === "loading");

  if (isLoading) {
    return <DashboardLoading />;
  }

  const hasProfile = dashboard.profileStatus === "exists";
  const hasRoute = dashboard.routeStatus === "exists";
  const hasStatusError =
    dashboard.profileStatus === "error" || dashboard.routeStatus === "error";
  const progress = dashboard.summary;
  const roundedProgress = Math.round(progress.porcentaje_avance);
  const isRouteComplete = hasRoute && roundedProgress >= 100;

  const retryDashboard = () => setRetryCount((current) => current + 1);

  return (
    <section className="student-dashboard">
      <header className="student-dashboard__heading">
        <div>
          <span className="student-dashboard__eyebrow">
            <FiTarget aria-hidden="true" /> Tu siguiente paso
          </span>
          <h1>Resumen de aprendizaje</h1>
          <p>
            Consulta el estado de tu perfil, tu ruta activa y el avance que has
            registrado.
          </p>
        </div>
        <span
          className={`student-dashboard__status ${
            hasRoute ? "student-dashboard__status--active" : ""
          }`}
        >
          {dashboard.routeStatus === "error"
            ? "Estado no disponible"
            : hasRoute
              ? "Ruta activa"
              : "Configuración pendiente"}
        </span>
      </header>

      {dashboard.errorMessage && (
        <div className="student-dashboard-alert" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <p>{dashboard.errorMessage}</p>
          <button type="button" onClick={retryDashboard}>
            <FiRefreshCw aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      <div className="student-dashboard__status-grid">
        <article className="student-dashboard-card student-dashboard-card--status">
          <span
            className={`student-dashboard-card__icon ${
              hasProfile ? "student-dashboard-card__icon--success" : ""
            }`}
          >
            <FiUser aria-hidden="true" />
          </span>
          <div>
            <span className="student-dashboard-card__label">
              Perfil tecnológico
            </span>
            <h2>
              {dashboard.profileStatus === "error"
                ? "Estado no disponible"
                : hasProfile
                  ? "Perfil completo"
                  : "Perfil pendiente"}
            </h2>
            <p>
              {dashboard.profileStatus === "error"
                ? "No pudimos confirmar el estado de tu perfil."
                : hasProfile
                  ? `${dashboard.profile.meta_profesional} · Nivel ${dashboard.profile.nivel_actual}`
                  : "Crea tu perfil para personalizar tu experiencia de aprendizaje."}
            </p>
          </div>
          {hasProfile ? (
            <FiCheckCircle className="student-dashboard-card__check" aria-label="Completado" />
          ) : (
            <FiArrowRight className="student-dashboard-card__arrow" aria-hidden="true" />
          )}
        </article>

        <article className="student-dashboard-card student-dashboard-card--status">
          <span
            className={`student-dashboard-card__icon ${
              hasRoute ? "student-dashboard-card__icon--success" : ""
            }`}
          >
            <FiGitBranch aria-hidden="true" />
          </span>
          <div>
            <span className="student-dashboard-card__label">
              Ruta de aprendizaje
            </span>
            <h2>
              {dashboard.routeStatus === "error"
                ? "Estado no disponible"
                : hasRoute
                  ? "Ruta activa"
                  : "Ruta pendiente"}
            </h2>
            <p>
              {dashboard.routeStatus === "error"
                ? "No pudimos confirmar si tienes una ruta activa."
                : hasRoute
                  ? dashboard.route.titulo
                  : "Genera una ruta cuando tu perfil tecnológico esté listo."}
            </p>
          </div>
          {hasRoute ? (
            <FiCheckCircle className="student-dashboard-card__check" aria-label="Activa" />
          ) : (
            <FiArrowRight className="student-dashboard-card__arrow" aria-hidden="true" />
          )}
        </article>
      </div>

      <section className="student-dashboard__progress" aria-labelledby="progress-title">
        <div className="student-dashboard__section-heading">
          <div>
            <span>Progreso actual</span>
            <h2 id="progress-title">Resumen de tu ruta</h2>
          </div>
          {!hasRoute && <p>Aún no hay avance registrado.</p>}
        </div>

        <div className="student-dashboard__metrics">
          <article className="student-dashboard-card student-dashboard-card--progress">
            <div
              className="student-dashboard-progress-ring"
              style={{ "--dashboard-progress": `${roundedProgress}%` }}
              role="img"
              aria-label={`${roundedProgress}% de avance`}
            >
              <strong>{roundedProgress}%</strong>
              <span>completado</span>
            </div>
            <div>
              <span className="student-dashboard-card__label">Avance general</span>
              <p>
                {hasRoute
                  ? "Porcentaje de módulos completados en tu ruta activa."
                  : "Tu avance aparecerá al comenzar una ruta."}
              </p>
            </div>
          </article>

          <article className="student-dashboard-card student-dashboard-card--metric">
            <span className="student-dashboard-card__icon student-dashboard-card__icon--success">
              <FiCheckCircle aria-hidden="true" />
            </span>
            <strong>{progress.modulos_completados}</strong>
            <p>Módulos completados</p>
          </article>

          <article className="student-dashboard-card student-dashboard-card--metric">
            <span className="student-dashboard-card__icon student-dashboard-card__icon--warning">
              <FiClock aria-hidden="true" />
            </span>
            <strong>{progress.modulos_en_progreso}</strong>
            <p>Módulos en progreso</p>
          </article>

          <article className="student-dashboard-card student-dashboard-card--metric">
            <span className="student-dashboard-card__icon student-dashboard-card__icon--muted">
              <FiLayers aria-hidden="true" />
            </span>
            <strong>{progress.modulos_pendientes}</strong>
            <p>Módulos pendientes</p>
          </article>
        </div>
      </section>

      <section className="student-dashboard-next" aria-labelledby="next-action-title">
        <div>
          <span className="student-dashboard-next__icon">
            <FiArrowRight aria-hidden="true" />
          </span>
          <div>
            <span>Acción recomendada</span>
            <h2 id="next-action-title">
              {isRouteComplete
                ? "¡Completaste tu ruta de aprendizaje!"
                : hasRoute
                  ? "Continúa con tu aprendizaje"
                  : hasStatusError
                    ? "Vuelve a consultar tu información"
                    : !hasProfile
                      ? "Completa tu perfil tecnológico"
                      : "Genera tu ruta personalizada"}
            </h2>
            <p>
              {isRouteComplete
                ? "Actualiza tu perfil tecnológico para definir una nueva meta y genera una ruta a tu medida."
                : hasRoute
                  ? "Revisa los módulos de tu ruta o consulta el detalle de tu progreso."
                  : hasStatusError
                    ? "Necesitamos confirmar tu perfil y tu ruta antes de recomendar el siguiente paso."
                    : !hasProfile
                      ? "Necesitamos conocer tu meta y nivel actual antes de construir una ruta."
                      : "Tu perfil está listo para usarlo como base de una nueva ruta."}
            </p>
          </div>
        </div>

        <div className="student-dashboard-next__actions">
          {isRouteComplete ? (
            <>
              <Link className="student-dashboard-button student-dashboard-button--primary" to="/perfil">
                Actualizar perfil
                <FiUser aria-hidden="true" />
              </Link>
              <Link className="student-dashboard-button student-dashboard-button--secondary" to="/ruta">
                Generar ruta nueva
              </Link>
            </>
          ) : hasRoute ? (
            <>
              <Link className="student-dashboard-button student-dashboard-button--primary" to="/ruta">
                Ver ruta
                <FiGitBranch aria-hidden="true" />
              </Link>
              <Link className="student-dashboard-button student-dashboard-button--secondary" to="/progreso">
                Ver progreso
              </Link>
            </>
          ) : hasStatusError ? (
            <button
              className="student-dashboard-button student-dashboard-button--primary"
              type="button"
              onClick={retryDashboard}
            >
              Reintentar
              <FiRefreshCw aria-hidden="true" />
            </button>
          ) : !hasProfile ? (
            <Link className="student-dashboard-button student-dashboard-button--primary" to="/perfil">
              Crear perfil
              <FiArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <Link className="student-dashboard-button student-dashboard-button--primary" to="/ruta">
              Generar ruta
              <FiArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    </section>
  );
}

export default DashboardPage;
