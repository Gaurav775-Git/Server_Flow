import PlatformFeature from "./PlatformFeature";

const features = [
  {
    title: "Design backend flows visually",
    description:
      "Drag, drop, connect, and generate working server code automatically with enterprise precision.",
  },
  {
    title: "Production-ready instantly",
    description:
      "Generate optimized code and deploy from a single intuitive interface that mirrors your cloud stack.",
  },
  {
    title: "Full cloud control",
    description:
      "Deploy directly to your cloud account with full control over data residency, compliance, and VPC.",
  },
];

const PlatformFeatures = () => {
  return (
    <div className="mt-10 space-y-8">
      {features.map((feature) => (
        <PlatformFeature
          key={feature.title}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  );
};

export default PlatformFeatures;