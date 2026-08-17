import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from "@xyflow/react";
import { CustomNode } from "../../utils/ReactFlowCustomNodes";
import HttpForm from "./ConfigForms/HttpForm";
import { useState } from "react";

const initialNodes = [];

const initialEdges = [];

const FlowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { screenToFlowPosition } = useReactFlow();

  const [selectedNode, setSelectedNode] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigSave = (config) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                configured: true,
                config: config,
              },
            }
          : node,
      ),
    );
    setShowConfig(false);
  };

  const renderConfigForm = () => {
    if (!selectedNode) {
      return null;
    }
    if (selectedNode.data.category === "HTTP") {
      return <HttpForm node={selectedNode} onSave={handleConfigSave} />;
    }
    return null;
  };

  const onConnect = (connection) => {
    console.log("connection :", connection);
    setEdges((edges) => addEdge(connection, edges));
  };
  const onDropEvent = (event) => {
    const data = event.dataTransfer.getData("application/reactflow");

    if (!data) {
      return;
    }
    const node = JSON.parse(data);
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode = {
      id: crypto.randomUUID(),
      type: "serverNode",
      position,
      data: {
        type: node.type,
        label: node.label,
        category: node.category,
        configured: false,
        config: {},
      },
    };
    console.log(newNode);
    setNodes((nodes) => [...nodes, newNode]);
    setSelectedNode(newNode);
    setShowConfig(true);
  };

  return (
    <div className=" relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={CustomNode}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDropEvent}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {showConfig && renderConfigForm()}
    </div>
  );
};

const Canvas = () => {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
};

export default Canvas;
