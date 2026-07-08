import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiFileText,
  FiGitBranch,
  FiLayers,
  FiPlayCircle,
  FiRefreshCw,
  FiTarget,
  FiUser,
  FiX,
  FiZap,
} from "react-icons/fi";
import { obtenerPerfilActual } from "../../api/perfilApi";
import { obtenerRutaActiva } from "../../api/progresoApi";
import { generarRuta, regenerarRuta } from "../../api/rutasApi";
import RoadmapFlow from "./components/RoadmapFlow";
import "../../styles/ruta.css";

const INITIAL_STATE = {
  profile: null,
  profileStatus: "loading",
  route: null,
  routeStatus: "loading",
  loadError: "",
};

const STATUS_LABELS = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

const LEVEL_LABELS = {
  junior: "Junior",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const PROFILE_LEVEL_LABELS = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
};

const RESOURCE_ICONS = {
  video: FiPlayCircle,
  articulo: FiFileText,
  documentacion: FiBookOpen,
};

function isNotFound(result) {
  return result.status === "rejected" && result.reason?.response?.status === 404;
}

function getLoadError(results) {
  const hasUnexpectedError = results.some(
    (result) => result.status === "rejected" && !isNotFound(result),
  );

  if (!hasUnexpectedError) {
    return "";
  }

  const hasConnectionError = results.some(
    (result) => result.status === "rejected" && !result.reason?.response,
  );

  return hasConnectionError
    ? "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
    : "No fue posible cargar la información de tu ruta. Inténtalo nuevamente.";
}

function getActionError(error) {
  const status = error.response?.status;

  if (status === 502 || status === 503) {
    return "El servicio de IA está temporalmente saturado. Intenta nuevamente en unos minutos.";
  }

  if (!error.response) {
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  }

  if (status === 401) {
    return "Tu sesión expiró. Vuelve a iniciar sesión para continuar.";
  }

  if (status === 404) {
    return "Necesitas completar tu perfil tecnológico antes de generar una ruta.";
  }

  if (status === 422) {
    return "El backend no pudo procesar la solicitud. Revisa tu perfil e inténtalo nuevamente.";
  }

  return "No fue posible generar la ruta en este momento. Inténtalo nuevamente más tarde.";
}

function formatDate(value) {
  if (!value) {
    return "Fecha no disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getSafeResourceUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : "";
  } catch {
    return "";
  }
}

