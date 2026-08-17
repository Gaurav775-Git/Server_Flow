import { nodeTypes } from "../../utils/nodeTypes";
import logo from "../../../assets/logo.png";

const categoryMeta = {
  HTTP: { label: "HTTP Trigger", dot: "bg-emerald-400" },
  DATABASE: { label: "Database", dot: "bg-sky-400" },
  AUTH: { label: "Authentication", dot: "bg-amber-400" },
};

const NodeChip = ({ node }) => (
  <span
    draggable
    onDragStart={(event) => {
      event.dataTransfer.setData("application/reactflow", JSON.stringify(node));
      event.dataTransfer.effectAllowed = "move";
    }}
    className="group flex items-center justify-center rounded-lg border border-gray-700/80 bg-gray-800/60 px-3 py-2.5 text-sm font-medium text-gray-200 cursor-grab select-none transition-all hover:border-gray-600 hover:bg-gray-800 hover:text-white active:cursor-grabbing active:scale-[0.97]"
  >
    {node.label}
  </span>
);

const NodeSection = ({ title, dot, nodes }) => {
  if (!nodes.length) return null
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {nodes.map((node) => (
          <NodeChip key={node.type} node={node} />
        ))}
      </div>
    </div>
  )
}

const Sidebar = () => {
  const httpNodes = nodeTypes.filter((node) => node.category === "HTTP");
  const databaseNodes = nodeTypes.filter((node) => node.category === "DATABASE");
  const authNodes = nodeTypes.filter((node) => node.category === "AUTH");

  return (
    <section className="flex h-screen w-80 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex items-center gap-2.5 border-b border-gray-800 px-5 py-5">
        <img src={logo} alt="ServerFlow logo" className="h-8 w-8 rounded-lg object-cover" />
        <h2 className="text-[15px] font-semibold tracking-tight text-white">
          ServerFlow
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <NodeSection title={categoryMeta.HTTP.label} dot={categoryMeta.HTTP.dot} nodes={httpNodes} />
        <NodeSection title={categoryMeta.DATABASE.label} dot={categoryMeta.DATABASE.dot} nodes={databaseNodes} />
        <NodeSection title={categoryMeta.AUTH.label} dot={categoryMeta.AUTH.dot} nodes={authNodes} />
      </div>

      <div className="border-t border-gray-800 px-5 py-3">
        <p className="text-[11px] text-gray-500">Drag a node onto the canvas</p>
      </div>
    </section>
  );
};

export default Sidebar;