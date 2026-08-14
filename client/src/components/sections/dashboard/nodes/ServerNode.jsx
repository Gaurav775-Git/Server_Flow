import { Handle, Position } from "@xyflow/react";

const ServerNodes = ({ data }) => {
  const isconfigured = data.configured;
  return (
    <div className="relative w-65 h-35 bg-[#0B0E14]  border border-[#4CD6FB] rounded-md text-white">
      {/* target handle */}
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-[#0B111A] !bg-cyan-400"/>
      <div className=""></div>
      <div>
        <h3>{data.category}</h3>
      </div>

      <div>
        <h3>{data.label}</h3>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default ServerNodes;
