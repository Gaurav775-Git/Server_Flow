import SignupCard from "../components/cards/SignupCard";
import NavBar from "../components/NavBar";
import LoginLeftIcon from "../components/ui/LoginLeftIcon";
import LoginRightIcon from "../components/ui/LoginRightIcon";
import Footer from "../components/Footer";

const Signup = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0e14] text-[#e1e2eb]">
      <NavBar />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#10131A] px-4 py-10 sm:px-6">
        <div className="pointer-events-none hidden xl:block" aria-hidden="true">
          <LoginLeftIcon />
        </div>
        <SignupCard />
        <div className="pointer-events-none hidden xl:block" aria-hidden="true">
          <LoginRightIcon />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
