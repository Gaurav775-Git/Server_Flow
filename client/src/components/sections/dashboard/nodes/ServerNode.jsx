import { Handle, Position } from "@xyflow/react";

const ServerNodes = ({ data }) => {
  return (
    <div>
      {/* target handle */}
      <Handle type="target" position={Position.Left} />

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
