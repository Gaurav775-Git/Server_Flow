import { useNavigate } from "react-router-dom";

const DashboardSideBar = () => {
  const navigate = useNavigate();
  const menuItems = [
    { icon: 'dataset', label: 'All Projects', active: true },
    { icon: 'share', label: 'Shared with Me', active: false },
    { icon: 'archive', label: 'Archived', active: false },
  ];

  const to = "/playground";

  return (
    <aside className="w-50 border-r border-[#30363D] hidden md:flex flex-col py-6 pr-9">
      <button className="w-full bg-[#00b4d8] text-[#00414f] rounded-lg py-2 px-4 font-semibold mb-8 flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(0,180,216,0.3)] transition-all duration-300" onClick={()=>{navigate(to)}}>
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Project
      </button>
      
      <nav className="flex flex-col gap-1 flex-1">
        <p className="font-mono text-xs text-[#bcc9ce] mb-1 px-2 uppercase tracking-wider">
          Workspaces
        </p>
        
        {menuItems.map((item, index) => (
          <a
            key={index}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
              item.active 
                ? 'bg-[#32353c]/30 text-[#4cd6fb] border-l-2 border-[#4cd6fb]' 
                : 'text-[#bcc9ce] hover:bg-[#32353c]/30 hover:text-[#e1e2eb] transition-colors duration-200 border-l-2 border-transparent'
            }`}
            href="#"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {item.icon}
            </span>
            <span className="font-semibold text-sm">{item.label}</span>
          </a>
        ))}
      </nav>
      
      <div className="mt-auto border-t border-[#30363D] pt-6">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-full bg-[#32353c] flex items-center justify-center border border-[#30363D]">
            <span className="material-symbols-outlined text-[16px] text-[#e1e2eb]">person</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-[#e1e2eb] leading-tight">Admin User</p>
            <p className="font-mono text-xs text-[#bcc9ce]">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSideBar;
