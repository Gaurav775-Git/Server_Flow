import logo from '../assets/logo.png'

const NavBar = () => {
  return (
    <nav className="sticky top-0 w-full z-40 bg-[#10131a]/80 backdrop-blur-md border-b border-[#3d494d]">
      <div className="flex justify-between items-center px-8 h-20 w-full max-w-[1280px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-12">
          <a className="text-2xl font-black text-[#e1e2eb] flex items-center gap-2" href="#">
            <span className="material-symbols-outlined text-[#4cd6fb] text-4xl"><img src={logo} className='h-10 w-10 object-contain'/></span>
          </a>
          
          {/* Nav Links - Desktop */}
          <div className="hidden lg:flex gap-8">
            <div className="relative group cursor-pointer">
              <span className="text-[#e1e2eb] font-medium flex items-center gap-1">
                Products 
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </span>
            </div>
            <div className="relative group cursor-pointer">
              <span className="text-[#bcc9ce] hover:text-[#e1e2eb] transition-colors flex items-center gap-1">
                Solutions 
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </span>
            </div>
            <div className="relative group cursor-pointer">
              <span className="text-[#bcc9ce] hover:text-[#e1e2eb] transition-colors flex items-center gap-1">
                Developers 
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </span>
            </div>
            <a className="text-[#bcc9ce] hover:text-[#e1e2eb] transition-colors" href="#">
              Pricing
            </a>
            <a className="text-[#bcc9ce] hover:text-[#e1e2eb] transition-colors" href="#">
              Docs
            </a>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-8">
          <div className="hidden sm:flex items-center gap-6">
            <button className="material-symbols-outlined text-[#bcc9ce] hover:text-[#e1e2eb]">
              search
            </button>
            <button className="material-symbols-outlined text-[#bcc9ce] hover:text-[#e1e2eb]">
              account_circle
            </button>
            <button className="text-[#bcc9ce] hover:text-[#e1e2eb] font-bold">
              Contact Sales
            </button>
          </div>
          <a href="/dashboard" className="bg-[#4cd6fb] text-[#003642] px-6 py-2.5 rounded-full font-bold hover:brightness-110 transition-all shadow-lg shadow-[#4cd6fb]/20">
            Start Building
          </a>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
