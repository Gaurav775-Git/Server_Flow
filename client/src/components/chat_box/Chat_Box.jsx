import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Send } from 'lucide-react'
import Build_Button from '../ui/Build_Button'

const backendUrl = 'https://server-flow-3.onrender.com'.replace(/\/$/, '')

const Chat_Box = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [canBuild, setCanBuild] = useState(false)
  const [masterJson, setMasterJson] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Start building by sending a message below.',
    },
  ])

  const timeoutRef = useRef(null)
  const messagesEndRef = useRef(null)

  const { register, handleSubmit, reset } = useForm()

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isLoading])

  // Receive generated master JSON
  useEffect(() => {
    const receiveMasterJson = (event) => {
      const { nodes = [], connections = [] } = event.detail || {}

      setMasterJson(event.detail || null)

      setMessages((prev) => [
        ...prev,
        {
          id: `master-json-${Date.now()}`,
          role: 'assistant',
          content: `Build configuration generated with ${
            nodes.length
          } node${nodes.length === 1 ? '' : 's'} and ${
            connections.length
          } connection${connections.length === 1 ? '' : 's'}.`,
        },
      ])
    }

    window.addEventListener('master-json-generated', receiveMasterJson)

    return () => {
      window.removeEventListener(
        'master-json-generated',
        receiveMasterJson
      )

      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Prepare build
  const handleReady = () => {
    if (isPreparing || canBuild) return

    setIsPreparing(true)

    window.dispatchEvent(new Event('generate-master-json'))

    timeoutRef.current = setTimeout(() => {
      setCanBuild(true)
      setIsPreparing(false)
    }, 3000)
  }

  // Send chat message
  const onSubmit = async (data) => {
    const message = data.message?.trim()

    if (!message || isLoading) return

    // Show user's message immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    }

    setMessages((prev) => [...prev, userMessage])

    // Clear input
    reset()

    setIsLoading(true)

    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
        }),
      })

      if (!res.ok) {
        throw new Error('Unable to reach the Build Assistant.')
      }

      const result = await res.json()

      // Show assistant response
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          result.reply ||
          'I received your message but no reply was returned.',
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            error.message ||
            'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Build project
  const handleBuild = async () => {
    if (!masterJson || isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          master_json: masterJson,
        }),
      })

      if (!res.ok) {
        throw new Error('Unable to reach the Build Assistant.')
      }

      const result = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: `build-${Date.now()}`,
          role: 'assistant',
          content:
            result.reply || 'Build completed successfully.',
        },
      ])

      window.location.assign('/playground/download')
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `build-error-${Date.now()}`,
          role: 'assistant',
          content:
            error.message ||
            'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Ready / Build button
  if (!isExpanded) {
    return (
      <div className="fixed top-5 right-4 z-60">
        {!canBuild ? (
          <Build_Button
            name={isPreparing ? 'Preparing…' : 'Ready'}
            onClick={handleReady}
            disabled={isPreparing}
          />
        ) : (
          <Build_Button
            name="Build"
            onClick={() => setIsExpanded(true)}
          />
        )}
      </div>
    )
  }

  return (
    <aside className="fixed inset-y-4 right-4 z-60 flex w-[calc(100%-2rem)] max-w-87.5 flex-col overflow-hidden rounded-lg border border-zinc-700 bg-black text-white shadow-xl sm:w-87.5">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">
            Build Assistant
          </h2>

          <p className="mt-0.5 text-xs text-zinc-400">
            Configuration ready
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Close Build Assistant"
        >
          ×
        </button>
      </div>

      {/* Chat messages */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const isUser = message.role === 'user'

            return (
              <div
                key={message.id}
                className={`flex w-full ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed wrap-break-word ${
                    isUser
                      ? 'rounded-br-sm bg-white text-black'
                      : 'rounded-bl-sm bg-zinc-800 text-zinc-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="rounded-xl rounded-bl-sm bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Build button */}
      <button
        type="button"
        onClick={handleBuild}
        disabled={!masterJson || isLoading}
        className="mx-3 mt-1 flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Building…' : 'Click here to Build'}
      </button>

      <p className="my-2 text-center text-xs text-zinc-500">
        or add comments
      </p>

      {/* Message input */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex gap-2 border-t border-zinc-800 p-3"
      >
        <input
          type="text"
          placeholder="Type a message"
          {...register('message')}
          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-white px-3 text-black disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </aside>
  )
}

export default Chat_Box