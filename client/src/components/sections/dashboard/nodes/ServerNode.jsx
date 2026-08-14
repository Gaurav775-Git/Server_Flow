import { Handle, Position } from "@xyflow/react";
import { Webhook, X, Check } from "lucide-react";

const ServerNodes = ({ data }) => {
  const isConfigured = data.configured;
  return (
    <div className="relative w-65 min-h-35 bg-[#0B0E14]  border border-[#4CD6FB] rounded-md text-white">
      {/* top accent */}
      <div className="h-1 bg-cyan-400/70">
        {/* target handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-[#0B111A] !bg-cyan-400"
        />
        {/* header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          {/* icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
            <Webhook />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {data.category}
            </p>
            <p className="text-base font-semibold">{data.label}</p>
          </div>
        </div>

        {/* content */}

        <div className="space-y-3 px-4 py-4">
          {/* Type */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-500">
              Type
            </p>

            <p className="mt-1 text-sm font-medium text-gray-200">
              {data.type}
            </p>
          </div>

          {/* configuration */}

          <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
            <div className="flex justify-center items-center">
              <span className="text-xs text-gray-400">Configuration</span>

              <span className="flex items-center gap-1">
                {isConfigured ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-500">Configured</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">Configured</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-[#0B111A] !bg-cyan-400"
        />
      </div>
    </div>
  );
};

export default ServerNodes;
