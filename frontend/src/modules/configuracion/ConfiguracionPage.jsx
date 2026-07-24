import { FiMoon, FiSun } from "react-icons/fi";
import useTheme from "../../hooks/useTheme";

function ConfiguracionPage() {
  const { theme, setLightTheme, setDarkTheme } = useTheme();

  return (
    <section className="settings-page">
      <header className="page-title">
        <div>
          <span>Preferencias</span>
          <h1>Configuración</h1>
          <p>Elige cómo se ve Motor IA para ti.</p>
        </div>
      </header>

      <div className="settings-grid">
        <article className="settings-panel settings-panel--wide">
          <div className="settings-panel__heading">
            <span>
              <FiSun aria-hidden="true" />
            </span>
            <div>
              <h2>Apariencia</h2>
              <p>Selecciona el tema de la interfaz.</p>
            </div>
          </div>

          <div className="settings-options" role="group" aria-label="Tema">
            <button
              type="button"
              className={theme === "light" ? "is-active" : ""}
              aria-pressed={theme === "light"}
              onClick={setLightTheme}
            >
              <FiSun aria-hidden="true" />
              <span>Tema claro</span>
              <small>{theme === "light" ? "Actual" : ""}</small>
            </button>
            <button
              type="button"
              className={theme === "dark" ? "is-active" : ""}
              aria-pressed={theme === "dark"}
              onClick={setDarkTheme}
            >
              <FiMoon aria-hidden="true" />
              <span>Tema oscuro</span>
              <small>{theme === "dark" ? "Actual" : ""}</small>
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ConfiguracionPage;
