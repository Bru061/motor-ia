import { FiCheckCircle } from "react-icons/fi";

const STATUS_LABELS = {
  completado: "Completado",
  en_progreso: "En progreso",
  pendiente: "Pendiente",
};

/**
 * Visualización tipo "camino" del avance del estudiante a través de su
 * ruta: un nodo por módulo, en orden, coloreado según su estado. Pensada
 * como una alternativa más vistosa/compacta a la lista completa de
 * módulos para transmitir de un vistazo "qué tan avanzada" va la ruta.
 */
function RouteProgressPath({ modules }) {
  if (!modules.length) {
    return null;
  }

  return (
    <div className="route-progress-path" role="img" aria-label="Avance de la ruta por módulo, en orden">
      {modules.map((module, index) => {
        const isLast = index === modules.length - 1;
        const nextIsReached = !isLast && module.estado === "completado";

        return (
          <div className="route-progress-path__step" key={module.id}>
            <span
              className={`route-progress-path__dot route-progress-path__dot--${module.estado}`}
              title={`${module.orden}. ${module.titulo} — ${STATUS_LABELS[module.estado] || module.estado}`}
            >
              {module.estado === "completado" ? (
                <FiCheckCircle aria-hidden="true" />
              ) : (
                module.orden
              )}
            </span>

            {!isLast && (
              <span
                className={
                  nextIsReached
                    ? "route-progress-path__line route-progress-path__line--done"
                    : "route-progress-path__line"
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default RouteProgressPath;