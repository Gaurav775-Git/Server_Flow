import PlatformDiagram from "./PlatformDiagram";
import PlatformContent from "./PlatformContent";

const PlatformSection = () => {
  return (
    <section className="w-full bg-[#000000] px-6 py-24">

      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">

        {/* Left Side */}
        <PlatformDiagram />

        {/* Right Side */}
        <PlatformContent />

      </div>

    </section>
  );
};

export default PlatformSection;