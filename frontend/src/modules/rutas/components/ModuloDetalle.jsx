import { useEffect } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiGitBranch,
  FiHash,
  FiX,
} from "react-icons/fi";

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completado", label: "Completado" },
];

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

const LEVEL_LABELS = {
  junior: "Junior",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

function getSafeResourceUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : "";
  } catch {
    return "";
  }
}

function ModuloDetalle({
  module,
  modules,
  onClose,
  onChangeStatus,
  isUpdating,
  onToggleResourceSeen,
  updatingResourceId,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isUpdating) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUpdating, onClose]);

  if (!module) {
    return null;
  }

  const status = STATUS_LABELS[module.estado] ? module.estado : "pendiente";
  const resources = Array.isArray(module.recursos) ? module.recursos : [];
  const dependencies = Array.isArray(module.dependencias)
    ? module.dependencias
    : [];
  const moduleById = new Map(
    (Array.isArray(modules) ? modules : []).map((item) => [
      String(item.id),
      item,
    ]),
  );

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isUpdating) {
      onClose();
    }
  };

  return (
    <div
      className="route-module-detail-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <aside
        className="route-module-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="route-module-detail-title"
      >
        <header className="route-module-detail__header">
          <div>
            <span>Detalle del módulo</span>
            <h2 id="route-module-detail-title">
              {module.titulo || "Módulo sin título"}
            </h2>
          </div>
          <button
            className="route-module-detail__close"
            type="button"
            aria-label="Cerrar detalle del módulo"
            autoFocus
            disabled={isUpdating}
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="route-module-detail__body">
          <div className="route-module-detail__metadata">
            <span>
              <FiHash aria-hidden="true" />
              Orden {module.orden ?? "no disponible"}
            </span>
            <span>
              <FiBookOpen aria-hidden="true" />
              {LEVEL_LABELS[module.nivel] || module.nivel || "Nivel no disponible"}
            </span>
            <span>
              <FiClock aria-hidden="true" />
              {module.tiempo_estimado_hrs !== undefined &&
                module.tiempo_estimado_hrs !== null
                ? `${module.tiempo_estimado_hrs} h estimadas`
                : "Duración no disponible"}
            </span>
          </div>

          {module.actividad_practica ? (
            <section
              className="route-module-detail__section route-module-detail__practice"
              aria-labelledby="module-practice-title"
            >
              <div className="route-module-detail__section-heading">
                <div>
                  <span>Pon a prueba lo aprendido</span>
                  <h3 id="module-practice-title">Actividad práctica</h3>
                </div>
              </div>
              <p className="route-module-detail__description">
                {module.actividad_practica}
              </p>
            </section>
          ) : (
            <p className="route-module-detail__description">
              Este módulo no incluye una descripción adicional.
            </p>
          )}

          <section className="route-module-detail__section" aria-labelledby="module-status-title">
            <div className="route-module-detail__section-heading">
              <div>
                <span>Progreso actual</span>
                <h3 id="module-status-title">Estado del módulo</h3>
              </div>
              <span className={`route-module-detail__current-status route-module-detail__current-status--${status}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>

            <div className="route-module-detail__status-actions">
              {STATUS_OPTIONS.map((option) => (
                <button
                  className={`route-module-detail__status-button route-module-detail__status-button--${option.value}`}
                  type="button"
                  key={option.value}
                  disabled={
                    isUpdating ||
                    status === option.value ||
                    status === "completado"
                  }
                  aria-pressed={status === option.value}
                  onClick={() => onChangeStatus(option.value)}
                >
                  {option.value === "completado" ? (
                    <FiCheckCircle aria-hidden="true" />
                  ) : (
                    <FiClock aria-hidden="true" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>

            {status === "completado" && (
              <p className="route-module-detail__hint">
                Este módulo ya fue completado y no puede regresar a un estado
                anterior.
              </p>
            )}

            {isUpdating && (
              <p className="route-module-detail__saving" role="status">
                <span className="route-button__spinner" aria-hidden="true" />
                Guardando el nuevo estado…
              </p>
            )}
          </section>

          <section className="route-module-detail__section" aria-labelledby="module-resources-title">
            <div className="route-module-detail__section-heading">
              <div>
                <span>Material de apoyo</span>
                <h3 id="module-resources-title">Recursos</h3>
              </div>
              <strong>{resources.length}</strong>
            </div>

            {resources.length > 0 ? (
              <div className="route-module-detail__resources">
                {resources.map((resource) => {
                  const safeUrl = getSafeResourceUrl(resource.url);
                  const isSeen = resource.estado === "completado";
                  const isSavingThis = updatingResourceId === resource.id;

                  return (
                    <div className="route-module-detail__resource" key={resource.id}>
                      {safeUrl ? (
                        <a
                          className="route-module-detail__resource-link"
                          href={safeUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <div className="route-module-detail__resource-icon">
                            <FiBookOpen aria-hidden="true" />
                          </div>
                          <div>
                            <strong>{resource.titulo || "Recurso sin título"}</strong>
                            <span>{resource.tipo || "Tipo no disponible"}</span>
                          </div>
                          <FiExternalLink aria-hidden="true" />
                        </a>
                      ) : (
                        <div className="route-module-detail__resource-link route-module-detail__resource-link--unavailable">
                          <div className="route-module-detail__resource-icon">
                            <FiBookOpen aria-hidden="true" />
                          </div>
                          <div>
                            <strong>{resource.titulo || "Recurso sin título"}</strong>
                            <span>{resource.tipo || "Tipo no disponible"}</span>
                          </div>
                          <FiAlertCircle aria-label="Enlace no disponible" />
                        </div>
                      )}

                      <button
                        type="button"
                        className={
                          isSeen
                            ? "route-module-detail__seen-toggle route-module-detail__seen-toggle--seen"
                            : "route-module-detail__seen-toggle"
                        }
                        disabled={isSavingThis}
                        aria-pressed={isSeen}
                        onClick={() => onToggleResourceSeen(resource.id, isSeen)}
                      >
                        {isSavingThis ? (
                          <span className="route-button__spinner" aria-hidden="true" />
                        ) : (
                          <FiCheckCircle aria-hidden="true" />
                        )}
                        {isSeen ? "Visto" : "Marcar como visto"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="route-module-detail__empty">
                Este módulo aún no tiene recursos asociados.
              </p>
            )}
          </section>

          <section className="route-module-detail__section" aria-labelledby="module-dependencies-title">
            <div className="route-module-detail__section-heading">
              <div>
                <span>Requisitos previos</span>
                <h3 id="module-dependencies-title">Dependencias</h3>
              </div>
              <FiGitBranch aria-hidden="true" />
            </div>

            {dependencies.length > 0 ? (
              <ul className="route-module-detail__dependencies">
                {dependencies.map((dependency) => {
                  const dependencyModule = moduleById.get(
                    String(dependency.depende_de_id),
                  );

                  return (
                    <li key={dependency.id}>
                      {dependencyModule?.titulo ||
                        `Módulo ${dependency.depende_de_id}`}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="route-module-detail__empty">
                Este módulo no tiene dependencias previas.
              </p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

export default ModuloDetalle;
