import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import type { Session } from "../types/index.js"
import { api } from "../lib/api-client.js"
import { useSessionSocket } from "../hooks/useSessionSocket.js"
import { StatusBadge } from "../components/StatusBadge.js"
import { SessionOutput } from "../components/SessionOutput.js"
import { QuestionDialog } from "../components/QuestionDialog.js"

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { outputs, questions, status, sendAnswer, cancel } = useSessionSocket(id ?? null)

  useEffect(() => {
    if (!id) return
    api
      .getTask(id)
      .then((response) => {
        if (response.success && response.data) {
          setSession(response.data)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Task not found</p>
      </div>
    )
  }

  const currentStatus = status ?? session.status

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link to="/" className="text-gray-500 hover:text-gray-300">
            &larr; Back
          </Link>
          <h1 className="text-sm font-medium text-gray-300">CC Fleet</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-3">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-200">{session.prompt}</p>
            <p className="mt-1 text-xs text-gray-500">
              {session.repoSource.mode === "direct"
                ? session.repoSource.repos.map((r) => r.url.replace(/^https?:\/\//, "").replace(/\.git$/, "")).join(", ")
                : session.repoSource.mode === "org"
                  ? `${session.repoSource.org}${session.repoSource.pattern ? `/${session.repoSource.pattern}` : ""}`
                  : `${session.repoSource.org} (discovery)`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={currentStatus} />
            {(currentStatus === "running" || currentStatus === "waiting_for_input") && (
              <button
                onClick={cancel}
                className="rounded border border-red-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {session.result && (
          <div className="mb-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-200">{session.result.summary}</p>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              {session.result.costUsd !== undefined && (
                <span>Cost: ${session.result.costUsd.toFixed(2)}</span>
              )}
              {session.result.turnsUsed !== undefined && (
                <span>Turns: {session.result.turnsUsed}</span>
              )}
              {session.result.prUrl && (
                <a
                  href={session.result.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  View PR
                </a>
              )}
            </div>
          </div>
        )}

        <SessionOutput outputs={outputs} />

        {questions && (
          <QuestionDialog questions={questions} onAnswer={sendAnswer} />
        )}
      </main>
    </div>
  )
}

export { TaskDetail }
