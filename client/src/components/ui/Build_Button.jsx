import { Hammer } from 'lucide-react'

const Build_Button = ({ name = 'Build', onClick, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-white/20 bg-black px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#0d1117] active:bg-zinc-900 disabled:cursor-wait disabled:opacity-60"
      aria-label="Open Build Assistant"
    >
      <Hammer size={16} strokeWidth={2.25} />
      <span>{name}</span>
    </button>
  )
}

export default Build_Button
