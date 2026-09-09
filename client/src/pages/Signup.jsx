import SignupCard from "../components/cards/SignupCard";
import NavBar from "../components/NavBar";
import LoginLeftIcon from "../components/ui/LoginLeftIcon";
import LoginRightIcon from "../components/ui/LoginRightIcon";
import Footer from "../components/Footer";

const Signup = () => {
  return (
    <div className="min-h-screen bg-[black] text-[#e1e2eb] overflow-x-hidden flex flex-col">
      <NavBar />
      <main className="relative flex-1 flex items-center justify-center bg-[#10131A] px-4 py-8 sm:py-12 lg:py-16 overflow-hidden">
        {/* Background icons - hidden on mobile */}
        <div className="hidden sm:block">
          <LoginLeftIcon />
        </div>
        
        <div className="w-full max-w-sm mx-auto z-10">
          <SignupCard />
        </div>
        
        <div className="hidden sm:block">
          <LoginRightIcon />
      </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;