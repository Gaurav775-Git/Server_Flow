const comparisonData = [
  {
    category: "INFRA OPS",
    categoryColor: "text-lime-400",
    serverFlow: {
      title: "Zero",
      description: "Fully managed, 99.99% SLA",
    },
    manualCoding: {
      title: "Constant",
      description: "Patching, scaling, failures",
    },
    noCodeTools: {
      title: "Partial",
      description: "Limited control over infra",
    },
  },
  {
    category: "CLOUD",
    categoryColor: "text-cyan-400",
    serverFlow: {
      title: "Any Cloud",
      description: "AWS, GCP, Azure, Digital Ocean",
    },
    manualCoding: {
      title: "Locked",
      description: "Locked to your chosen stack",
    },
    noCodeTools: {
      title: "Siloed",
      description: "Locked to provider ecosystem",
    },
  },
  {
    category: "COST",
    categoryColor: "text-yellow-400",
    serverFlow: {
      title: "Predictable",
      description: "All-inclusive subscription",
    },
    manualCoding: {
      title: "High",
      description: "High dev ops overhead",
    },
    noCodeTools: {
      title: "Variable",
      description: "Pay-per-API-call spikes",
    },
  },
  {
    category: "MIGRATIONS",
    categoryColor: "text-purple-400",
    serverFlow: {
      title: "Seamless",
      description: "Export source, no lock-in",
    },
    manualCoding: {
      title: "Painful",
      description: "Manual rewrite required",
    },
    noCodeTools: {
      title: "Impossible",
      description: "High friction to migrate",
    },
  },
];

const ComparisonCell = ({ title, description }) => {
  return (
    <div className="flex min-h-[110px] flex-col justify-center px-8 py-6">
      <h3 className="text-[17px] font-semibold leading-tight text-[#e4e6ed]">
        {title}
      </h3>

      <p className="mt-2 text-[13px] font-normal leading-relaxed text-[#858b97]">
        {description}
      </p>
    </div>
  );
};

const WhyServerFlow = () => {
  return (
    <section className="w-full bg-[#000000] px-5 py-28">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Heading */}
        <div className="mb-20 text-center">
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-[#e8e9ef] md:text-5xl">
            Why Server Flow?
          </h2>
        </div>

        {/* Comparison Table */}
        <div className="overflow-hidden rounded-xl border border-[#293039]">
          {/* Table Header */}
          <div className="grid grid-cols-4 border-b border-[#293039]">
            {/* Empty Category Header */}
            <div className="min-h-[88px]" />

            {/* Server Flow */}
            <div className="flex min-h-[88px] items-center border-l border-[#293039] bg-[#101c22] px-8">
              <span className="text-[16px] font-bold text-cyan-400">
                Server Flow
              </span>
            </div>

            {/* Manual Coding */}
            <div className="flex min-h-[88px] items-center border-l border-[#293039] px-8">
              <span className="text-[16px] font-semibold text-[#737985]">
                Manual Coding
              </span>
            </div>

            {/* No-Code Tools */}
            <div className="flex min-h-[88px] items-center border-l border-[#293039] px-8">
              <span className="text-[16px] font-semibold text-[#737985]">
                No-Code Tools
              </span>
            </div>
          </div>

          {/* Comparison Rows */}
          {comparisonData.map((row) => (
            <div
              key={row.category}
              className="grid grid-cols-4 border-b border-[#293039] last:border-b-0"
            >
              {/* Category */}
              <div className="flex min-h-[110px] items-center px-8">
                <span
                  className={`text-[11px] font-bold tracking-[0.16em] ${row.categoryColor}`}
                >
                  {row.category}
                </span>
              </div>

              {/* Server Flow */}
              <div className="border-l border-[#293039] bg-[#101c22]">
                <ComparisonCell
                  title={row.serverFlow.title}
                  description={row.serverFlow.description}
                />
              </div>

              {/* Manual Coding */}
              <div className="border-l border-[#293039]">
                <ComparisonCell
                  title={row.manualCoding.title}
                  description={row.manualCoding.description}
                />
              </div>

              {/* No-Code Tools */}
              <div className="border-l border-[#293039]">
                <ComparisonCell
                  title={row.noCodeTools.title}
                  description={row.noCodeTools.description}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyServerFlow;