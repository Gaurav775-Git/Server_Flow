import { ArrowRight } from "lucide-react";
import PlatformDiagram from "./PlatformDiagram";
import PlatformFeatures from "./PlatformFeatures";

const PlatformSection = () => {
  return (
    <section className="w-full bg-[#080b10] px-6 py-24">

      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">

        {/* Left Side */}
        <PlatformDiagram />

        {/* Right Side */}
        <div>

          {/* Small Label */}
          <p className="text-[10px] font-bold tracking-[0.35em] text-cyan-400">
            PLATFORM
          </p>

          {/* Heading */}
          <h2 className="mt-5 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl">
            The visual backend platform for engineers
          </h2>

          {/* Features */}
          <PlatformFeatures />

          {/* CTA Button */}
          <button className="mt-10 flex items-center gap-3 rounded-lg border border-cyan-400 px-6 py-3 text-xs font-bold tracking-wider text-cyan-400 transition hover:bg-cyan-400 hover:text-black">
            EXPLORE THE PLATFORM

            <ArrowRight size={15} />
          </button>

        </div>

      </div>

    </section>
  );
};

export default PlatformSection;