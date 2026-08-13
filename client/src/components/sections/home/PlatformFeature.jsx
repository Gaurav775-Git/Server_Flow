import { Check } from "lucide-react";

const PlatformFeature = ({ title, description }) => {
  return (
    <div className="flex gap-4">
      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
        <Check size={12} className="text-cyan-400" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
};

export default PlatformFeature;