import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
} from "reactflow";
import { FiClock, FiHash } from "react-icons/fi";

const STATUS_LABELS = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

const VALID_STATUSES = new Set(Object.keys(STATUS_LABELS));

const LAYOUT = {
  nodeWidth: 250,
  columnGap: 58,
  rowGap: 188,
  longRouteThreshold: 9,
  shortRouteColumns: 3,
  longRouteColumns: 4,
};

function getModuleStatus(status) {
  return VALID_STATUSES.has(status) ? status : "pendiente";
}

function hasNumericValue(value) {
  return (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

function handleReactFlowError(code, message) {
  if (code !== "002") {
    console.warn(`[React Flow ${code}]: ${message}`);
  }
}

function getOrderedModules(modules) {
  if (!Array.isArray(modules)) {
    return [];
  }

  return modules
    .map((module, originalIndex) => ({ module, originalIndex }))
    .filter(({ module }) => module?.id !== undefined && module?.id !== null)
    .sort((first, second) => {
      const firstOrder = Number(first.module.orden);
      const secondOrder = Number(second.module.orden);
      const firstHasOrder = Number.isFinite(firstOrder);
      const secondHasOrder = Number.isFinite(secondOrder);

      if (firstHasOrder && secondHasOrder && firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      if (firstHasOrder !== secondHasOrder) {
        return firstHasOrder ? -1 : 1;
      }

      return first.originalIndex - second.originalIndex;
    })
    .map(({ module }) => module);
}

function getModulesPerRow(moduleCount) {
  return moduleCount > LAYOUT.longRouteThreshold
    ? LAYOUT.longRouteColumns
    : LAYOUT.shortRouteColumns;
}

function getNodePosition(index, modulesPerRow) {
  const row = Math.floor(index / modulesPerRow);
  const indexInRow = index % modulesPerRow;
  const column =
    row % 2 === 0 ? indexInRow : modulesPerRow - 1 - indexInRow;

  return {
    x: column * (LAYOUT.nodeWidth + LAYOUT.columnGap),
    y: row * LAYOUT.rowGap,
  };
}

function getEdgeHandles(sourcePosition, targetPosition) {
  if (sourcePosition.y !== targetPosition.y) {
    return {
      sourceHandle: "source-vertical",
      targetHandle: "target-vertical",
    };
  }

  if (sourcePosition.x < targetPosition.x) {
    return {
      sourceHandle: "source-right",
      targetHandle: "target-left",
    };
  }

  return {
    sourceHandle: "source-left",
    targetHandle: "target-right",
  };
}

function createEdge({ id, source, target, positionsById, secondary = false }) {
  const sourcePosition = positionsById.get(source);
  const targetPosition = positionsById.get(target);

  if (!sourcePosition || !targetPosition) {
    return null;
  }

  return {
    id,
    source,
    target,
    ...getEdgeHandles(sourcePosition, targetPosition),
    type: "smoothstep",
    className: secondary
      ? "route-flow-edge route-flow-edge--secondary"
      : "route-flow-edge route-flow-edge--primary",
    markerEnd: { type: MarkerType.ArrowClosed },
    zIndex: secondary ? 0 : 1,
  };
}

function buildRoadmapElements(modules) {
  const orderedModules = getOrderedModules(modules);
  const modulesPerRow = getModulesPerRow(orderedModules.length);
  const moduleIds = new Set(orderedModules.map((module) => String(module.id)));
  const moduleIndexById = new Map();
  const positionsById = new Map();

  const nodes = orderedModules.map((module, index) => {
    const moduleId = String(module.id);
    const status = getModuleStatus(module.estado);
    const hasEstimatedHours = hasNumericValue(module.tiempo_estimado_hrs);
    const hasOrder = hasNumericValue(module.orden);
    const order = hasOrder ? Number(module.orden) : index + 1;
    const position = getNodePosition(index, modulesPerRow);

    moduleIndexById.set(moduleId, index);
    positionsById.set(moduleId, position);

    return {
      id: moduleId,
      type: "roadmapModule",
      position,
      className: `route-flow-node route-flow-node--${status}`,
      ariaLabel: `Módulo ${order}: ${module.titulo || "Sin título"}`,
      data: {
        module,
        title: module.titulo || "Módulo sin título",
        status,
        statusLabel: STATUS_LABELS[status],
        order,
        estimatedTime: hasEstimatedHours
          ? `${Number(module.tiempo_estimado_hrs)} h`
          : "Sin estimación",
      },
    };
  });

  const primaryRelationships = new Set();
  const primaryEdges = orderedModules.slice(1).map((module, index) => {
    const source = String(orderedModules[index].id);
    const target = String(module.id);

    primaryRelationships.add(`${source}->${target}`);
    return createEdge({
      id: `sequence-${source}-${target}`,
      source,
      target,
      positionsById,
    });
  });

  const secondaryRelationships = new Set();
  const secondaryEdges = [];

  orderedModules.forEach((module) => {
    if (!Array.isArray(module.dependencias)) {
      return;
    }

    module.dependencias.forEach((dependency) => {
      if (
        dependency?.modulo_id === undefined ||
        dependency?.modulo_id === null ||
        dependency?.depende_de_id === undefined ||
        dependency?.depende_de_id === null
      ) {
        return;
      }

      const source = String(dependency.depende_de_id);
      const target = String(dependency.modulo_id);
      const relationship = `${source}->${target}`;
      const sourceIndex = moduleIndexById.get(source);
      const targetIndex = moduleIndexById.get(target);

      if (
        source === target ||
        !moduleIds.has(source) ||
        !moduleIds.has(target) ||
        sourceIndex >= targetIndex ||
        primaryRelationships.has(relationship) ||
        secondaryRelationships.has(relationship)
      ) {
        return;
      }

      const edge = createEdge({
        id: `dependency-${source}-${target}`,
        source,
        target,
        positionsById,
        secondary: true,
      });

      if (edge) {
        secondaryRelationships.add(relationship);
        secondaryEdges.push(edge);
      }
    });
  });

  return {
    nodes,
    edges: [...secondaryEdges, ...primaryEdges].filter(Boolean),
    moduleCount: orderedModules.length,
  };
}

function RoadmapModuleNode({ data }) {
  return (
    <>
      <Handle id="target-left" type="target" position={Position.Left} />
      <Handle id="target-right" type="target" position={Position.Right} />
      <Handle id="target-vertical" type="target" position={Position.Top} />
      <div className="route-flow-node__topline">
        <span>
          <FiHash aria-hidden="true" /> Módulo {data.order}
        </span>
        <span className="route-flow-node__status">{data.statusLabel}</span>
      </div>
      <h3>{data.title}</h3>
      <div className="route-flow-node__meta">
        <span>
          <FiClock aria-hidden="true" /> {data.estimatedTime}
        </span>
      </div>
      <Handle id="source-left" type="source" position={Position.Left} />
      <Handle id="source-right" type="source" position={Position.Right} />
      <Handle id="source-vertical" type="source" position={Position.Bottom} />
    </>
  );
}

const NODE_TYPES = { roadmapModule: RoadmapModuleNode };

function RoadmapFlow({ modules, onModuleClick }) {
  const roadmap = useMemo(() => buildRoadmapElements(modules), [modules]);
  const [nodes, , onNodesChange] = useNodesState(roadmap.nodes);
  const [edges, , onEdgesChange] = useEdgesState(roadmap.edges);
  const handleNodeClick = useCallback(
    (_event, node) => {
      if (typeof onModuleClick === "function") {
        onModuleClick(node.data.module);
      }
    },
    [onModuleClick],
  );

  if (roadmap.moduleCount === 0) {
    return (
      <div className="route-roadmap__empty">
        No hay módulos válidos para construir el roadmap.
      </div>
    );
  }

  return (
    <div className="route-roadmap" aria-label="Roadmap secuencial de aprendizaje">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodesConnectable={false}
        deleteKeyCode={null}
        elementsSelectable
        onError={handleReactFlowError}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.2}
        maxZoom={1.8}
      >
        <Background color="#263650" gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default RoadmapFlow;
