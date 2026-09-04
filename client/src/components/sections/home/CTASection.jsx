const CTASection = () => {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#000000] px-6 py-20">
      {/* Decorative Braces */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {/* Left Brace */}
        <svg
          className="absolute left-[7%] top-1/2 h-[520px] w-[90px] -translate-y-1/2 lg:left-[9%] lg:h-[570px]"
          viewBox="0 0 80 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="leftBraceGradient"
              x1="40"
              y1="0"
              x2="40"
              y2="500"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#45c9f0" />
              <stop offset="50%" stopColor="#a8df32" />
              <stop offset="100%" stopColor="#45c9f0" />
            </linearGradient>
          </defs>

          <path
            d="M65 10
               C35 10 25 25 25 55
               V190
               C25 225 15 245 5 250
               C15 255 25 275 25 310
               V445
               C25 475 35 490 65 490"
            stroke="url(#leftBraceGradient)"
            strokeWidth="12"
            strokeLinejoin="round"
          />
        </svg>

        {/* Right Brace */}
        <svg
          className="absolute right-[7%] top-1/2 h-[520px] w-[90px] -translate-y-1/2 lg:right-[9%] lg:h-[570px]"
          viewBox="0 0 80 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="rightBraceGradient"
              x1="40"
              y1="0"
              x2="40"
              y2="500"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#45c9f0" />
              <stop offset="50%" stopColor="#a8df32" />
              <stop offset="100%" stopColor="#45c9f0" />
            </linearGradient>
          </defs>

          <path
            d="M15 10
               C45 10 55 25 55 55
               V190
               C55 225 65 245 75 250
               C65 255 55 275 55 310
               V445
               C55 475 45 490 15 490"
            stroke="url(#rightBraceGradient)"
            strokeWidth="12"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Main CTA Content */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        {/* Get Started Badge */}
        <div className="mb-10 rounded-full border border-[#19495c] px-5 py-1.5">
          <span className="text-[8px] font-semibold tracking-[0.35em] text-[#45c9f0]">
            GET STARTED FOR FREE
          </span>
        </div>

        {/* Main Heading */}
        <h2 className="text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="block text-[#e7e8ef]">STOP CODING,</span>

          <span className="block text-[#45c9f0]">START BUILDING</span>
        </h2>

        {/* CTA Button */}
        <button
          type="button"
          className="
            mt-12
            rounded-lg
            bg-[#a8df32]
            px-10
            py-3.5
            text-sm
            font-bold
            text-[#10140a]
            shadow-[0_0_35px_rgba(168,223,50,0.28)]
            transition-all
            duration-300
            hover:scale-105
            hover:shadow-[0_0_45px_rgba(168,223,50,0.45)]
          "
        >
          Get building for free
        </button>

        {/* Supporting Text */}
        <p className="mt-7 text-[8px] font-medium uppercase tracking-[0.35em] text-[#525761] sm:text-[9px]">
          NO CREDIT CARD REQUIRED
          <span className="mx-3">•</span>
          UNLIMITED FREE TIER
        </p>
      </div>
    </section>
  );
};

export default CTASection;
