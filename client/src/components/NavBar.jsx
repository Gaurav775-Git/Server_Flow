import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const NavBar = () => {
  const navigate = useNavigate();

  // Navigate to a section on the home page
  const navigateToSection = (sectionId) => {
    if (window.location.pathname !== "/") {
      navigate("/");
    }

    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
      });
    }, 0);
  };

  return (
    <nav className="sticky top-0 w-full z-40 bg-[#000000]/80 backdrop-blur-md border-b border-[#3d494d]">
      <div className="flex justify-between items-center px-6 lg:px-8 h-16 w-full max-w-[1200px] mx-auto">
        
        {/* Logo */}
        <div className="flex items-center gap-10">
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-black text-[#e1e2eb] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[#4cd6fb] text-3xl">
              <img src={logo} className="h-8 w-8 object-contain" />
            </span>
          </button>

          {/* Nav Links - Desktop */}
          <div className="hidden lg:flex gap-7 text-sm">
            
            {/* Products */}
            <button
              onClick={() => navigateToSection("products")}
              className="text-[#e1e2eb] font-medium hover:text-[#e1e2eb] transition-colors"
            >
              Product
            </button>

            {/* Platform */}
            <button
              onClick={() => navigateToSection("platform")}
              className="text-[#e1e2eb] font-medium hover:text-[#e1e2eb] transition-colors"
            >
              Platform
            </button>

            {/* About Us */}
            <button
              onClick={() => navigateToSection("about")}
              className="text-[#bcc9ce] hover:text-[#e1e2eb] transition-colors"
            >
              About Us
            </button>

            {/* Pricing */}
            <button
              onClick={() => navigate("/pricing")}
              className="text-[#bcc9ce] hover:text-[#e1e2eb] transition-colors"
            >
              Pricing
            </button>

            {/* Docs */}
            <button
              onClick={() => navigate("/docs")}
              className="text-[#bcc9ce] hover:text-[#e1e2eb] transition-colors"
            >
              Docs
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-5 text-sm">
            
            {/* Search */}
            <button
              className="material-symbols-outlined text-[#bcc9ce] hover:text-[#e1e2eb]"
            >
              search
            </button>

            {/* Account */}
            <button
              className="material-symbols-outlined text-[#bcc9ce] hover:text-[#e1e2eb]"
            >
              account_circle
            </button>

            {/* Login */}
            <button
              onClick={() => navigate("/login")}
              className="text-[#bcc9ce] hover:text-[#e1e2eb] font-medium transition-colors"
            >
              Login
            </button>
          </div>

          {/* Start Building */}
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-[#4cd6fb] text-[#003642] px-5 py-2 rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#4cd6fb]/20"
          >
            Start Building
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;