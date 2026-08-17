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
import DatabaseForm from "./ConfigForms/DatabaseForm";
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
    if (selectedNode.data.category === "DATABASE") {
      return <DatabaseForm node={selectedNode} onSave={handleConfigSave} />;
    }
    return null;
  };

  const onConnect = (connection) => {
    console.log("connection :", connection);
    setEdges((edges) => addEdge(connection, edges));
  };
  const onDropEvent = (event) => {
    if (showConfig) {
      return;
    }
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

  const generateMasterJson = () => {
    const MasterJson = {
      project: {
        name: "Generated Server",
        version: "1.0",
      },

      nodes: nodes.map((node) => ({
        id: node.id,
        category: node.data.category,
        type: node.data.type,
        configuration: node.data.config,
      })),

      connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };
    console.log("masterjson :", JSON.stringify(MasterJson, null, 2));
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
        onDragOver={(event) => {
          if (!showConfig) {
            event.preventDefault();
          }
        }}
        onDrop={onDropEvent}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {showConfig && <div className="absolute inset-0 z-40 bg-black/20" />}
      {showConfig && renderConfigForm()}
      <button
        onClick={generateMasterJson}
        className="absolute bottom-5 right-5 z-30 rounded-lg bg-cyan-500 px-4 py-2 text-black"
      >
        generate code
      </button>
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
