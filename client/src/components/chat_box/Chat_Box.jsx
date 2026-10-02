import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Build_Button from '../ui/Build_Button'
import loadingGif from '../../assets/loading.gif'
import { saveCloudinaryUrl } from '../../utils/projectApi'

const backendUrl = 'https://server-flow-3.onrender.com'.replace(/\/$/, '')

// How often the browser asks the backend "how far along is this build?"
const POLL_INTERVAL_MS = 1200

// Mirrors the `phase` values the MCP server's build job reports.
const PHASE_LABELS = {
  queued: 'Queued',
  planning: 'Planning the file structure',
  writing: 'Generating project files',
  verifying: 'Verifying the build',
  repairing: 'Fixing issues found in review',
  done: 'Done',
  failed: 'Failed',
}

const INITIAL_PROGRESS = {
  phase: 'queued',
  percent: 0,
  currentStep: 0,
  totalSteps: 0,
  elapsedSec: 0,
  etaSec: null,
}

const formatTime = (seconds) => {
  const total = Math.max(0, Math.round(seconds || 0))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

const Chat_Box = () => {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Real build progress, filled in from the backend while a job is running.
  const [progress, setProgress] = useState(INITIAL_PROGRESS)
  const [progressVisible, setProgressVisible] = useState(false)

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

  const pollRef = useRef(null)
  const tickRef = useRef(null)
  const announcedPhasesRef = useRef(new Set())

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isLoading, progress.percent])

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
      stopProgressPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const stopProgressPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  // Narrate a phase change once, the first time we see it, instead of once per poll.
  const announcePhaseChange = (phase) => {
    if (!phase || announcedPhasesRef.current.has(phase)) return
    announcedPhasesRef.current.add(phase)

    const label = PHASE_LABELS[phase]
    if (!label || phase === 'queued' || phase === 'done' || phase === 'failed') return

    setMessages((prev) => [
      ...prev,
      {
        id: `phase-${phase}-${Date.now()}`,
        role: 'assistant',
        content: `${label}...`,
      },
    ])
  }

  const fetchJobStatus = async (jobId) => {
    const res = await fetch(`${backendUrl}/chat/status/${jobId}`)
    if (!res.ok) {
      throw new Error(`Progress check failed (status ${res.status}).`)
    }
    return res.json()
  }

  // Polls a running build job until it finishes, updating `progress` along the way.
  // Resolves with the final report, or rejects with the error the job failed with.
  const trackJob = (jobId) =>
    new Promise((resolve, reject) => {
      announcedPhasesRef.current = new Set()
      setProgress(INITIAL_PROGRESS)
      setProgressVisible(true)

      let consecutiveFailures = 0
      const MAX_CONSECUTIVE_FAILURES = 10 // ~12s of a dead connection before we give up

      const poll = async () => {
        try {
          const status = await fetchJobStatus(jobId)
          consecutiveFailures = 0
          const p = status.progress || {}

          setProgress({
            phase: p.phase || 'queued',
            percent: Math.max(0, Math.min(100, p.percent ?? 0)),
            currentStep: p.current_step ?? 0,
            totalSteps: p.total_steps ?? 0,
            elapsedSec: p.elapsed_sec ?? 0,
            etaSec: p.eta_sec ?? null,
          })
          announcePhaseChange(p.phase)

          if (status.status === 'done') {
            stopProgressPolling()
            resolve(status.report || {})
          } else if (status.status === 'error') {
            stopProgressPolling()
            reject(new Error(status.error || 'The build failed.'))
          }
        } catch (err) {
          // A single dropped poll shouldn't kill the whole build - just log it and try again.
          // But if the connection stays down, give up instead of polling forever.
          consecutiveFailures += 1
          console.error(`progress poll error (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}):`, err)
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            stopProgressPolling()
            reject(new Error('Lost connection to the Build Assistant while checking progress.'))
          }
        }
      }

      pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
      poll()

      // Ticks the elapsed-time display locally between polls so it never looks frozen.
      tickRef.current = setInterval(() => {
        setProgress((prev) =>
          prev.phase === 'done' || prev.phase === 'failed'
            ? prev
            : { ...prev, elapsedSec: prev.elapsedSec + 1 }
        )
      }, 1000)
    })

  // Starts a real progress-tracked build. Returns `false` if the backend doesn't
  // support job mode yet (no /chat/start route), so the caller can fall back.
  const runBuildViaJob = async (configuration) => {
    const startRes = await fetch(`${backendUrl}/chat/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        master_json: configuration,
        project_id: projectId,
      }),
    })

    if (startRes.status === 404) {
      setProgressVisible(false)
      return false
    }
    if (!startRes.ok) {
      throw new Error('Unable to start the build.')
    }

    const { job_id: jobId } = await startRes.json()
    if (!jobId) {
      return false
    }

    const report = await trackJob(jobId)
    const filesWritten = report.files_written?.length ?? 0

    let content = 'Build completed successfully.'
    if (report.status === 'complete') {
      content = `Build completed successfully — ${filesWritten} file${filesWritten === 1 ? '' : 's'} generated.`
    } else if (report.status === 'complete_with_issues') {
      const openIssues = report.issues_remaining?.length ?? 0
      content = `Build completed with ${openIssues} open issue${openIssues === 1 ? '' : 's'} — ${filesWritten} file${filesWritten === 1 ? '' : 's'} generated.`
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `build-${Date.now()}`,
        role: 'assistant',
        content,
      },
    ])

    return true
  }

  // Original blocking build, kept as a fallback for a backend that hasn't added
  // /chat/start + /chat/status/:id yet.
  const runBuildLegacy = async (configuration) => {
    const buildRequest = configuration
      ? fetch(`${backendUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          master_json: configuration,
          project_id: projectId,
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
    if (result.cloudinary_url && projectId) {
      await saveCloudinaryUrl(projectId, result.cloudinary_url)
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `build-${Date.now()}`,
        role: 'assistant',
        content: result.reply || 'Build completed successfully.',
      },
    ])
  }

  const runBuild = async (configuration) => {
    if (!configuration) {
      setMessages((prev) => [
        ...prev,
        {
          id: `build-${Date.now()}`,
          role: 'assistant',
          content: 'Build completed successfully.',
        },
      ])
      return
    }

    const usedJobMode = await runBuildViaJob(configuration)
    if (!usedJobMode) {
      await runBuildLegacy(configuration)
    }

    const nextPath = projectId
      ? `/playground/download?projectId=${encodeURIComponent(projectId)}`
      : '/playground/download'
    window.location.assign(nextPath)
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
      setProgressVisible(false)
      setProgress(INITIAL_PROGRESS)

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
        setProgressVisible(false)
        stopProgressPolling()
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

          {/* Real progress bar, once the backend confirms it supports job mode */}
          {isLoading && progressVisible && (
            <div className="flex w-full justify-start">
              <div className="w-[85%] rounded-xl rounded-bl-sm bg-zinc-800 px-3 py-3 text-sm text-zinc-100">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{PHASE_LABELS[progress.phase] || progress.phase}</span>
                  <span className="font-mono font-semibold text-zinc-100">
                    {Math.round(progress.percent)}%
                  </span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
                    style={{ width: `${Math.max(4, progress.percent)}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>
                    {progress.totalSteps
                      ? `${progress.currentStep}/${progress.totalSteps} files`
                      : '\u00A0'}
                  </span>
                  <span>
                    {formatTime(progress.elapsedSec)}
                    {progress.phase === 'writing' && progress.etaSec != null
                      ? ` · ~${formatTime(progress.etaSec)} left`
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback indeterminate loader - shown only while we haven't confirmed job mode yet */}
          {isLoading && !progressVisible && (
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
