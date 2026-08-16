import { Cloud, Database, Server } from "lucide-react";

const PlatformDiagram = () => {
  return (
    <div className="relative">

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-cyan-400/10 blur-3xl" />

      {/* Diagram Container */}
      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0b1118]/80 p-5">

        {/* Inner Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(0,200,255,0.12),transparent_55%)]" />

        {/* Diagram Content */}
        <div className="relative">

          {/* Agent Infrastructure */}
          <div className="rounded-lg border border-lime-400/20 bg-lime-400/10 px-6 py-6 text-center">
            <p className="text-xs font-bold tracking-wider text-lime-400">
              ⚡ AGENT INFRASTRUCTURE
            </p>
          </div>

          {/* Application Layer */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-6 py-5">
            <span className="text-[10px] font-bold tracking-wider text-cyan-400">
              ▣ WEB APP
            </span>

            <span className="text-[10px] font-bold tracking-wider text-cyan-400">
              GEN AI APP
            </span>
          </div>

          {/* ServerFlow Engine */}
          <div className="mt-24 rounded-lg border border-cyan-400 bg-white/15 px-6 py-14 text-center">
            <h3 className="text-lg font-bold text-white">
              SERVERFLOW ENGINE
            </h3>

            <p className="mt-2 text-[8px] font-bold tracking-[0.35em] text-gray-400">
              CORE EXECUTION LAYER
            </p>
          </div>

          {/* Connectors and API Gateway */}
          <div className="mt-4 grid grid-cols-2 gap-4">

            <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-5 text-center">
              <p className="text-[10px] font-bold tracking-wider text-yellow-400">
                CONNECTORS
              </p>
            </div>

            <div className="rounded-lg border border-purple-400/20 bg-purple-400/5 px-4 py-5 text-center">
              <p className="text-[10px] font-bold tracking-wider text-purple-300">
                API GATEWAY
              </p>
            </div>

          </div>

          {/* Infrastructure Layer */}
          <div className="mt-4 flex items-center justify-center gap-10 rounded-lg border border-white/5 bg-white/[0.02] py-5 text-gray-500">
            <Cloud size={18} />
            <Database size={18} />
            <Server size={18} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlatformDiagram;