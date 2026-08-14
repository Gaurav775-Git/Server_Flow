import SignupCard from "../components/cards/SignupCard";
import NavBar from "../components/NavBar";
import LoginLeftIcon from "../components/ui/LoginLeftIcon";
import LoginRightIcon from "../components/ui/LoginRightIcon";
import Footer from "../components/Footer";

const Signup = () => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2eb]">
      <NavBar />
      <div className="min-h-screen relative flex justify-center items-center bg-[#10131A]">
        <LoginLeftIcon />
        <SignupCard />
        <LoginRightIcon />
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
