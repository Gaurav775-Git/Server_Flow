import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ChevronDown, Send, Sparkles } from 'lucide-react'
import Build_Button from '../ui/Build_Button'
import logo from '../../assets/logo.png'

const Chat_Box = () => {
  const [expand , setexpand] = useState(false);
  const { register, handleSubmit, reset } = useForm()
  const [reply, setReply] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data) => {
    if (!data.message?.trim() || isLoading) return

    setIsLoading(true)
    try {
      const res = await fetch("http://127.0.0.1:8001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: data.message })
      })
      if (!res.ok) throw new Error('Unable to reach the Build Assistant.')
      const result = await res.json()
      setReply(result.reply)
      reset()
    } catch (error) {
      setReply(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  if(!expand){
    return (
      <div className="fixed top-5 right-4 z-[60]">
        <Build_Button name="Build" onClick={() => setexpand(true)} />
      </div>
    )
  }

  return (
    <aside className="fixed inset-y-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-[390px] flex-col overflow-hidden rounded-lg border border-zinc-700 bg-black text-zinc-100 shadow-xl shadow-black/50 sm:w-[390px]">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center text-black">
            <img src={logo} alt="Server Flow" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Build Assistant</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-white" /> Ready to create</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setexpand(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label="Minimize Build Assistant"
        >
          <ChevronDown size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {reply ? (
          <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-sm leading-6 text-zinc-200">
            {reply}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-white">
              <Sparkles size={23} />
            </div>
            <p className="text-sm font-medium text-zinc-200">What would you like to build?</p>
            <p className="mt-2 max-w-[235px] text-xs leading-5 text-zinc-500">Describe a feature, workflow, or API and I’ll help you get started.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="border-t border-zinc-800 bg-zinc-950 p-3">
        <label htmlFor="build-message" className="sr-only">Message Build Assistant</label>
        <div className="flex items-center gap-2 rounded-md border border-zinc-700 bg-black p-1 transition-colors focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-white/15">
          <input
            id="build-message"
            type="text"
            placeholder="Describe what you want to build..."
            {...register("message")}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <button type="submit" disabled={isLoading} className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50">
            <Send size={15} strokeWidth={2.5} />
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-zinc-500">Press Enter to send</p>
      </form>
    </aside>
  )
}

export default Chat_Box
