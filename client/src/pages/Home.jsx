import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import HeroSection from '../components/sections/home/HeroSection';

const Home = () => {
  return (
    <div className="bg-[#05090E] min-h-screen">
      <NavBar />
      <HeroSection/>
      <Footer />
    </div>
  );
};

export default Home;
