import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import HeroSection from "../components/sections/home/HeroSection";
import ProductsSection from "../components/sections/home/ProductsSection";
import PlatformSection from "../components/sections/home/PlatformSection";
import WhyServerFlow from "../components/sections/home/WhyServerFlow";
import TestimonialsSection from "../components/sections/home/TestimonialsSection";
import CTASection from "../components/sections/home/CTASection";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#000000]">
      <NavBar />

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