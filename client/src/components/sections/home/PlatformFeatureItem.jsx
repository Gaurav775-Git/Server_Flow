import { Check } from "lucide-react";

const PlatformFeatureItem = ({ title, description }) => {
  return (
    <div className="flex gap-4">

      {/* Check Icon */}
      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
        <Check size={12} className="text-cyan-400" />
      </div>

      {/* Feature Content */}
      <div>
        <h3 className="text-sm font-bold text-white">
          {title}
        </h3>

        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400">
          {description}
        </p>
      </div>

    </div>
  );
};

export default PlatformFeatureItem;