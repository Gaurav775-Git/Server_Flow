import {
  Zap,
  PanelTop,
  Bot,
  Cloud,
  Database,
  Server,
} from "lucide-react";

const PlatformDiagram = () => {
  return (
    <div className="relative z-10 w-full max-w-xl">

      {/* Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />

      {/* Agent Infrastructure */}
      <div className="flex h-16 items-center justify-center rounded-lg border border-lime-400/20 bg-lime-400/5">
        <div className="flex items-center gap-3">
          <Zap
            size={18}
            className="text-lime-400"
          />

          <span className="text-xs font-bold tracking-wide text-lime-400">
            AGENT INFRASTRUCTURE
          </span>
        </div>
      </div>

      {/* Web App / Gen AI */}
      <div className="mt-4 flex h-14 items-center justify-between rounded-lg border border-cyan-400/10 bg-cyan-400/5 px-6">

        {/* Web App */}
        <div className="flex items-center gap-3">
          <PanelTop
            size={14}
            className="text-cyan-400"
          />

          <span className="text-[10px] font-semibold tracking-wider text-cyan-400">
            WEB APP
          </span>
        </div>

        {/* Gen AI App */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold tracking-wider text-cyan-400">
            GEN AI APP
          </span>

          <Bot
            size={14}
            className="text-cyan-400"
          />
        </div>

      </div>

      {/* ServerFlow Engine */}
      <div className="mt-24 flex h-28 items-center justify-center rounded-xl border border-cyan-400/40 bg-zinc-800">

        <div className="text-center">
          <h3 className="text-base font-bold text-zinc-200">
            SERVERFLOW ENGINE
          </h3>

          <p className="mt-2 text-[7px] tracking-[0.35em] text-zinc-500">
            CORE EXECUTION LAYER
          </p>
        </div>

      </div>

      {/* Connectors / API Gateway */}
      <div className="mt-4 grid grid-cols-2 gap-4 px-4">

        {/* Connectors */}
        <div className="flex h-12 items-center justify-center rounded-md border border-yellow-400/10 bg-yellow-400/5">
          <span className="text-[9px] font-bold tracking-wider text-yellow-400">
            CONNECTORS
          </span>
        </div>

        {/* API Gateway */}
        <div className="flex h-12 items-center justify-center rounded-md border border-purple-400/10 bg-purple-400/5">
          <span className="text-[9px] font-bold tracking-wider text-purple-300">
            API GATEWAY
          </span>
        </div>

      </div>

      {/* Infrastructure */}
      <div className="mt-4 flex h-14 items-center justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-900/50">

        <Cloud
          size={18}
          className="text-zinc-600"
        />

        <Database
          size={18}
          className="text-zinc-600"
        />

        <Server
          size={18}
          className="text-zinc-600"
        />

      </div>

    </div>
  );
};

export default PlatformDiagram;