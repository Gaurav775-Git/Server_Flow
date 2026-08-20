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
        kind: node.kind,
        type: node.type,
        label: node.label,
        category: node.category,
        configured: false,
        config: {},
      },
    };
    const needsConfig = node.category === "HTTP" || node.category === "DATABASE";
    setNodes((nodes) => [...nodes, newNode]);
    if (needsConfig) {
      setSelectedNode(newNode);
      setShowConfig(true);
    }
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

      nodes: nodes.map((node) => {
        if (node.data.category === "HTTP") {
          return {
            id: node.id,
            kind: node.data.kind,
            category: node.data.category,
            operation: node.data.type,
            purpose: `Handle ${node.data.type} Http Request `,
            configuration: node.data.config,
            generation_rules: [
              "Create an Express route for this HTTP operation.",
              "Use the configured endpoint exactly.",
              "Use the HTTP method specified by the operation.",
              "Use the configured description to understand the intended purpose of the endpoint.",
              "Connect this route to services represented by its outgoing connections.",
              "Return an appropriate HTTP response.",
            ],
          };
        }

        if (node.data.category === "DATABASE") {
          return {
            id: node.id,
            kind: node.data.kind,
            category: node.data.category,
            operation: node.data.type,
            purpose: `Provide ${node.data.type} database access for connected server application `,
            configuration: node.data.config,
            generation_rules: [
              `Use ${node.data.type} as the database technology.`,
              "Create the required database connection layer.",
              "Load database credentials from environment variables.",
              "Do not hardcode database credentials.",
              "Provide database access to connected application components.",
              "Create models or database access logic when required by the configuration.",
            ],
          };
        }
        if (node.data.category === "AUTH") {
          return {
            id: node.id,

            kind: "authentication",

            category: "AUTH",

            operation: node.data.type,

            purpose: `Provide ${node.data.type} authentication functionality for connected routes.`,

            configuration: node.data.config,

            generation_rules: [
              "Implement the configured authentication mechanism.",
              "Protect HTTP routes connected to this authentication node.",
              "Use authentication middleware where required.",
              "Never hardcode authentication secrets.",
              "Load authentication secrets from environment variables.",
            ],
          };
        }
      }),

      connections: edges.map((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);

        let relationship = "connected_to";

        let meaning =
          "The source component is connected to the target component.";

        let generation_rule =
          "Reflect this connection in the generated application.";

        if (
          sourceNode.data.category === "HTTP" &&
          targetNode.data.category === "DATABASE"
        ) {
          relationship = "uses_database";
          meaning =
            "The HTTP route uses the connected database to perform its required data operations.";

          generation_rule =
            "Connect the HTTP route to the database access layer represented by the target node.";
        }
        if (
          sourceNode?.data.category === "HTTP" &&
          targetNode?.data.category === "AUTH"
        ) {
          relationship = "protected_by";
          meaning =
            "The HTTP route requires authentication before its request handler can execute.";

          generation_rule =
            "Apply the authentication middleware represented by the target node to the HTTP route.";
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
