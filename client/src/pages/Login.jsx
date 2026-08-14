import LoginCard from "../components/cards/LoginCard";
import LoginLeftIcon from "../components/ui/LoginLeftIcon";
import LoginRightIcon from "../components/ui/LoginRightIcon";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
const Login = () => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2eb]">
      <NavBar />
      <div className="min-h-screen relative flex justify-center items-center bg-[#10131A]">
        <LoginLeftIcon />
        <LoginCard />
        <LoginRightIcon />
      </div>
      <Footer />
    </div>
  );
};

export default Login;
