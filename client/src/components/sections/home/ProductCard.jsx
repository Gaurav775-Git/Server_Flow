const ProductCard = ({
  icon: Icon,
  category,
  title,
  description,
  linkText,
}) => {
  return (
    <div className="border text-white border-[#20242d] rounded-lg p-7 flex flex-col min-h-[340px]">
      
      {/* Icon */}
      <div className="mb-12">
        <Icon size={42} strokeWidth={1.8} />
      </div>

      {/* Category */}
      <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#a9d63e] mb-3">
        {category}
      </p>

      {/* Title */}
      <h3 className="text-xl font-bold text-[#e1e2eb] mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-6 text-[#8b909c]">
        {description}
      </p>

      {/* Bottom link */}
      <div className="mt-auto pt-6 border-t border-[#20242d] flex items-center justify-between">
        <span className="text-[10px] tracking-[0.05em] uppercase font-black text-[#737985]">
          {linkText}
        </span>

        <span className="text-[#737985]">
          →
        </span>
      </div>

    </div>
  );
};

export default ProductCard;