import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../../utils/projectApi";

const DashboardSideBar = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const menuItems = [
    { icon: 'dataset', label: 'All Projects', active: true },
    { icon: 'share', label: 'Shared with Me', active: false },
    { icon: 'archive', label: 'Archived', active: false },
  ];

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const response = await createProject({
        name: name.trim(),
        description: description.trim(),
      });
      setIsFormOpen(false);
      setName("");
      setDescription("");
      navigate(`/playground?projectId=${response.data.id}`);
    } catch (err) {
      setError(err.message || "Unable to create project");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside className="w-50 border-r border-[#30363D] hidden md:flex flex-col py-6 pr-9">
      <button className="w-full bg-[#00b4d8] text-[black] rounded-lg py-2 px-4 font-semibold mb-8 flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(0,180,216,0.3)] transition-all duration-300" onClick={() => setIsFormOpen(true)}>
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Project
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form onSubmit={handleCreateProject} className="w-full max-w-md rounded-lg border border-[#30363D] bg-[#161b22] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e1e2eb]">New Project</h2>
              <button type="button" className="text-xl text-[#bcc9ce]" onClick={() => setIsFormOpen(false)} aria-label="Close">&times;</button>
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
              className="mb-3 w-full rounded border border-[#30363D] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-[#00b4d8]"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description (optional)"
              rows="3"
              className="mb-3 w-full resize-none rounded border border-[#30363D] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-[#00b4d8]"
            />
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={isSaving} className="w-full rounded bg-[#00b4d8] py-2 font-semibold text-black disabled:opacity-60">
              {isSaving ? "Creating..." : "Create Project"}
            </button>
          </form>
        </div>
      )}
      
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
