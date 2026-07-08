import { FiArrowRight, FiCheckCircle, FiClock } from "react-icons/fi";

function formatHours(value) {
  const hours = Number(value);
  return Number.isFinite(hours) ? `${hours} h` : "Duración no disponible";
}

function NextModuleCard({ module, onOpen, hasModules }) {
  if (!hasModules) {
    return (
      <article className="route-next-module route-next-module--empty">
        <span className="route-next-module__icon">
          <FiClock aria-hidden="true" />
        </span>
        <div>
          <span>Sin recomendación disponible</span>
          <h3>Esta ruta aún no contiene módulos</h3>
          <p>Regenera la ruta para solicitar una nueva propuesta.</p>
        </div>
      </article>
    );
  }

  if (!module) {
    return (
      <article className="route-next-module route-next-module--complete">
        <span className="route-next-module__icon">
          <FiCheckCircle aria-hidden="true" />
        </span>
        <div>
          <span>Ruta completada</span>
          <h3>No tienes módulos pendientes</h3>
          <p>Completaste todos los módulos de esta ruta.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="route-next-module">
      <div className="route-next-module__content">
        <span>Siguiente módulo recomendado</span>
        <h3>{module.titulo}</h3>
        <p>
          <FiClock aria-hidden="true" />
          {formatHours(module.tiempo_estimado_hrs)}
        </p>
      </div>
      <button type="button" onClick={() => onOpen(module)}>
        Ir al módulo
        <FiArrowRight aria-hidden="true" />
      </button>
    </article>
  );
}

export default NextModuleCard;
