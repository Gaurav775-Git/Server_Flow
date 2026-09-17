import { categoryMeta, nodeTypes } from "../../utils/nodeTypes";
import logo from "../../../assets/logo.png";
import { useState } from "react";
import { Box } from "lucide-react";


const NodeChip = ({ node }) => (
  <span
    draggable
    onDragStart={(event) => {
      event.dataTransfer.setData("application/reactflow", JSON.stringify(node));
      event.dataTransfer.effectAllowed = "move";
    }}
    className="group flex min-h-16 flex-col items-start justify-center rounded-lg border border-gray-700/80 bg-gray-800/60 px-3 py-2 cursor-grab select-none transition-all hover:border-gray-600 hover:bg-gray-800 hover:text-white active:cursor-grabbing active:scale-[0.97]"
  >
    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-200">
      <Box className="h-3.5 w-3.5 text-gray-500" />
      {node.label}
    </span>
    <span className="mt-1 text-[10px] leading-tight text-gray-500">
      {node.description}
    </span>
  </span>
);

const NodeSection = ({ title, dot, nodes }) => {
  const [isOpen, setIsOpen] = useState(true);
  if (!nodes.length) return null;

  return (
    <div className="mb-7">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="mb-3 flex w-full items-center gap-2 px-1 text-left"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <h3 className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </h3>
        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-500">
          {nodes.length}
        </span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 gap-2">
          {nodes.map((node) => (
            <NodeChip key={`${node.kind}-${node.label}`} node={node} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const categories = Object.keys(categoryMeta);

  return (
    <section className="flex h-screen w-80 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex items-center gap-2.5 border-b border-gray-800 px-5 py-5">
        <img
          src={logo}
          alt="ServerFlow logo"
          className="h-8 w-8 rounded-lg object-cover"
        />
        <h2 className="text-[15px] font-semibold tracking-tight text-white">
          ServerFlow
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categories.map((category) => (
          <NodeSection
            key={category}
            title={categoryMeta[category].label}
            dot={categoryMeta[category].dot}
            nodes={nodeTypes.filter((node) => node.category === category)}
          />
        ))}
      </div>

      <div className="border-t border-gray-800 px-5 py-3">
        <p className="text-[11px] text-gray-500">Drag a node onto the canvas</p>
      </div>
    </section>
  );
};

export default Sidebar;