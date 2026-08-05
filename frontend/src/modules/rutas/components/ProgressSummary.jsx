import {
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiPieChart,
  FiPlayCircle,
} from "react-icons/fi";
import KpiCard from "./KpiCard";
import NextModuleCard from "./NextModuleCard";
import ProgressBar from "./ProgressBar";

function formatHours(value) {
  const hours = Number(value) || 0;
  return Number.isInteger(hours) ? hours : hours.toFixed(1);
}

function ProgressSummary({ summary, nextModule, onOpenModule, warning }) {
  return (
    <section className="route-progress-dashboard" aria-labelledby="route-progress-title">
      <div className="route-progress-dashboard__heading">
        <div>
          <span>Resumen de la ruta</span>
          <h2 id="route-progress-title">Mi progreso</h2>
        </div>
        <p>Tu avance se actualiza cuando cambias el estado de un módulo.</p>
      </div>

      <div className="route-progress-kpis">
        <KpiCard
          icon={FiPieChart}
          value={`${Math.round(summary.porcentaje_avance)}%`}
          label="Porcentaje completado"
          tone="primary"
        />
        <KpiCard
          icon={FiCheckCircle}
          value={summary.modulos_completados}
          label="Módulos completados"
          tone="success"
        />
        <KpiCard
          icon={FiPlayCircle}
          value={summary.modulos_en_progreso}
          label="Módulos en progreso"
          tone="warning"
        />
        <KpiCard
          icon={FiLayers}
          value={summary.modulos_pendientes}
          label="Módulos pendientes"
          tone="muted"
        />
      </div>

      <ProgressBar value={summary.porcentaje_avance} />

      <div
        className={`route-progress-dashboard__details${
          summary.hasDurations
            ? ""
            : " route-progress-dashboard__details--without-hours"
        }`}
      >
        {summary.hasDurations && (
          <div className="route-progress-hours" aria-label="Resumen de horas">
            <div>
              <span>
                <FiCheckCircle aria-hidden="true" />
                Horas completadas (Aprox.)
              </span>
              <strong>{formatHours(summary.horas_completadas)} h</strong>
            </div>
            <div>
              <span>
                <FiClock aria-hidden="true" />
                Horas restantes (Aprox.)
              </span>
              <strong>{formatHours(summary.horas_restantes)} h</strong>
            </div>
            <div>
              <span>
                <FiLayers aria-hidden="true" />
                Horas totales (Aprox.)
              </span>
              <strong>{formatHours(summary.horas_totales)} h</strong>
            </div>
          </div>
        )}

        <NextModuleCard
          module={nextModule}
          onOpen={onOpenModule}
          hasModules={summary.total_modulos > 0}
        />
      </div>
    </section>
  );
}

export default ProgressSummary;
