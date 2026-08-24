import LoginCard from "../components/cards/LoginCard";
import LoginLeftIcon from "../components/ui/LoginLeftIcon";
import LoginRightIcon from "../components/ui/LoginRightIcon";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
const Login = () => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2eb] overflow-x-hidden">
      <NavBar />
      <main className="relative flex items-center justify-center bg-[#10131A] px-4 py-12 sm:px-6 lg:px-8">
        <LoginLeftIcon />
        <div className="w-full max-w-md sm:max-w-lg">
          <LoginCard />
        </div>
        <LoginRightIcon />
      </main>
      <Footer />
    </div>
  );
};

export default Login;
