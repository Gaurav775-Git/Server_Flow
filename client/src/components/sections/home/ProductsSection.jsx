import { GitBranch, Terminal, Blocks, Box } from "lucide-react";
import ProductCard from "./ProductCard";

const ProductsSection = () => {
  const products = [
    {
      icon: GitBranch,
      category: "Visual Workflow",
      title: "React Flow®",
      description:
        "Design complex logic visually with our industry-leading flow engine.",
      linkText: "Try Now",
    },
    {
      icon: Terminal,
      category: "Code Gen",
      title: "Node.js®",
      description:
        "Export optimized, high-performance Node.js code instantly.",
      linkText: "Documentation",
    },
    {
      icon: Blocks,
      category: "API Suite",
      title: "Express®",
      description:
        "Integrated Express testing suite for rapid API validation.",
      linkText: "API Docs",
    },
    {
      icon: Box,
      category: "Deployment",
      title: "Docker®",
      description:
        "Containerize and deploy to any environment with a single click.",
      linkText: "Deploy Guide",
    },
  ];

  return (
    <section className="bg-[#000000] py-24">
      
      {/* Section Heading */}
      <div className="max-w-[1100px] mx-auto px-6 text-center">

        <p className="text-[9px] tracking-[0.3em] uppercase font-bold text-[#a9d63e] mb-5">
          Products
        </p>

        <h2 className="text-4xl md:text-5xl font-black leading-tight text-[#e1e2eb] max-w-2xl mx-auto">
          The visual backend tools you already use,
          <br />

          <span className="inline-block bg-gradient-to-r from-[#6366f1] to-[#c34dff] px-2 py-1 mt-1">
            fully managed.
          </span>
        </h2>

        <p className="text-sm text-[#737985] mt-5">
          Try Server Flow for...
        </p>

      </div>


      {/* Product Cards */}
      <div className="max-w-[1100px] mx-auto px-6 mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {products.map((product) => (
          <ProductCard
            key={product.title}
            icon={product.icon}
            category={product.category}
            title={product.title}
            description={product.description}
            linkText={product.linkText}
          />
        ))}

      </div>

    </section>
  );
};

export default ProductsSection; 