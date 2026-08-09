import logo from '../assets/logo.png'

const Footer = () => {
  return (
    <footer className="bg-[#05090E] border-t border-[#3d494d] pt-32 pb-16">
      <div className="max-w-[1280px] mx-auto px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-16 mb-32">
          {/* Brand Column */}
          <div className="col-span-2">
            <a className="text-3xl font-black text-[#e1e2eb] flex items-center gap-3 mb-10" href="#">
              <span className="material-symbols-outlined text-[#4cd6fb] text-5xl"><img src={logo} className='h-10 w-10 object-contain'/></span>Server Flow
            </a>
            <p className="text-[#bcc9ce] text-base mb-12 max-w-xs leading-relaxed opacity-60">
              The world's leading visual backend building platform. Design, generate, and deploy production-ready infrastructure in minutes.
            </p>
            <div className="flex gap-4">
              {/* GitHub */}
              <a className="w-11 h-11 rounded-lg border border-[#3d494d] flex items-center justify-center hover:bg-[#1d2026] hover:text-[#4cd6fb] transition-all text-[#bcc9ce]" href="#">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
                </svg>
              </a>
              
              {/* LinkedIn */}
              <a className="w-11 h-11 rounded-lg border border-[#3d494d] flex items-center justify-center hover:bg-[#1d2026] hover:text-[#4cd6fb] transition-all text-[#bcc9ce]" href="#">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
              </a>
              
              {/* Email */}
              <a className="w-11 h-11 rounded-lg border border-[#3d494d] flex items-center justify-center hover:bg-[#1d2026] hover:text-[#4cd6fb] transition-all text-[#bcc9ce]" href="#">
                <span className="material-symbols-outlined text-xl">mail</span>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-black text-[#e1e2eb] mb-10 uppercase tracking-[0.2em] text-[10px]">Company</h4>
            <ul className="space-y-5 text-[#bcc9ce] text-sm font-semibold">
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">About</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Careers</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Partners</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Press</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-black text-[#e1e2eb] mb-10 uppercase tracking-[0.2em] text-[10px]">Legal</h4>
            <ul className="space-y-5 text-[#bcc9ce] text-sm font-semibold">
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Terms</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Privacy</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Security</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Compliance</a></li>
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-black text-[#e1e2eb] mb-10 uppercase tracking-[0.2em] text-[10px]">Platform</h4>
            <ul className="space-y-5 text-[#bcc9ce] text-sm font-semibold">
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Workflow Builder</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Code Export</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Deployment</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Pricing</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-black text-[#e1e2eb] mb-10 uppercase tracking-[0.2em] text-[10px]">Support</h4>
            <ul className="space-y-5 text-[#bcc9ce] text-sm font-semibold">
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Documentation</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">API Status</a></li>
              <li><a className="hover:text-[#4cd6fb] transition-colors" href="#">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-16 border-t border-[#3d494d] flex flex-col md:flex-row justify-between items-center gap-12 text-[#bcc9ce] text-xs font-bold tracking-tight opacity-50">
          <div>© 2024 Server Flow Inc. All rights reserved.</div>
          
          <div className="flex items-center gap-12">
            {/* Dark/Light Mode Toggle */}
            <div className="flex bg-[#1d2026] rounded-lg p-1.5 border border-[#3d494d]">
              <button className="px-6 py-2.5 text-[10px] font-black bg-[#4cd6fb] text-[#003642] rounded-md shadow-sm">
                DARK
              </button>
              <button className="px-6 py-2.5 text-[10px] font-black text-[#bcc9ce] hover:text-[#e1e2eb]">
                LIGHT
              </button>
            </div>

            {/* Language Selector */}
            <select className="bg-transparent text-[#e1e2eb] text-xs border-none focus:ring-0 cursor-pointer font-bold">
              <option>English (US)</option>
              <option>Deutsch</option>
              <option>Français</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
