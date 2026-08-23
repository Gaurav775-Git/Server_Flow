import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import HeroSection from "../components/sections/home/HeroSection";
import ProductsSection from "../components/sections/home/ProductsSection";
import PlatformSection from "../components/sections/home/PlatformSection";
import WhyServerFlow from "../components/sections/home/WhyServerFlow";
import TestimonialsSection from "../components/sections/home/TestimonialsSection";
import CTASection from "../components/sections/home/CTASection";

const homeNavLinks = [
  { label: "Products", hasDropdown: true, isActive: true },
  { label: "Solutions", hasDropdown: true },
  { label: "Developers", hasDropdown: true },
  { label: "Pricing" },
  { label: "Docs" },
];

const homeActionItems = [
  { label: "Search", icon: "search" },
  { label: "Profile", icon: "account_circle" },
  { label: "Contact Sales" },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-[#05090E]">
      <NavBar
        navLinks={homeNavLinks}
        actionItems={homeActionItems}
        cta={{ label: "Start Building", href: "/dashboard" }}
      />

      <HeroSection />

      <ProductsSection />

      <PlatformSection />

      <WhyServerFlow />

      <TestimonialsSection />


      <CTASection />

      <Footer />
      
    </div>
  );
};

export default Home;