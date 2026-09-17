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
import NodeConfigForm from "./ConfigForms/NodeConfigForm";
import { useCallback, useEffect, useState } from "react";

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

  const handleConfigClose = () => {
    setShowConfig(false);
    setSelectedNode(null);
  };

  const renderConfigForm = () => selectedNode && (
    <NodeConfigForm node={selectedNode} onSave={handleConfigSave} onClose={handleConfigClose} />
  );

  const openConfig = (node) => {
    setSelectedNode(node);
    setShowConfig(true);
  };

  const deleteNode = (nodeId) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const duplicateNode = (node) => {
    const duplicate = {
      ...node,
      id: crypto.randomUUID(),
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { ...node.data },
    };
    duplicate.data.onConfigure = () => openConfig(duplicate);
    duplicate.data.onDelete = () => deleteNode(duplicate.id);
    duplicate.data.onDuplicate = () => duplicateNode(duplicate);
    setNodes((current) => [...current, duplicate]);
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
        kind: node.kind,
        type: node.type,
        label: node.label,
        category: node.category,
        description: node.description,
        configured: node.configured,
        config: { ...node.config },
        onConfigure: () => openConfig(newNode),
        onDelete: () => deleteNode(newNode.id),
        onDuplicate: () => duplicateNode(newNode),
      },
    };
    setNodes((nodes) => [...nodes, newNode]);
    openConfig(newNode);
  };

  const generateMasterJson = useCallback(() => {
    const MasterJson = {
      project: {
        name: "ServerFlow Project",
        type: "backend_application",
        runtime: "node",
        language: "javascript",
        framework: "express",
        package_manager: "npm",
      },

      generation: {
        goal: "Generate a complete runnable backend project from the ServerFlow graph.",
        output: "complete_project",
        generate_files: true,
        include_package_json: true,
        include_env_example: true,
        include_readme: true,
      },

      instructions: {
        primary_instruction:
          "Generate the backend application described by the ServerFlow graph. The graph, node configurations, and connection relationships are the source of truth.",

        rules: [
          "Generate the actual project files instead of only explaining or describing the solution.",
          "Follow the nodes and connections exactly.",
          "Every configured node must be represented in the generated application.",
          "Every connection must be reflected in the generated application logic.",
          "Use node configuration as the source of truth.",
          "Do not invent APIs, databases, authentication systems, features, or requirements that are not represented in the graph.",
          "Do not hallucinate credentials, secrets, database URLs, API keys, or user-specific requirements.",
          "Use environment variables for secrets and external service credentials.",
          "Use conventional implementation details when they are not explicitly specified.",
          "Keep the generated code modular and maintainable.",
          "Generate all required imports and dependencies.",
          "Generate a valid package.json containing all required dependencies.",
          "Ensure all generated files work together as one runnable project.",
          "Do not return a tutorial or explanation instead of generating the project.",
        ],
      },
      configuration_policy: {
        missing_configuration: {
          behavior: "use_safe_defaults_when_possible",
          rule: "Do not invent user-specific requirements when configuration is missing.",
        },

        unknown_configuration: {
          behavior: "do_not_invent",
          rule: "Do not guess values that affect application behavior or user requirements.",
        },

        secrets: {
          behavior: "use_environment_variables",
          rule: "Never hardcode passwords, API keys, tokens, or database credentials.",
        },

        database_credentials: {
          behavior: "environment_variables",
          rule: "Database connection credentials must be loaded from environment variables.",
        },
      },

      nodes: nodes.map((node) => ({
        id: node.id,
        kind: node.data.kind,
        category: node.data.category,
        operation: node.data.config?.method || node.data.config?.runtime || node.data.config?.provider || node.data.type,
        purpose: node.data.description || `Configure ${node.data.label} for the generated application.`,
        configuration: node.data.config || {},
        generation_rules: [
          `Implement the ${node.data.label} node using its configured values.`,
          "Use configuration as the source of truth and represent this node in the generated project.",
          "Use environment variables for credentials, tokens, and external service secrets.",
          "Connect this component according to its graph relationships.",
        ],
      })),

      connections: edges.map((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);

        let relationship = "connected_to";

        let meaning =
          "The source component is connected to the target component.";

        let generation_rule =
          "Reflect this connection in the generated application.";

        if (sourceNode && targetNode) {
          if (sourceNode.data.kind === "client") relationship = "requests";
          if (sourceNode.data.kind === "loadbalancer" && targetNode.data.kind === "server") relationship = "routes_to";
          if (sourceNode.data.kind === "rate_limiter") relationship = "rate_limits";
          if (targetNode.data.kind === "rate_limiter") relationship = "rate_limited_by";
          if (targetNode.data.category === "DATA") relationship = "stores_in";
          if (targetNode.data.category === "SECURITY" && targetNode.data.kind === "auth") relationship = "protected_by";
          if (targetNode.data.category === "MESSAGING") relationship = "publishes_to";
          meaning =
            `The ${sourceNode.data.label} component uses or communicates with the ${targetNode.data.label} component.`;
          generation_rule =
            `Generate the ${relationship} relationship between these components.`;
        }
        return {
          source: edge.source,
          target: edge.target,
          relationship,
          meaning,
          generation_rule,
        };
      }),
      expected_output: {
        type: "complete_project",

        requirements: [
          "Generate all required source files.",
          "Generate package.json.",
          "Generate .env.example when environment variables are required.",
          "Create the Express application entry point.",
          "Create required routes, database layers, authentication middleware, and supporting modules based on the graph.",
          "Ensure all modules are correctly imported and connected.",
          "Ensure the project can be installed with npm install.",
          "Ensure the project can be started using the generated package.json scripts.",
        ],
      },
    };

    console.log("masterjson :", JSON.stringify(MasterJson, null, 2));
    return MasterJson;
  }, [nodes, edges]);

  useEffect(() => {
    const handleGenerateMasterJson = () => {
      const masterJson = generateMasterJson();
      window.dispatchEvent(
        new CustomEvent("master-json-generated", { detail: masterJson }),
      );
    };

    window.addEventListener("generate-master-json", handleGenerateMasterJson);
    return () =>
      window.removeEventListener(
        "generate-master-json",
        handleGenerateMasterJson,
      );
  }, [generateMasterJson]);

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
      {/* <button
        onClick={generateMasterJson}
        className="absolute bottom-5 right-5 z-30 rounded-lg bg-cyan-500 px-4 py-2 text-black"
      >
        generate code
      </button> */}
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
