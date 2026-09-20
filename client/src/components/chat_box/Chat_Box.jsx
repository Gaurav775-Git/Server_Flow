import { useEffect, useRef, useState } from 'react'
import Build_Button from '../ui/Build_Button'
import loadingGif from '../../assets/loading.gif'

const backendUrl = 'https://server-flow-3.onrender.com'.replace(/\/$/, '')

const Chat_Box = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Click Build to generate your project.',
    },
  ])

  const timeoutRef = useRef(null)
  const progressTimeoutsRef = useRef([])
  const masterJsonRef = useRef(null)
  const messagesEndRef = useRef(null)

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

      masterJsonRef.current = event.detail || null

      if (isLoading) {
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
    }

    window.addEventListener('master-json-generated', receiveMasterJson)

    return () => {
      window.removeEventListener(
        'master-json-generated',
        receiveMasterJson
      )

      clearTimeout(timeoutRef.current)
      progressTimeoutsRef.current.forEach(clearTimeout)
    }
  }, [isLoading])

  const addProgressMessage = (content, delay) => {
    const timeout = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `progress-${Date.now()}-${delay}`,
          role: 'assistant',
          content,
        },
      ])
    }, delay)

    progressTimeoutsRef.current.push(timeout)
  }

  const runBuild = async (configuration) => {
    const buildRequest = configuration
      ? fetch(`${backendUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            master_json: configuration,
          }),
        }).then(async (res) => {
          if (!res.ok) {
            throw new Error('Unable to reach the Build Assistant.')
          }

          return res.json()
        })
      : Promise.resolve({})

    addProgressMessage('Building your server flow...', 500)
    addProgressMessage('Connecting configured services...', 1500)
    addProgressMessage('Generating project files...', 2500)
    addProgressMessage('Finishing your build...', 3500)

    const [result] = await Promise.all([
      buildRequest,
      new Promise((resolve) => setTimeout(resolve, 4200)),
    ])

    setMessages((prev) => [
      ...prev,
      {
        id: `build-${Date.now()}`,
        role: 'assistant',
        content: result.reply || 'Build completed successfully.',
      },
    ])

    if (configuration) {
      window.location.assign('/playground/download')
    }
  }

  // Start the full build flow from the only visible Build button.
  const handleBuild = () => {
    if (isPreparing || isLoading) return

    setIsPreparing(true)
    setMessages((prev) => [
      ...prev,
      {
        id: `starting-${Date.now()}`,
        role: 'assistant',
        content: 'Preparing your build configuration...',
      },
    ])

    window.dispatchEvent(new Event('generate-master-json'))

    timeoutRef.current = setTimeout(() => {
      setIsExpanded(true)
      setIsPreparing(false)
      setIsLoading(true)

      setMessages((prev) => [
        ...prev,
        {
          id: `build-started-${Date.now()}`,
          role: 'assistant',
          content: 'Build started. Preparing your project...',
        },
      ])

      runBuild(masterJsonRef.current).catch((error) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `build-error-${Date.now()}`,
            role: 'assistant',
            content: error.message || 'Something went wrong. Please try again.',
          },
        ])
      }).finally(() => {
        setIsLoading(false)
      })
    }, 3000)
  }

  if (!isExpanded) {
    return (
      <div className="fixed top-5 right-4 z-60">
        <Build_Button
          name={isPreparing ? 'Preparing…' : 'Build'}
          onClick={handleBuild}
          disabled={isPreparing}
        />
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
              <div className="flex items-center gap-3 rounded-xl rounded-bl-sm bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                <img src={loadingGif} alt="Building" className="h-8 w-8" />
                <span>Building...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-zinc-800 p-3 text-center text-xs text-zinc-500">
        Build progress will appear here automatically.
      </div>
    </aside>
  )
}

export default Chat_Box