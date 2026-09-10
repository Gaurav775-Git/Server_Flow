const ProjectCard = ({ id, title, subtitle, status, nodeCount, updatedAt }) => {
  const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-400',
    draft: 'bg-yellow-500/20 text-yellow-400',
    archived: 'bg-gray-500/20 text-gray-400',
  };

  const statusColor = statusColors[status] || statusColors.draft;

  return (
    <div className="bg-[#161D27] rounded-xl border border-[#30363D] p-5 hover:border-[#00d4ff]/30 transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
            <span className="text-[#00d4ff] text-xl">📁</span>
          </div>
          <div>
            <h3 className="font-semibold text-[#e1e2eb] truncate max-w-[150px]">
              {title}
            </h3>
            <p className="text-xs text-[#bcc9ce]">{subtitle}</p>
          </div>
        </div>
        <button className="text-[#bcc9ce] hover:text-white transition-colors">
          ⋮
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-3 py-1 rounded-full ${statusColor}`}>
          {status}
        </span>
        <div className="text-xs text-[#bcc9ce]">
          {nodeCount} nodes
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#30363D] flex justify-between items-center text-xs text-[#bcc9ce]">
        <span>Updated {updatedAt ? new Date(updatedAt).toLocaleDateString() : 'N/A'}</span>
        <button className="text-[#00d4ff] hover:underline">Open</button>
      </div>
    </div>
  );
};

export default ProjectCard;