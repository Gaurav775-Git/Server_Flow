import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import HeroSection from "../components/sections/home/HeroSection";
import ProductsSection from "../components/sections/home/ProductsSection";
import PlatformSection from "../components/sections/home/PlatformSection";
import WhyServerFlow from "../components/Sections/home/WhyServerFlow";
import TestimonialsSection from "../components/Sections/home/TestimonialsSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#05090E]">
      <NavBar />

      <HeroSection />

      <ProductsSection />

      <PlatformSection />

      <WhyServerFlow />

      <TestimonialsSection />
      <Footer />
    </div>
  );
};

export default Home;