const ProjectCard = ({ 
  title, 
  subtitle, 
  icon, 
  status, 
  statusType = 'active', // 'active', 'draft', 'error'
  details, 
  users,
  onMoreClick 
}) => {
  const statusColors = {
    active: {
      bg: 'bg-[#a9d63e]/10',
      text: 'text-[#a9d63e]',
      border: 'border-[#a9d63e]/20',
      dot: 'bg-[#a9d63e]'
    },
    draft: {
      bg: 'bg-[#32353c]',
      text: 'text-[#bcc9ce]',
      border: 'border-[#30363D]',
      dot: null
    },
    error: {
      bg: 'bg-[#93000a]/20',
      text: 'text-[#ffb4ab]',
      border: 'border-[#93000a]/30',
      dot: 'bg-[#ffb4ab] animate-pulse'
    }
  };

  const cardStyles = {
    active: 'border-t-2 border-t-[#00b4d8]',
    draft: '',
    error: 'border border-[#93000a]/50'
  };

  const gradientStyles = {
    active: 'from-primary-container/5 to-transparent',
    draft: '',
    error: 'from-error-container/10 to-transparent'
  };

  const colors = statusColors[statusType] || statusColors.active;

  return (
    <div className={`bg-[#161B22] border border-[#30363D] ${cardStyles[statusType]} rounded-lg p-6 hover:bg-[#21262D] hover:border-[#00b4d8]/30 transition-all duration-300 group cursor-pointer relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientStyles[statusType]} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded bg-[#10131a] border border-[#30363D] flex items-center justify-center ${statusType === 'error' ? 'text-[#ffb4ab] bg-[#93000a]/20 border-[#93000a]/30' : 'text-[#00b4d8]'}`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#e1e2eb] group-hover:text-[#00b4d8] transition-colors">
              {title}
            </h3>
            <p className="font-mono text-xs text-[#bcc9ce]">{subtitle}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full ${colors.bg} ${colors.text} font-mono text-xs flex items-center gap-1 border ${colors.border}`}>
          {colors.dot && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>}
          {status}
        </span>
      </div>
      
      <div className="space-y-1 mb-4 relative z-10">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-sm text-[#bcc9ce]">{detail.label}</span>
            <span className={`font-mono text-xs ${detail.error ? 'text-[#ffb4ab]' : 'text-[#e1e2eb]'}`}>
              {detail.value}
            </span>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-[#30363D] flex justify-between items-center relative z-10">
        <div className="flex -space-x-2">
          {users.map((user, index) => (
            <div key={index} className="w-6 h-6 rounded-full bg-[#32353c] border border-[#161B22] flex items-center justify-center text-[10px] text-[#e1e2eb]">
              {user}
            </div>
          ))}
        </div>
        <button 
          className="text-[#bcc9ce] hover:text-[#00b4d8] transition-colors"
          onClick={onMoreClick}
        >
          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
