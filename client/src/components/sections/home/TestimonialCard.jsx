import { UserRound } from "lucide-react";

const TestimonialCard = ({
  quote,
  highlightText,
  name,
  company,
  accent = "cyan",
}) => {
  const accentStyles = {
    cyan: {
      border: "border-[#25353f]",
      iconContainer: "border-cyan-500/30 bg-cyan-500/10",
      icon: "text-cyan-400",
      highlight: "text-cyan-400",
      circles: "bg-cyan-500/[0.04]",
    },
    lime: {
      border: "border-[#21362c]",
      iconContainer: "border-lime-500/30 bg-lime-500/10",
      icon: "text-lime-400",
      highlight: "text-lime-400",
      circles: "bg-lime-500/[0.04]",
    },
  };

  const styles = accentStyles[accent];

  const quoteParts = quote.split(highlightText);

  return (
    <article
      className={`relative w-full max-w-[520px] min-h-[300px] overflow-hidden rounded-2xl border bg-[#10131a] px-10 py-9 ${styles.border}`}
    >
      {/* Quote */}
      <p className="relative z-10 max-w-[450px] text-[16px] font-semibold leading-[1.7] text-[#d5d7df]">
        "{quoteParts[0]}
        <span className={styles.highlight}>{highlightText}</span>
        {quoteParts[1]}"
      </p>

      {/* Author */}
      <div className="relative z-10 mt-12 flex items-center gap-4">
        {/* Icon */}
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg border ${styles.iconContainer}`}
        >
          <UserRound
            size={19}
            strokeWidth={1.7}
            className={styles.icon}
          />
        </div>

        {/* Author Details */}
        <div>
          <h3 className="text-[14px] font-bold leading-tight text-[#e1e3e9]">
            {name}
          </h3>

          <p className="mt-1 text-[11px] font-medium text-[#727783]">
            {company}
          </p>
        </div>
      </div>

      {/* Decorative Circles */}
      <div
        className={`pointer-events-none absolute -bottom-12 -right-10 h-32 w-32 rounded-full ${styles.circles}`}
      />

      <div
        className={`pointer-events-none absolute -bottom-10 -right-20 h-28 w-28 rounded-full border-[20px] border-current opacity-[0.035] ${styles.highlight}`}
      />

      <div
        className={`pointer-events-none absolute -bottom-10 right-8 h-24 w-24 rounded-full border-[16px] border-current opacity-[0.025] ${styles.highlight}`}
      />
    </article>
  );
};

export default TestimonialCard;