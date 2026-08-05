import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiExternalLink,
  FiFileText,
  FiGitBranch,
  FiPlayCircle,
  FiRefreshCw,
  FiTarget,
  FiUser,
  FiX,
  FiZap,
} from "react-icons/fi";
import { obtenerPerfilActual } from "../../api/perfilApi";
import {
  actualizarProgresoModulo,
  actualizarProgresoRecurso,
  obtenerRutaActiva,
  obtenerResumenProgreso,
} from "../../api/progresoApi";
import { generarRuta, regenerarRuta } from "../../api/rutasApi";
import ConfirmModal from "../../components/ui/ConfirmModal";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";
import Skeleton from "../../components/ui/Skeleton";
import useToast from "../../hooks/useToast";
import ModuloDetalle from "./components/ModuloDetalle";
import RoadmapFlow from "./components/RoadmapFlow";
import ConfettiBurst from "../../components/ui/ConfettiBurst";
import "../../styles/ruta.css";

const INITIAL_STATE = {
  profile: null,
  profileStatus: "loading",
  route: null,
  routeStatus: "loading",
  progressSummary: null,
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

function getModuleUpdateError(error) {
  const status = error.response?.status;

  if (!error.response) {
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  }

  if (status === 401) {
    return "Tu sesión expiró. Vuelve a iniciar sesión para continuar.";
  }

  if (status === 403) {
    return "No tienes permisos para actualizar este módulo.";
  }

  if (status === 404) {
    return "El módulo no existe o ya no pertenece a tu ruta activa.";
  }

  if (status === 400) {
    return (
      error.response?.data?.detail ||
      "No fue posible actualizar el módulo con el estado solicitado."
    );
  }

  if (status === 422) {
    return "El estado seleccionado no es válido. Recarga la página e inténtalo de nuevo.";
  }

  return "No fue posible actualizar el módulo. Inténtalo nuevamente más tarde.";
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

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculateProgressSummary(modules, apiSummary = null) {
  const safeModules = Array.isArray(modules) ? modules : [];
  const completedModules = safeModules.filter(
    (module) => module.estado === "completado",
  );
  const inProgressModules = safeModules.filter(
    (module) => module.estado === "en_progreso",
  );
  const pendingModules =
    safeModules.length - completedModules.length - inProgressModules.length;
  const localPercentage = safeModules.length
    ? Math.round((completedModules.length * 10000) / safeModules.length) / 100
    : 0;
  const modulesWithDuration = safeModules.filter(
    (module) =>
      module.tiempo_estimado_hrs !== undefined &&
      module.tiempo_estimado_hrs !== null &&
      module.tiempo_estimado_hrs !== "" &&
      Number.isFinite(Number(module.tiempo_estimado_hrs)),
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
    total_modulos: apiSummary
      ? safeNumber(apiSummary.total_modulos)
      : safeModules.length,
    porcentaje_avance: Math.min(
      100,
      Math.max(
        0,
        apiSummary
          ? safeNumber(apiSummary.porcentaje_avance)
          : localPercentage,
      ),
    ),
    modulos_completados: apiSummary
      ? safeNumber(apiSummary.modulos_completados)
      : completedModules.length,
    modulos_en_progreso: apiSummary
      ? safeNumber(apiSummary.modulos_en_progreso)
      : inProgressModules.length,
    modulos_pendientes: apiSummary
      ? safeNumber(apiSummary.modulos_pendientes)
      : pendingModules,
    hasDurations: modulesWithDuration.length > 0,
    horas_completadas: completedHours,
    horas_restantes: Math.max(0, totalHours - completedHours),
    horas_totales: totalHours,
  };
}

function RutaPage() {
  const toast = useToast();
  const [pageState, setPageState] = useState(INITIAL_STATE);
  const [retryCount, setRetryCount] = useState(0);
  const [currentAction, setCurrentAction] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [updatingModuleId, setUpdatingModuleId] = useState(null);
  const [updatingResourceId, setUpdatingResourceId] = useState(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [roadmapFocus, setRoadmapFocus] = useState({
    moduleId: null,
    requestId: 0,
  });
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
        obtenerResumenProgreso(),
      ]);

      if (ignoreResults) {
        return;
      }

      const [profileResult, routeResult, progressResult] = results;
      const route =
        routeResult.status === "fulfilled" ? routeResult.value : null;

      if (
        route &&
        progressResult.status === "rejected" &&
        !isNotFound(progressResult)
      ) {
        toast.warning(
          "No pudimos consultar el resumen guardado. Mostramos el avance calculado desde tu ruta.",
        );
      }

      setPageState({
        profile:
          profileResult.status === "fulfilled" ? profileResult.value : null,
        profileStatus:
          profileResult.status === "fulfilled"
            ? "exists"
            : isNotFound(profileResult)
              ? "missing"
              : "error",
        route,
        routeStatus:
          routeResult.status === "fulfilled"
            ? "exists"
            : isNotFound(routeResult)
              ? "missing"
              : "error",
        progressSummary:
          progressResult.status === "fulfilled"
            ? calculateProgressSummary(
                route?.modulos,
                progressResult.value,
              )
            : calculateProgressSummary(route?.modulos),
        loadError: getLoadError([profileResult, routeResult]),
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
      progressSummary: calculateProgressSummary(route?.modulos),
      loadError: "",
    }));
    setSelectedModuleId(null);
    setRoadmapFocus({ moduleId: null, requestId: 0 });
    setFeedback({ type: "success", message: successMessage });
    toast.success(successMessage);
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

      const message = getActionError(error);
      setFeedback({ type: "error", message });
      toast.error(message);
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
      const message = getActionError(error);
      setFeedback({ type: "error", message });
      toast.error(message);
    } finally {
      setCurrentAction("");
    }
  };

  if (isInitialLoading) {
    return (
      <section className="route-page">
        <PageLoader
          className="route-state"
          title="Cargando tu ruta"
          description="Estamos consultando tu perfil y tu ruta de aprendizaje activa."
        >
          <div className="route-skeleton" aria-hidden="true">
            <Skeleton height="108px" />
            <Skeleton height="190px" />
            <Skeleton height="108px" />
          </div>
        </PageLoader>
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
  const selectedModule = modules.find(
    (module) => String(module.id) === String(selectedModuleId),
  );
  const isRouteFullyCompleted =
    modules.length > 0 &&
    modules.every((module) => (module.estado || "pendiente") === "completado");

  const handleSelectModule = (module) => {
    setSelectedModuleId(module.id);
  };

  const handleCloseModuleDetail = () => {
    if (!updatingModuleId) {
      setSelectedModuleId(null);
    }
  };

  const handleUpdateModuleStatus = async (estado) => {
    if (!selectedModule || updatingModuleId || !STATUS_LABELS[estado]) {
      return;
    }

    const moduleId = selectedModule.id;
    setUpdatingModuleId(moduleId);

    try {
      const updatedProgress = await actualizarProgresoModulo(moduleId, estado);
      let rutaRecienCompletada = false;

      setPageState((current) => {
        const updatedModules = (current.route?.modulos || []).map((module) =>
          String(module.id) === String(moduleId)
            ? { ...module, estado: updatedProgress.estado }
            : module,
        );

        rutaRecienCompletada =
          updatedProgress.estado === "completado" &&
          updatedModules.length > 0 &&
          updatedModules.every((module) => module.estado === "completado");

        return {
          ...current,
          route: current.route
            ? { ...current.route, modulos: updatedModules }
            : current.route,
          progressSummary: calculateProgressSummary(updatedModules),
        };
      });

      toast.success(
        `El módulo ahora está ${
          STATUS_LABELS[updatedProgress.estado]?.toLowerCase() || "actualizado"
        }.`,
      );

      if (rutaRecienCompletada) {
        setIsCelebrating(true);
        toast.success(
          "Completaste el 100% de tu ruta de aprendizaje. ¡Excelente trabajo!",
          { title: "¡Felicidades!", duration: 7000 },
        );
      }
    } catch (error) {
      const message = getModuleUpdateError(error);
      toast.error(message);
    } finally {
      setUpdatingModuleId(null);
    }
  };

  const handleToggleResourceSeen = async (recursoId, wasSeen) => {
    if (updatingResourceId) {
      return;
    }

    const nextEstado = wasSeen ? "pendiente" : "completado";
    setUpdatingResourceId(recursoId);

    try {
      const updatedResource = await actualizarProgresoRecurso(recursoId, nextEstado);

      let moduleAutoAdvanced = false;
      let moduleAutoCompleted = false;
      let rutaRecienCompletada = false;

      setPageState((current) => {
        const updatedModules = (current.route?.modulos || []).map((module) => {
          const recursos = Array.isArray(module.recursos) ? module.recursos : [];
          const tieneRecurso = recursos.some(
            (recurso) => String(recurso.id) === String(recursoId),
          );

          if (!tieneRecurso) {
            return module;
          }

          const recursosActualizados = recursos.map((recurso) =>
            String(recurso.id) === String(recursoId)
              ? { ...recurso, estado: updatedResource.estado }
              : recurso,
          );

          if (module.estado === "completado") {
            return { ...module, recursos: recursosActualizados };
          }

          const todosVistos =
            updatedResource.estado === "completado" &&
            recursosActualizados.length > 0 &&
            recursosActualizados.every(
              (recurso) => recurso.estado === "completado",
            );
          const debeAvanzar =
            updatedResource.estado === "completado" && module.estado === "pendiente";

          let nuevoEstadoModulo = module.estado;
          if (todosVistos) {
            nuevoEstadoModulo = "completado";
            moduleAutoCompleted = true;
          } else if (debeAvanzar) {
            nuevoEstadoModulo = "en_progreso";
            moduleAutoAdvanced = true;
          }

          return {
            ...module,
            recursos: recursosActualizados,
            estado: nuevoEstadoModulo,
          };
        });

        rutaRecienCompletada =
          moduleAutoCompleted &&
          updatedModules.length > 0 &&
          updatedModules.every((module) => module.estado === "completado");

        return {
          ...current,
          route: current.route
            ? { ...current.route, modulos: updatedModules }
            : current.route,
          progressSummary: calculateProgressSummary(updatedModules),
        };
      });

      toast.success(
        updatedResource.estado === "completado"
          ? "Recurso marcado como visto."
          : "Recurso marcado como pendiente.",
      );
      if (moduleAutoCompleted) {
        toast.info("Todos los recursos están vistos: el módulo se completó.");
      } else if (moduleAutoAdvanced) {
        toast.info("El módulo ahora está en progreso.");
      }

      if (rutaRecienCompletada) {
        setIsCelebrating(true);
        toast.success(
          "Completaste el 100% de tu ruta de aprendizaje. ¡Excelente trabajo!",
          { title: "¡Felicidades!", duration: 7000 },
        );
      }
    } catch (error) {
      const message = getModuleUpdateError(error);
      toast.error(message);
    } finally {
      setUpdatingResourceId(null);
    }
  };

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

        <EmptyState
          className="route-empty-card"
          icon={FiUser}
          eyebrow="Paso requerido"
          title="Completa tu perfil tecnológico"
          description="Antes de generar una ruta necesitamos conocer tu meta profesional, nivel actual y áreas de interés."
          action={
            <Link className="route-button route-button--primary" to="/perfil">
              Ir a perfil
              <FiTarget aria-hidden="true" />
            </Link>
          }
        />
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
            <h2>Aún no tienes una ruta de aprendizaje.</h2>
            <p>{pageState.profile.meta_profesional}</p>
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

      {isCelebrating && (
        <ConfettiBurst onComplete={() => setIsCelebrating(false)} />
      )}

      {isRouteFullyCompleted && (
        <div className="route-feedback route-feedback--success" role="status">
          <FiCheckCircle aria-hidden="true" />
          <span>
            Completaste esta ruta. Actualiza tu perfil tecnológico para
            definir una nueva meta y genera una ruta nueva.{" "}
            <Link to="/perfil">Actualizar perfil</Link>
          </span>
        </div>
      )}

      {showRegenerateConfirmation && (
        <ConfirmModal
          title="¿Regenerar esta ruta?"
          description="La ruta actual será archivada y se creará una nueva a partir de tu perfil tecnológico."
          confirmLabel="Confirmar regeneración"
          tone="danger"
          isConfirming={currentAction === "regenerating"}
          onConfirm={handleRegenerate}
          onCancel={() => setShowRegenerateConfirmation(false)}
        />
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
          <RoadmapFlow
            key={pageState.route.id}
            modules={modules}
            selectedModuleId={selectedModuleId}
            onModuleClick={handleSelectModule}
            focusModuleId={roadmapFocus.moduleId}
            focusRequestId={roadmapFocus.requestId}
          />
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
              <article
                className={`route-module${
                  String(selectedModuleId) === String(module.id)
                    ? " route-module--selected"
                    : ""
                }`}
                key={module.id}
              >
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
                    <div className="route-module__actions">
                      <span className="route-module__time">
                        <FiClock aria-hidden="true" />
                        {module.tiempo_estimado_hrs} h
                      </span>
                      <button
                        className="route-module__open"
                        type="button"
                        onClick={() => handleSelectModule(module)}
                      >
                        Ver detalle
                        <FiChevronRight aria-hidden="true" />
                      </button>
                    </div>
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

      {selectedModule && (
        <ModuloDetalle
          module={selectedModule}
          modules={modules}
          onClose={handleCloseModuleDetail}
          onChangeStatus={handleUpdateModuleStatus}
          isUpdating={String(updatingModuleId) === String(selectedModule.id)}
          onToggleResourceSeen={handleToggleResourceSeen}
          updatingResourceId={updatingResourceId}
        />
      )}
    </section>
  );
}

export default RutaPage;
