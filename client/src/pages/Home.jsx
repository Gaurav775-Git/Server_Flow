import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import HeroSection from "../components/sections/home/HeroSection";
import ProductsSection from "../components/sections/home/ProductsSection";
import PlatformSection from "../components/sections/home/PlatformSection";

const Home = () => {
  const navbarLeftItems = [
    { label: 'Products', withChevron: true, className: 'text-[#e1e2eb] font-medium' },
    { label: 'Solutions', withChevron: true },
    { label: 'Developers', withChevron: true },
    { label: 'Pricing' },
    { label: 'Docs' },
  ];

  const navbarRightItems = [
    { label: 'search', className: 'material-symbols-outlined text-[#bcc9ce] hover:text-[#e1e2eb]' },
    { label: 'account_circle', className: 'material-symbols-outlined text-[#bcc9ce] hover:text-[#e1e2eb]' },
    { label: 'Contact Sales', className: 'text-[#bcc9ce] hover:text-[#e1e2eb] font-bold' },
  ];

  return (
    <div className="min-h-screen bg-[#05090E]">
      <NavBar
        leftItems={navbarLeftItems}
        rightItems={navbarRightItems}
        ctaButton={{ label: 'Start Building', href: '/dashboard' }}
      />

      <HeroSection />

      <ProductsSection />

      <PlatformSection />

      <Footer />
    </div>
  );
};

export default Home;