function RutaPage() {
  const [pageState, setPageState] = useState(INITIAL_STATE);
  const [retryCount, setRetryCount] = useState(0);
  const [currentAction, setCurrentAction] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showRegenerateConfirmation, setShowRegenerateConfirmation] =
    useState(false);

  useEffect(() => {
    let ignoreResults = false;

    const loadPage = async () => {
      setPageState((current) => ({
        ...current,
        profileStatus: "loading",
        routeStatus: "loading",
        loadError: "",
      }));

      const results = await Promise.allSettled([
        obtenerPerfilActual(),
        obtenerRutaActiva(),
      ]);

      if (ignoreResults) {
        return;
      }

      const [profileResult, routeResult] = results;

      setPageState({
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
        loadError: getLoadError(results),
      });
    };

    loadPage();

    return () => {
      ignoreResults = true;
    };
  }, [retryCount]);

  const isInitialLoading =
    pageState.profileStatus === "loading" || pageState.routeStatus === "loading";
  const isWorking = Boolean(currentAction);

  const saveGeneratedRoute = (route, successMessage) => {
    setPageState((current) => ({
      ...current,
      route,
      routeStatus: "exists",
      loadError: "",
    }));
    setFeedback({ type: "success", message: successMessage });
  };

  const handleGenerate = async () => {
    if (isWorking || pageState.profileStatus !== "exists") {
      return;
    }

    setCurrentAction("generating");
    setFeedback(null);

    try {
      const route = await generarRuta();
      saveGeneratedRoute(route, "Tu ruta de aprendizaje se generó correctamente.");
    } catch (error) {
      if (error.response?.status === 404) {
        setPageState((current) => ({
          ...current,
          profile: null,
          profileStatus: "missing",
        }));
      }

      setFeedback({ type: "error", message: getActionError(error) });
    } finally {
      setCurrentAction("");
    }
  };

  const handleRegenerate = async () => {
    if (isWorking) {
      return;
    }

    setShowRegenerateConfirmation(false);
    setCurrentAction("regenerating");
    setFeedback(null);

    try {
      const route = await regenerarRuta();
      saveGeneratedRoute(route, "Tu ruta se regeneró correctamente.");
    } catch (error) {
      setFeedback({ type: "error", message: getActionError(error) });
    } finally {
      setCurrentAction("");
    }
  };

  if (isInitialLoading) {
    return (
      <section className="route-state" aria-live="polite">
        <span className="route-spinner" aria-hidden="true" />
        <h1>Cargando tu ruta</h1>
        <p>Estamos consultando tu perfil y tu ruta de aprendizaje activa.</p>
      </section>
    );
  }

  const hasProfile = pageState.profileStatus === "exists";
  const hasRoute = pageState.routeStatus === "exists";
  const hasLoadError =
    pageState.profileStatus === "error" || pageState.routeStatus === "error";
  const modules = [...(pageState.route?.modulos || [])].sort(
    (first, second) => first.orden - second.orden,
  );
  const totalHours = modules.reduce(
    (total, module) => total + (Number(module.tiempo_estimado_hrs) || 0),
    0,
  );

  if (
    !hasRoute &&
    hasLoadError &&
    pageState.profileStatus !== "missing"
  ) {
    return (
      <section className="route-state route-state--error" role="alert">
        <FiAlertCircle aria-hidden="true" />
        <h1>No pudimos cargar tu ruta</h1>
        <p>{pageState.loadError}</p>
        <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
          <FiRefreshCw aria-hidden="true" />
          Reintentar
        </button>
      </section>
    );
  }

  if (!hasProfile && !hasRoute) {
    return (
      <section className="route-page">
        <header className="route-page__heading">
          <div>
            <span className="route-page__eyebrow">
              <FiGitBranch aria-hidden="true" /> Ruta personalizada
            </span>
            <h1>Construye tu ruta de aprendizaje</h1>
            <p>La IA utilizará tu perfil para proponer módulos y recursos.</p>
          </div>
        </header>

        {feedback && (
          <div className={`route-feedback route-feedback--${feedback.type}`} role="alert">
            <FiAlertCircle aria-hidden="true" />
            <span>{feedback.message}</span>
          </div>
        )}

        <article className="route-empty-card">
          <span className="route-empty-card__icon">
            <FiUser aria-hidden="true" />
          </span>
          <span className="route-empty-card__label">Paso requerido</span>
          <h2>Completa tu perfil tecnológico</h2>
          <p>
            Antes de generar una ruta necesitamos conocer tu meta profesional,
            nivel actual y áreas de interés.
          </p>
          <Link className="route-button route-button--primary" to="/perfil">
            Ir a perfil
            <FiTarget aria-hidden="true" />
          </Link>
        </article>
      </section>
    );
  }

  if (!hasRoute) {
    return (
      <section className="route-page">
        <header className="route-page__heading">
          <div>
            <span className="route-page__eyebrow">
              <FiGitBranch aria-hidden="true" /> Ruta personalizada
            </span>
            <h1>Genera tu ruta de aprendizaje</h1>
            <p>
              Tu perfil está listo. MotorIA puede construir una ruta adaptada a
              tu meta y nivel actual.
            </p>
          </div>
        </header>

        {feedback && (
          <div className={`route-feedback route-feedback--${feedback.type}`} role="alert">
            <FiAlertCircle aria-hidden="true" />
            <span>{feedback.message}</span>
          </div>
        )}

        <article className="route-ready-card">
          <div className="route-ready-card__profile">
            <span>
              <FiCheckCircle aria-hidden="true" /> Perfil completo
            </span>
            <h2>{pageState.profile.meta_profesional}</h2>
            <p>Nivel actual: {pageState.profile.nivel_actual}</p>
          </div>

          <div className="route-ready-card__action">
            <span className="route-ready-card__ai-icon">
              <FiZap aria-hidden="true" />
            </span>
            <div>
              <h3>Tu ruta está lista para construirse</h3>
              <p>
                La generación puede tardar unos segundos mientras la IA analiza
                tu perfil.
              </p>
            </div>
            <button
              className="route-button route-button--primary"
              type="button"
              disabled={isWorking}
              onClick={handleGenerate}
            >
              {currentAction === "generating" ? (
                <>
                  <span className="route-button__spinner" aria-hidden="true" />
                  Generando ruta…
                </>
              ) : (
                <>
                  Generar ruta
                  <FiZap aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="route-page">
      <header className="route-page__heading route-page__heading--active">
        <div>
          <span className="route-page__eyebrow">
            <FiGitBranch aria-hidden="true" /> Ruta activa
          </span>
          <h1>{pageState.route.titulo}</h1>
          <p>
            Meta: {pageState.profile?.meta_profesional || "Ruta personalizada"}
          </p>
        </div>

        <div className="route-page__actions">
          <Link className="route-button route-button--secondary" to="/progreso">
            Ver progreso
          </Link>
          <button
            className="route-button route-button--primary"
            type="button"
            disabled={isWorking || !hasProfile}
            onClick={() => setShowRegenerateConfirmation(true)}
          >
            <FiRefreshCw aria-hidden="true" />
            Regenerar ruta
          </button>
        </div>
      </header>

      {feedback && (
        <div
          className={`route-feedback route-feedback--${feedback.type}`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.type === "success" ? (
            <FiCheckCircle aria-hidden="true" />
          ) : (
            <FiAlertCircle aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {showRegenerateConfirmation && (
        <div className="route-confirmation" role="alertdialog" aria-labelledby="route-confirm-title">
          <div>
            <FiAlertCircle aria-hidden="true" />
            <div>
              <h2 id="route-confirm-title">¿Regenerar esta ruta?</h2>
              <p>
                La ruta actual será archivada y se creará una nueva a partir de
                tu perfil tecnológico.
              </p>
            </div>
          </div>
          <div className="route-confirmation__actions">
            <button
              className="route-button route-button--ghost"
              type="button"
              onClick={() => setShowRegenerateConfirmation(false)}
            >
              <FiX aria-hidden="true" /> Cancelar
            </button>
            <button
              className="route-button route-button--danger"
              type="button"
              onClick={handleRegenerate}
            >
              Confirmar regeneración
            </button>
          </div>
        </div>
      )}

      {currentAction === "regenerating" && (
        <div className="route-working" role="status">
          <span className="route-spinner" aria-hidden="true" />
          <div>
            <strong>Regenerando tu ruta</strong>
            <p>La IA está preparando una nueva propuesta. Esto puede tardar unos segundos.</p>
          </div>
        </div>
      )}

      <div className="route-summary-grid">
        <article className="route-summary-card">
          <span><FiLayers aria-hidden="true" /></span>
          <strong>{modules.length}</strong>
          <p>Módulos</p>
        </article>
        <article className="route-summary-card">
          <span><FiClock aria-hidden="true" /></span>
          <strong>{totalHours}</strong>
          <p>Horas estimadas</p>
        </article>
        <article className="route-summary-card">
          <span><FiTarget aria-hidden="true" /></span>
          <strong>
            {PROFILE_LEVEL_LABELS[pageState.profile?.nivel_actual] ||
              pageState.profile?.nivel_actual ||
              "—"}
          </strong>
          <p>Nivel de partida</p>
        </article>
        <article className="route-summary-card">
          <span><FiZap aria-hidden="true" /></span>
          <strong>{pageState.route.desde_cache ? "Reutilizada" : "IA"}</strong>
          <p>Origen de la ruta</p>
        </article>
      </div>

      {modules.length > 0 && (
        <section className="route-roadmap-section" aria-labelledby="route-roadmap-title">
          <div className="route-roadmap-heading">
            <div>
              <span>Recorrido secuencial</span>
              <h2 id="route-roadmap-title">Roadmap de aprendizaje</h2>
              <p>Sigue los módulos en orden; cada fila continúa en sentido alternado.</p>
            </div>
            <div className="route-roadmap-legend" aria-label="Estados de los módulos">
              <span className="route-roadmap-legend__item route-roadmap-legend__item--pendiente">
                Pendiente
              </span>
              <span className="route-roadmap-legend__item route-roadmap-legend__item--en_progreso">
                En progreso
              </span>
              <span className="route-roadmap-legend__item route-roadmap-legend__item--completado">
                Completado
              </span>
            </div>
          </div>
          <RoadmapFlow key={pageState.route.id} modules={modules} />
        </section>
      )}

      <div className="route-modules-heading">
        <div>
          <span>Detalle del plan</span>
          <h2>Listado de módulos</h2>
        </div>
        <p>Creada el {formatDate(pageState.route.created_at)}</p>
      </div>

      {modules.length === 0 ? (
        <article className="route-no-modules">
          <FiAlertCircle aria-hidden="true" />
          <h2>La ruta todavía no contiene módulos</h2>
          <p>Puedes regenerarla para solicitar una nueva propuesta.</p>
        </article>
      ) : (
        <div className="route-modules">
          {modules.map((module, index) => {
            const moduleStatus = module.estado || "pendiente";

            return (
              <article className="route-module" key={module.id}>
                <div className="route-module__number">{index + 1}</div>
                <div className="route-module__content">
                  <div className="route-module__heading">
                    <div>
                      <div className="route-module__badges">
                        <span>{LEVEL_LABELS[module.nivel] || module.nivel}</span>
                        <span className={`route-module__status route-module__status--${moduleStatus}`}>
                          {STATUS_LABELS[moduleStatus] || moduleStatus}
                        </span>
                      </div>
                      <h3>{module.titulo}</h3>
                    </div>
                    <span className="route-module__time">
                      <FiClock aria-hidden="true" />
                      {module.tiempo_estimado_hrs} h
                    </span>
                  </div>

                  {(module.recursos || []).length > 0 ? (
                    <div className="route-resources">
                      <span>Recursos sugeridos</span>
                      <div>
                        {module.recursos.map((resource) => {
                          const ResourceIcon = RESOURCE_ICONS[resource.tipo] || FiBookOpen;
                          const safeUrl = getSafeResourceUrl(resource.url);
                          const content = (
                            <>
                              <ResourceIcon aria-hidden="true" />
                              <span>{resource.titulo}</span>
                              <small>{resource.tipo}</small>
                              {safeUrl ? (
                                <FiExternalLink aria-hidden="true" />
                              ) : (
                                <FiAlertCircle aria-label="Enlace no disponible" />
                              )}
                            </>
                          );

                          return safeUrl ? (
                            <a
                              className="route-resource"
                              href={safeUrl}
                              key={resource.id}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {content}
                            </a>
                          ) : (
                            <div
                              className="route-resource route-resource--unavailable"
                              key={resource.id}
                            >
                              {content}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="route-module__empty-resources">
                      Este módulo no tiene recursos asociados todavía.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RutaPage;
