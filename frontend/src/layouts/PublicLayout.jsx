import { Outlet } from "react-router-dom";
import { FiBookOpen, FiCode, FiCpu, FiEdit3, FiMap, FiZap } from "react-icons/fi";
import "../styles/Layout.css";

function PublicLayout() {
  return (
    <main className="public-layout">
      <section className="public-hero" aria-label="Motor IA">
        <FiBookOpen className="public-hero__icon public-hero__icon--top" />
        <FiEdit3 className="public-hero__icon public-hero__icon--right" />
        <FiCpu className="public-hero__icon public-hero__icon--bottom" />
        <FiZap className="public-hero__icon public-hero__icon--left" />

        <div className="public-hero__content">
          <div className="brand-mark">
            <FiMap />
            <span>Motor IA</span>
          </div>

          <h1>Motor de Personalización de Rutas de Aprendizaje con IA</h1>
          <p>
            Descubre tu camino óptimo. Nuestra inteligencia artificial analiza
            tus habilidades y construye un roadmap personalizado para que
            alcances tus metas como desarrollador en tiempo récord.
          </p>
        </div>

        <FiCode className="public-hero__icon public-hero__icon--code" />
      </section>

      <section className="public-auth">
        <div className="public-card">
          <Outlet />
        </div>
      </section>
    </main>
  );
}

export default PublicLayout;
