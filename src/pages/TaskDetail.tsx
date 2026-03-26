import { useEffect, useState, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import type { Session, DashboardOutputMessage } from "../types/index.js"
import { api } from "../lib/api-client.js"
import { useSessionSocket } from "../hooks/useSessionSocket.js"
import { StatusBadge } from "../components/StatusBadge.js"
import { SessionOutput } from "../components/SessionOutput.js"
import { QuestionDialog } from "../components/QuestionDialog.js"

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [followUpText, setFollowUpText] = useState("")
  const [retrying, setRetrying] = useState(false)
  const [initialOutputs, setInitialOutputs] = useState<DashboardOutputMessage[]>([])
  const { outputs, questions, status, result: liveResult, sendAnswer, cancel, sendFollowUp, endSession } = useSessionSocket(id ?? null, initialOutputs)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.getTask(id),
      api.getMessages(id),
    ])
      .then(([taskRes, msgRes]) => {
        if (taskRes.success && taskRes.data) {
          setSession(taskRes.data)
        }
        if (msgRes.success && msgRes.data) {
          setInitialOutputs(
            msgRes.data.map((m) => ({
              type: "output" as const,
              sessionId: id,
              text: m.role === "user" ? `**You:** ${m.content}` : m.content,
              toolName: m.toolName,
              timestamp: m.createdAt,
            })),
          )
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleRetry = useCallback(async () => {
    if (!session || retrying) return
    setRetrying(true)
    try {
      const response = await api.createTask({
        prompt: session.prompt,
        repoSource: session.repoSource,
        ...(session.rules ? { rules: session.rules } : {}),
        permissionMode: session.permissionMode,
        model: session.model,
        maxTurns: session.maxTurns,
      })
      if (response.success && response.data) {
        navigate(`/tasks/${response.data.id}`)
      }
    } catch {
      setRetrying(false)
    }
  }, [session, retrying, navigate])

  const [exportError, setExportError] = useState<string | null>(null)
  const [resuming, setResuming] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const handleResume = useCallback(async () => {
    if (!session || !id || resuming) return
    setResuming(true)
    setResumeError(null)
    try {
      const response = await api.resumeTask(id)
      if (response.success && response.data) {
        navigate(`/tasks/${response.data.id}`)
      }
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Resume failed")
      setResuming(false)
    }
  }, [session, id, resuming, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-red-400">Task not found</p>
      </div>
    )
  }

  const currentStatus = status ?? session.status
  const isWaiting = currentStatus === "waiting_for_input"
  const isRunning = currentStatus === "running"
  const isActive = isWaiting || isRunning

  const handleSendFollowUp = () => {
    if (!followUpText.trim() || !isWaiting) return
    sendFollowUp(followUpText.trim())
    setFollowUpText("")
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link to="/" className="text-gray-500 hover:text-gray-300">
            &larr; Back
          </Link>
          <h1 className="text-sm font-medium text-gray-300">CC Fleet</h1>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-3">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-200">{session.prompt}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span>
                {session.repoSource.mode === "direct"
                  ? session.repoSource.repos.map((r) => r.url.replace(/^https?:\/\//, "").replace(/\.git$/, "")).join(", ")
                  : session.repoSource.mode === "org"
                    ? `${session.repoSource.org}${session.repoSource.pattern ? `/${session.repoSource.pattern}` : ""}`
                    : `${session.repoSource.org} (discovery)`}
              </span>
              {(liveResult ?? session.result) && (
                <>
                  {(liveResult ?? session.result)!.costUsd !== undefined && (
                    <span className="text-claude">${(liveResult ?? session.result)!.costUsd!.toFixed(4)}</span>
                  )}
                  {(liveResult ?? session.result)!.turnsUsed !== undefined && (
                    <span>{(liveResult ?? session.result)!.turnsUsed} turns</span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={currentStatus} />
            {isWaiting && (
              <button
                onClick={endSession}
                className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
              >
                End Session
              </button>
            )}
            {isActive && (
              <button
                onClick={cancel}
                className="rounded border border-red-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30"
              >
                Cancel
              </button>
            )}
            {(currentStatus === "failed" || currentStatus === "cancelled" || currentStatus === "completed") && (
              <>
                {session.cliSessionId && (
                  <button
                    onClick={handleResume}
                    disabled={resuming}
                    className="rounded border border-claude bg-claude/10 px-3 py-1.5 text-xs text-claude hover:bg-claude/20 disabled:opacity-50"
                  >
                    {resuming ? "Resuming..." : "Resume"}
                  </button>
                )}
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                >
                  {retrying ? "Retrying..." : "Retry"}
                </button>
                {session.cliSessionId && (
                  <button
                    onClick={async () => {
                      setExportError(null)
                      try {
                        const jsonl = await api.exportSession(id!)
                        const blob = new Blob([jsonl], { type: "application/x-ndjson" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `${session.cliSessionId}.jsonl`
                        a.click()
                        URL.revokeObjectURL(url)
                      } catch (err) {
                        setExportError(err instanceof Error ? err.message : "Export failed")
                      }
                    }}
                    className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
                  >
                    Export
                  </button>
                )}
                {resumeError && (
                  <span className="text-xs text-red-400">{resumeError}</span>
                )}
                {exportError && (
                  <span className="text-xs text-red-400">{exportError}</span>
                )}
              </>
            )}
          </div>
        </div>

        {session.result?.prUrl && (
          <div className="mb-3">
            <a
              href={session.result.prUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-claude hover:underline"
            >
              View PR
            </a>
          </div>
        )}

        <div className="flex-1">
          <SessionOutput outputs={outputs} />
        </div>

        {/* Follow-up input */}
        {isWaiting && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && followUpText.trim()) handleSendFollowUp()
              }}
              placeholder="Send a follow-up message..."
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-claude focus:outline-none"
            />
            <button
              onClick={handleSendFollowUp}
              disabled={!followUpText.trim()}
              className="rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark disabled:opacity-50"
            >
              Send
            </button>
          </div>
        )}

        {/* Running indicator */}
        {isRunning && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-claude" />
            Claude is working...
          </div>
        )}

        {questions && (
          <QuestionDialog questions={questions} onAnswer={sendAnswer} />
        )}
      </main>
    </div>
  )
}

export { TaskDetail }
