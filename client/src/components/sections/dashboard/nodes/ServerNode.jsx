import { Handle, Position } from "@xyflow/react";
import { Webhook, X, Check, Copy, Settings } from "lucide-react";

const categoryColors = {
  TRAFFIC: "from-cyan-400 to-sky-400",
  COMPUTE: "from-violet-400 to-fuchsia-400",
  DATA: "from-emerald-400 to-teal-400",
  SECURITY: "from-amber-400 to-orange-400",
  OBSERVABILITY: "from-blue-400 to-indigo-400",
  MESSAGING: "from-rose-400 to-pink-400",
};

const ServerNodes = ({ data }) => {
  const isConfigured = data.configured;
  return (
    <div className="relative w-72 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 text-white shadow-[0_18px_45px_rgba(2,6,23,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/70 hover:shadow-[0_20px_50px_rgba(8,145,178,0.18)]">
      {/* top accent */}
      <div className={`h-1 bg-gradient-to-r ${categoryColors[data.category] || categoryColors.TRAFFIC}`} />
      {/* target handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !border-[3px] !border-slate-950 !bg-cyan-300"
      />
      {/* header */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
        {/* icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300 shadow-inner shadow-cyan-300/10">
          <Webhook className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
            {data.category}
          </p>
          <p className="mt-1 truncate text-base font-semibold tracking-tight text-slate-100">
            {data.label}
          </p>
        </div>
      </div>

      {/* content */}

      <div className="space-y-4 px-4 py-4">
        {/* Type */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Operation
          </p>
          <p className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs font-medium text-slate-200">
            {data.type}
          </p>
        </div>

        {/* configuration */}

        {Object.entries(data.config || {}).filter(([key, value]) => value !== "" && key !== "description").slice(0, 2).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3 text-xs">
            <span className="capitalize text-slate-500">{key.replaceAll("_", " ")}</span>
            <span className="max-w-36 truncate font-mono text-slate-300">{String(value)}</span>
          </div>
        ))}

        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
          <span className="text-xs text-slate-400">Configuration</span>

          <span
            className={`flex items-center gap-1.5 text-xs font-medium ${
              isConfigured ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {isConfigured ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {isConfigured ? "Ready" : "Needs setup"}
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => data.onConfigure?.()} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-800 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700" title="Configure">
            <Settings className="h-3.5 w-3.5" /> Configure
          </button>
          <button type="button" onClick={() => data.onDuplicate?.()} className="rounded-lg bg-slate-800 px-2 py-1.5 text-slate-300 hover:bg-slate-700" title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => data.onDelete?.()} className="rounded-lg bg-rose-950/50 px-2 py-1.5 text-rose-300 hover:bg-rose-900/60" title="Delete">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !border-[3px] !border-slate-950 !bg-cyan-300"
      />
    </div>
  );
};

export default ServerNodes;
