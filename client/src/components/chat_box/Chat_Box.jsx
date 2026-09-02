import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Send } from 'lucide-react'
import Build_Button from '../ui/Build_Button'

const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')

const Chat_Box = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [canBuild, setCanBuild] = useState(false)
  const [masterJson, setMasterJson] = useState(null)
  const [reply, setReply] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef(null)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    const receiveMasterJson = (event) => {
      const { nodes = [], connections = [] } = event.detail || {}
      setMasterJson(event.detail || null)
      setReply(`Build configuration generated with ${nodes.length} node${nodes.length === 1 ? '' : 's'} and ${connections.length} connection${connections.length === 1 ? '' : 's'}.`)
    }

    window.addEventListener('master-json-generated', receiveMasterJson)
    return () => {
      window.removeEventListener('master-json-generated', receiveMasterJson)
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleReady = () => {
    if (isPreparing || canBuild) return

    setIsPreparing(true)
    window.dispatchEvent(new Event('generate-master-json'))

    timeoutRef.current = setTimeout(() => {
      setCanBuild(true)
      setIsPreparing(false)
    }, 3000)
  }

  const onSubmit = async (data) => {
    if (!data.message?.trim() || isLoading) return

    setIsLoading(true)
    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: data.message }),
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

  const handleBuild = async () => {
    if (!masterJson || isLoading) return

    setIsLoading(true)
    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master_json: masterJson }),
      })
      if (!res.ok) throw new Error('Unable to reach the Build Assistant.')

      const result = await res.json()
      setReply(result.reply)
      window.location.assign('/playground/download')
    } catch (error) {
      setReply(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isExpanded) {
    return (
      <div className="fixed top-5 right-4 z-[60]">
        {!canBuild ? (
          <Build_Button name={isPreparing ? 'Preparing…' : 'Ready'} onClick={handleReady} disabled={isPreparing} />
        ) : (
          <Build_Button name="Build" onClick={() => setIsExpanded(true)} />
        )}
      </div>
    )
  }

  return (
    <aside className="fixed inset-y-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-[350px] flex-col overflow-hidden rounded-lg border border-zinc-700 bg-black text-white shadow-xl sm:w-[350px]">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Build Assistant</h2>
          <p className="mt-0.5 text-xs text-zinc-400">Configuration ready</p>
        </div>
        <button type="button" onClick={() => setIsExpanded(false)} className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Close Build Assistant">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm text-zinc-300">
        {reply || 'Start building by sending a message below.'}
      </div>

      <button
        type="button"
        onClick={handleBuild}
        disabled={!masterJson || isLoading}
        className="mx-3 mt-1 flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Building…' : 'Click here to Build'}
      </button>

      <p className="my-2 text-center text-xs text-zinc-500">or add comments</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 border-t border-zinc-800 p-3">
        <input
          type="text"
          placeholder="Type a message"
          {...register('message')}
          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white"
        />
        <button type="submit" disabled={isLoading} className="rounded-md bg-white px-3 text-black disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
    </aside>
  )
}

export default Chat_Box
