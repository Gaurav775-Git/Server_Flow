import { Handle, Position } from "@xyflow/react";
import {
  Webhook,
  Check,
  X,
  Copy,
  Settings,
  Globe,
  Server,
  Database,
  Shield,
  Activity,
  Mail,
} from "lucide-react";

const CATEGORY_ACCENT = {
  TRAFFIC: "#60a5fa",
  COMPUTE: "#34d399",
  DATA: "#a78bfa",
  SECURITY: "#f87171",
  OBSERVABILITY: "#fbbf24",
  MESSAGING: "#22d3ee",
  HTTP: "#34d399",
  DATABASE: "#a78bfa",
  AUTH: "#f87171",
  RESPONSE: "#60a5fa",
  LOGIC: "#fbbf24",
};

const CATEGORY_ICON = {
  TRAFFIC: Globe,
  COMPUTE: Server,
  DATA: Database,
  SECURITY: Shield,
  OBSERVABILITY: Activity,
  MESSAGING: Mail,
  HTTP: Webhook,
  DATABASE: Database,
  AUTH: Shield,
  RESPONSE: Server,
  LOGIC: Activity,
};

const ServerNodes = ({ data, selected }) => {
  const isConfigured = data.configured;
  const accent = CATEGORY_ACCENT[data.category] || "#94a3b8";
  const Icon = CATEGORY_ICON[data.category] || Webhook;
  const configEntries = Object.entries(data.config || {})
    .filter(([key, value]) => value !== "" && key !== "description")
    .slice(0, 2);

  return (
      <div
        className={`group relative w-[240px] overflow-hidden rounded-lg border bg-[#0d1117] text-white transition-all duration-200 ${
          selected
            ? "border-white/40"
            : "border-[#1e2633] hover:border-[#2a3441]"
        }`}
      >
        <div
          className="absolute bottom-0 left-0 top-0 z-10 w-[3px]"
          style={{ backgroundColor: accent }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          aria-label={`Connect into ${data.label}`}
          className="!h-4 !w-4 !border-2 !border-[#0d1117] !bg-white/50 !transition-all hover:!scale-125 hover:!bg-white"
          style={{ boxShadow: `0 0 0 1px ${accent}55` }}
        />
        <div className="flex items-center gap-2 border-b border-[#1e2633] py-2.5 pl-4 pr-3">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-white/30">
              {data.category}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium leading-tight text-white/90">
              {data.label}
            </p>
          </div>
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: isConfigured ? "#34d399" : "#f87171" }}
          />
        </div>
        <div className="space-y-1.5 px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">
              op
            </span>
            <span className="truncate font-mono text-[10px] text-white/70">
              {data.type}
            </span>
          </div>
          {configEntries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="truncate font-mono text-[10px] uppercase tracking-wider text-white/30">
                {key.replaceAll("_", " ")}
              </span>
              <span className="max-w-[120px] truncate font-mono text-[10px] text-white/70">
                {String(value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">
              config
            </span>
            <span
              className={`flex items-center gap-1 font-mono text-[10px] ${
                isConfigured ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isConfigured ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {isConfigured ? "ready" : "pending"}
            </span>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 border-t border-[#1e2633] px-3 py-2 transition-opacity duration-150 ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={() => data.onConfigure?.()}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white/90"
            title="Configure"
          >
            <Settings className="h-3 w-3" />
            Configure
          </button>
          <button
            type="button"
            onClick={() => data.onDuplicate?.()}
            className="rounded-md bg-white/5 p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            title="Duplicate"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => data.onDelete?.()}
            className="rounded-md bg-rose-500/10 p-1.5 text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
            title="Delete"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          aria-label={`Connect from ${data.label}`}
          className="!h-4 !w-4 !border-2 !border-[#0d1117] !bg-white/50 !transition-all hover:!scale-125 hover:!bg-white"
          style={{ boxShadow: `0 0 0 1px ${accent}55` }}
        />
      </div>
  );
};

export default ServerNodes;
