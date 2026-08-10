import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";

const initialNodes = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: {
      label: "API",
    },
  },
  {
    id: "2",
    position: { x: 400, y: 100 },
    data: {
      label: "DATABASE",
    },
  },
];

const initialEdges = [];

const Canvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgeChange] = useEdgesState(initialEdges);

  const onConnect = (connection) => {
    setEdges((edges) => addEdge(connection, edges));
  };

  return (
    <ReactFlowProvider>
      <div className="w-full h-screen">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgeChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default Canvas;
