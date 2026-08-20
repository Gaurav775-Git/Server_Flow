import TestimonialCard from "./TestimonialCard";

const testimonials = [
  {
    quote:
      "We reduced the time-to-market for our API infrastructure by 70% saving millions of dollars each year.",
    highlightText: "70%",
    name: "Lead Developer",
    company: "Fortune 500 Fintech",
    accent: "cyan",
  },
  {
    quote:
      "Server Flow allows our frontend team to build their own backends independently of infra teams.",
    highlightText: "independently",
    name: "CTO",
    company: "Global Logistics Firm",
    accent: "lime",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="min-h-screen w-full bg-[#0b0e14]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col justify-center px-5 py-24">
        {/* Section Heading */}
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#e7e8ee] sm:text-4xl md:text-[40px]">
            Trusted by developers. Built for{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              builders.
            </span>
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-stretch">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.name}
              {...testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;