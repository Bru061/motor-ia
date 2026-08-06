import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiGitBranch,
  FiInfo,
  FiLayers,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import { obtenerUsuarioAdmin } from "../../api/adminApi";
import EmptyState from "../../components/ui/EmptyState";
import PageHeading from "../../components/ui/PageHeading";
import PageLoader from "../../components/ui/PageLoader";
import useToast from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatDate, getInitials } from "../../utils/formatters";
import RoadmapFlow from "../rutas/components/RoadmapFlow";
import "../../styles/ruta.css";

const STATUS_LABELS = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

const NIVEL_LABELS = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
};

const LONG_DATE_FORMAT = {
  day: "2-digit",
  month: "long",
  year: "numeric",
};

function DetailField({ label, value }) {
  return (
    <div className="admin-detail-field">
      <span>{label}</span>
      <strong>{value || "No disponible"}</strong>
    </div>
  );
}

function ProgressMetric({ icon: Icon, label, value, tone = "cyan" }) {
  return (
    <article className={`admin-progress-metric admin-progress-metric--${tone}`}>
      <Icon aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function AdminUsuarioDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignoreResults = false;

    const loadUser = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await obtenerUsuarioAdmin(id);

        if (!ignoreResults) {
          setUser(response);
        }
      } catch (err) {
        if (!ignoreResults) {
          const message = getApiErrorMessage(
            err,
            "No fue posible cargar el detalle del usuario.",
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

    loadUser();

    return () => {
      ignoreResults = true;
    };
  }, [id, retryCount, toast]);

  const progress = user?.progreso;
  const route = user?.ruta_activa;
  const modules = route?.modulos || [];
  const archivedRoutes = user?.rutas_archivadas || [];
  const roadmapModules = useMemo(
    () =>
      modules.map((module) => ({ ...module, estado: module.estado_progreso })),
    [modules],
  );
  const initials = useMemo(
    () => getInitials(user?.nombre, user?.email),
    [user?.email, user?.nombre],
  );

  if (isLoading) {
    return (
      <PageLoader
        title="Cargando usuario"
        description="Consultando detalle administrativo."
      />
    );
  }

  if (error) {
    return (
      <section className="admin-page">
        <EmptyState
          icon={FiAlertCircle}
          tone="error"
          title="No pudimos cargar el usuario"
          description={error}
          action={
            <div className="admin-empty-actions">
              <button
                className="route-button route-button--secondary"
                type="button"
                onClick={() => navigate(-1)}
              >
                <FiArrowLeft aria-hidden="true" />
                Volver
              </button>
              <button
                className="route-button route-button--primary"
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                <FiRefreshCw aria-hidden="true" />
                Reintentar
              </button>
            </div>
          }
        />
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="admin-page">
      <button
        className="admin-back-button"
        type="button"
        onClick={() => navigate(-1)}
      >
        <FiArrowLeft aria-hidden="true" />
        Volver
      </button>

      <PageHeading
        eyebrow="Panel administrativo"
        icon={FiUsers}
        title="Detalle de usuario"
        description={`Información del usuario ${user.nombre}.`}
      />

      <article className="admin-panel admin-user-hero">
        <div className="profile-heading">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2>{user.nombre || "Sin nombre"}</h2>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="admin-user-hero__meta">
          <span className="admin-badge admin-badge--role">{user.rol}</span>
          <span>Registro: {formatDate(user.created_at, LONG_DATE_FORMAT)}</span>
          <span>
            <FiClock aria-hidden="true" /> Última actividad:{" "}
            {formatDate(user.ultima_actividad, LONG_DATE_FORMAT)}
          </span>
        </div>
      </article>

      <article className="admin-panel">
        <div className="section-heading">
          <div>
            <h2>Perfil tecnológico</h2>
            <span>Perfil y categorías</span>
          </div>
          <FiLayers aria-hidden="true" />
        </div>
        {user.perfil ? (
          <>
            <div className="admin-detail-fields admin-detail-fields--row">
              <DetailField
                label="Meta profesional"
                value={user.perfil.meta_profesional}
              />
              <DetailField
                label="Nivel actual"
                value={user.perfil.nivel_actual}
              />
              <DetailField
                label="Última actualización"
                value={formatDate(user.perfil.updated_at, LONG_DATE_FORMAT)}
              />
            </div>
            {user.tecnologias.length > 0 ? (
              <div className="profile-tags admin-tech-tags">
                {user.tecnologias.map((technology) => (
                  <span
                    title={technology.descripcion || undefined}
                    key={technology.id}
                  >
                    {technology.nombre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="admin-muted-text">
                Sin categorías tecnológicas asociadas.
              </p>
            )}
          </>
        ) : (
          <EmptyState
            className="admin-compact-empty"
            icon={FiLayers}
            tone="warning"
            title="Sin perfil tecnológico"
            description="El usuario todavía no tiene perfil registrado."
          />
        )}
      </article>

      <article className="admin-panel">
        <div className="section-heading">
          <div>
            <h2>Ruta activa</h2>
            <span>Progreso y módulos</span>
          </div>
          <FiGitBranch aria-hidden="true" />
        </div>

        {route ? (
          <>
            <div className="admin-route-heading">
              <div>
                <h3>{route.titulo}</h3>
                <p>
                  Estado: {route.estado} · Creada el{" "}
                  {formatDate(route.created_at, LONG_DATE_FORMAT)}
                  {route.desde_cache ? " · Generada desde cache" : ""}
                </p>
              </div>
              <strong>{route.total_modulos} módulos</strong>
            </div>

            {progress && (
              <div className="admin-progress-grid">
                <ProgressMetric
                  icon={FiCheckCircle}
                  label="Completados"
                  value={progress.modulos_completados}
                  tone="green"
                />
                <ProgressMetric
                  icon={FiClock}
                  label="En progreso"
                  value={progress.modulos_en_progreso}
                  tone="amber"
                />
                <ProgressMetric
                  icon={FiLayers}
                  label="Pendientes"
                  value={progress.modulos_pendientes}
                  tone="violet"
                />
                <ProgressMetric
                  icon={FiGitBranch}
                  label="Avance"
                  value={`${Math.round(progress.porcentaje)}%`}
                  tone="cyan"
                />
              </div>
            )}

            {modules.length > 0 && (
              <div className="admin-roadmap-readonly">
                <p className="admin-muted-text">
                  Vista de solo lectura — no se pueden abrir ni editar módulos
                  desde aquí.
                </p>
                <RoadmapFlow modules={roadmapModules} />
              </div>
            )}

            {modules.length > 0 ? (
              <div className="admin-modules-list">
                {modules.map((module) => (
                  <article className="admin-module-item" key={module.id}>
                    <span className="admin-module-item__order">
                      {module.orden}
                    </span>
                    <div>
                      <h4>{module.titulo}</h4>
                      <p>
                        Nivel {module.nivel} · {module.tiempo_estimado_hrs} h
                      </p>
                    </div>
                    <span
                      className={`admin-badge admin-badge--${module.estado_progreso}`}
                    >
                      {STATUS_LABELS[module.estado_progreso] ||
                        module.estado_progreso}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                className="admin-compact-empty"
                icon={FiGitBranch}
                tone="warning"
                title="Ruta sin módulos"
                description="La ruta activa no incluye módulos en la respuesta."
              />
            )}
          </>
        ) : (
          <EmptyState
            className="admin-compact-empty"
            icon={FiGitBranch}
            title="Sin ruta activa"
            description="El usuario no tiene una ruta activa devuelta por el backend."
          />
        )}
      </article>

      <article className="admin-panel">
        <div className="section-heading">
          <div>
            <h2>Historial de rutas</h2>
            <span>Rutas archivadas</span>
          </div>
        </div>

        {archivedRoutes.length > 0 ? (
          <div className="admin-modules-list">
            {archivedRoutes.map((historyRoute) => (
              <article
                className="admin-route-heading admin-route-heading--history"
                key={historyRoute.id}
              >
                <div>
                  <h3>{historyRoute.titulo}</h3>
                  <p>
                    Archivada · Creada el{" "}
                    {formatDate(historyRoute.created_at, LONG_DATE_FORMAT)}
                    {historyRoute.desde_cache ? " · Generada desde cache" : ""}
                    {" · "}
                    {historyRoute.modulos_completados}/
                    {historyRoute.total_modulos} módulos completados
                  </p>
                  {(historyRoute.nivel_actual ||
                    historyRoute.tecnologias.length > 0) && (
                    <div className="admin-history-meta">
                      {historyRoute.nivel_actual && (
                        <span className="admin-badge">
                          Nivel{" "}
                          {NIVEL_LABELS[historyRoute.nivel_actual] ||
                            historyRoute.nivel_actual}
                        </span>
                      )}
                      {historyRoute.tecnologias.map((tecnologia) => (
                        <span className="admin-badge" key={tecnologia}>
                          {tecnologia}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <strong>{Math.round(historyRoute.porcentaje)}%</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-inline-notice">
            <FiInfo aria-hidden="true" />
            Este usuario no tiene rutas archivadas todavía.
          </p>
        )}
      </article>
    </section>
  );
}

export default AdminUsuarioDetallePage;
