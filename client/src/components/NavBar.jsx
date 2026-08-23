import logo from '../assets/logo.png'

const NavBar = ({ navLinks = [], actionItems = [], cta }) => {
  return (
    <nav className="sticky top-0 w-full z-40 bg-[#10131a]/80 backdrop-blur-md border-b border-[#3d494d]">
      <div className="flex justify-between items-center px-8 h-20 w-full max-w-[1280px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-12">
          <a className="text-2xl font-black text-[#e1e2eb] flex items-center gap-2" href="#">
            <span className="material-symbols-outlined text-[#4cd6fb] text-4xl"><img src={logo} className='h-10 w-10 object-contain'/></span>
          </a>
          
          {/* Nav Links - Desktop */}
          {navLinks.length > 0 && (
            <div className="hidden lg:flex gap-8">
              {navLinks.map(({ label, href = "#", hasDropdown, isActive }) => (
                <a
                  key={label}
                  className={`${isActive ? "text-[#e1e2eb] font-medium" : "text-[#bcc9ce] hover:text-[#e1e2eb]"} transition-colors flex items-center gap-1`}
                  href={href}
                >
                  {label}
                  {hasDropdown && <span className="material-symbols-outlined text-sm">expand_more</span>}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-8">
          {actionItems.length > 0 && (
            <div className="hidden sm:flex items-center gap-6">
              {actionItems.map(({ label, href, icon }) => (
                href ? (
                  <a
                    key={label}
                    href={href}
                    className={`${icon ? "material-symbols-outlined" : "font-bold"} text-[#bcc9ce] hover:text-[#e1e2eb]`}
                  >
                    {icon ?? label}
                  </a>
                ) : (
                  <button
                    key={label}
                    type="button"
                    className={`${icon ? "material-symbols-outlined" : "font-bold"} text-[#bcc9ce] hover:text-[#e1e2eb]`}
                  >
                    {icon ?? label}
                  </button>
                )
              ))}
            </div>
          )}
          {cta && (
            <a href={cta.href} className="bg-[#4cd6fb] text-[#003642] px-6 py-2.5 rounded-full font-bold hover:brightness-110 transition-all shadow-lg shadow-[#4cd6fb]/20">
              {cta.label}
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
