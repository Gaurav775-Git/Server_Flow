import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import HeroSection from '../components/sections/home/HeroSection';
import ProductsSection from "../components/sections/home/ProductsSection";

const Home = () => {
  return (
    <div className="bg-[#05090E] min-h-screen">
      <NavBar />
      <HeroSection/>
       <ProductsSection />
      <Footer />
    </div>
  );
};

export default Home;
