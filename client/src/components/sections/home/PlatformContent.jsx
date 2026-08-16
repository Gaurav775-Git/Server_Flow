import PlatformFeatureItem from "./PlatformFeatureItem";

const PlatformContent = () => {
  return (
    <div>
      {/* Section Label */}
      <p className="text-[10px] font-bold tracking-[0.35em] text-cyan-400">
        PLATFORM
      </p>

      {/* Section Heading */}
      <h2 className="mt-5 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl">
        The visual backend platform for engineers
      </h2>

      {/* Feature List */}
      <div className="mt-8 space-y-7">

        <PlatformFeatureItem
          title="Design backend flows visually"
          description="Drag, drop, connect, and generate working server code automatically with enterprise precision."
        />

        <PlatformFeatureItem
          title="Production-ready instantly"
          description="Generate optimized code and deploy from a single intuitive interface that mirrors your cloud stack."
        />

        <PlatformFeatureItem
          title="Full cloud control"
          description="Deploy directly to your cloud account with full control over data residency, compliance, and VPC."
        />

      </div>

      {/* CTA Button */}
      <button className="mt-10 rounded-lg border border-cyan-400 px-6 py-3 text-xs font-bold tracking-wider text-cyan-400 transition hover:bg-cyan-400 hover:text-black">
        EXPLORE THE PLATFORM
      </button>
    </div>
  );
};

export default PlatformContent;