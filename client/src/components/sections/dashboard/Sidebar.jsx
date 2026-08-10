import { nodeTypes } from "../../utils/nodeTypes";

const Sidebar = () => {
  const httpNodes = nodeTypes.filter((node) => node.category === "HTTP");
  const databaseNodes = nodeTypes.filter(
    (node) => node.category === "DATABASE",
  );
  const authNodes = nodeTypes.filter((node) => node.category === "AUTH");

  return (
    <section className="w-84 h-screen border-r border-gray-700 bg-gray-900 p-4">
      <h2 className="text-2xl font-semibold text-white m-6 border-b border-gray-700">
        ServerFlow
      </h2>
      {/* HTTP */}
      <div className="mb-6">
        <h3 className="font-medium text-xl text-white m-6 border-b border-gray-700">HTTP Trigger</h3>
        <div className="grid grid-cols-2 gap-2">
          {httpNodes.map((node) => (
            <span
              key={node.type}
              className="p-3 w-22 m-2 rounded-md bg-gray-800 text-white cursor-grab hover:bg-gray-700"
            >
              {node.label}
            </span>
          ))}
        </div>
      </div>
      {/* Database */}
      <div className="mb-6">
        <h3 className="font-medium text-xl text-white m-6 border-b border-gray-700">Database</h3>
        <div className="grid grid-cols-2 gap-2">
          {databaseNodes.map((node) => (
            <span
              key={node.type}
              className="p-3 w-26 m-2 rounded-md bg-gray-800 text-white cursor-grab hover:bg-gray-700"
            >
              {node.label}
            </span>
          ))}
        </div>
      </div>
      {/* Auth */}
      <div className="mb-6">
        <h3 className="font-medium text-xl text-white m-6 border-b border-gray-700">Authentication</h3>
        <div className="grid grid-cols-2 gap-2">
          {authNodes.map((node) => (
            <span
              key={node.type}
              className="p-3 w-16 m-2 rounded-md bg-gray-800 text-white cursor-grab hover:bg-gray-700"
            >
              {node.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Sidebar;
