import {
  FiBell,
  FiInfo,
  FiMonitor,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import { formatRole, getUserDisplayName } from "../../utils/user";
import useAuth from "../../hooks/useAuth";

const APP_VERSION = "0.0.0";

function ConfiguracionPage() {
  const { role, user } = useAuth();
  const displayName = getUserDisplayName(user);

  return (
    <section className="settings-page">
      <header className="settings-heading">
        <div>
          <span>Preferencias</span>
          <h1>Configuración</h1>
          <p>
            Ajustes preparados para futuras preferencias de Motor IA. Las
            opciones sin integración activa aparecen deshabilitadas.
          </p>
        </div>
      </header>

      <div className="settings-grid">
        <article className="settings-panel">
          <div className="settings-panel__heading">
            <span>
              <FiSun aria-hidden="true" />
            </span>
            <div>
              <h2>Apariencia</h2>
              <p>Selección de tema de la interfaz.</p>
            </div>
          </div>

          <div className="settings-options" role="group" aria-label="Tema">
            <button type="button" disabled>
              <FiSun aria-hidden="true" />
              <span>Tema claro</span>
              <small>Próximamente</small>
            </button>
            <button type="button" disabled>
              <FiMoon aria-hidden="true" />
              <span>Tema oscuro</span>
              <small>Actual</small>
            </button>
            <button type="button" disabled>
              <FiMonitor aria-hidden="true" />
              <span>Tema del sistema</span>
              <small>Próximamente</small>
            </button>
          </div>
        </article>

        <article className="settings-panel">
          <div className="settings-panel__heading">
            <span>
              <FiBell aria-hidden="true" />
            </span>
            <div>
              <h2>Notificaciones</h2>
              <p>Control de avisos dentro de la aplicación.</p>
            </div>
          </div>

          <label className="settings-toggle settings-toggle--disabled">
            <input type="checkbox" disabled />
            <span aria-hidden="true" />
            <div>
              <strong>Activar notificaciones</strong>
              <small>Próximamente</small>
            </div>
          </label>
        </article>

        <article className="settings-panel settings-panel--wide">
          <div className="settings-panel__heading">
            <span>
              <FiInfo aria-hidden="true" />
            </span>
            <div>
              <h2>Información</h2>
              <p>Datos generales de la aplicación y la sesión actual.</p>
            </div>
          </div>

          <dl className="settings-info">
            <div>
              <dt>Aplicación</dt>
              <dd>Motor IA</dd>
            </div>
            <div>
              <dt>Versión</dt>
              <dd>{APP_VERSION}</dd>
            </div>
            <div>
              <dt>Usuario</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{formatRole(role)}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}

export default ConfiguracionPage;
