import { useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { Session } from "../types/index.js"
import { StatusBadge } from "./StatusBadge.js"
import { api } from "../lib/api-client.js"
import { useAuth } from "../hooks/useAuth.js"

const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

interface SessionSidebarProps {
  readonly sessions: readonly Session[]
  readonly loading: boolean
  readonly error: string | null
  readonly onImported: () => void
}

const SessionSidebar = ({ sessions, loading, error, onImported }: SessionSidebarProps) => {
  const { id: activeId } = useParams<{ id: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    try {
      const jsonl = await file.text()
      const response = await api.importSession(jsonl)
      if (response.success && response.data) {
        onImported()
        navigate(`/tasks/${response.data.id}`)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import session")
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <aside className="hidden md:flex md:w-[280px] md:flex-shrink-0 md:flex-col border-r border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-100">CC Fleet</h1>
          <div className="flex items-center gap-2">
            <Link to="/settings" className="text-xs text-gray-400 hover:text-gray-200" title="Settings">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-200"
              title="Sign out"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        {user && (
          <p className="mt-1 text-xs text-gray-500">{user.login}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-2">
        <Link
          to="/tasks/new"
          className="flex-1 rounded-lg bg-claude px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-claude-dark"
        >
          New Task
        </Link>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
          title="Import session"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jsonl"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {importError && (
        <div className="mx-4 mt-2 rounded border border-red-800 bg-red-900/30 px-3 py-2 text-xs text-red-400">
          {importError}
        </div>
      )}

      {/* Session list */}
      <nav className="flex-1 overflow-y-auto">
        {loading && <p className="px-4 py-3 text-xs text-gray-500">Loading...</p>}
        {error && <p className="px-4 py-3 text-xs text-red-400">{error}</p>}

        {sessions.map((session) => {
          const isActive = session.id === activeId
          return (
            <Link
              key={session.id}
              to={`/tasks/${session.id}`}
              className={`block border-b border-gray-800/50 px-4 py-3 transition-colors hover:bg-gray-800/50 ${
                isActive ? "border-l-2 border-l-claude bg-gray-800/30" : ""
              }`}
            >
              <p className="truncate text-sm text-gray-200">
                {session.prompt.slice(0, 60)}
                {session.prompt.length > 60 ? "..." : ""}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={session.status} />
                {session.stageState && session.pipelineId && session.status !== "completed" && (
                  <span className="text-xs text-claude">
                    stage {session.stageState.currentStageIndex + 1}
                  </span>
                )}
                <span className="text-xs text-gray-500">{timeAgo(session.createdAt)}</span>
                {session.result?.costUsd !== undefined && (
                  <span className="text-xs text-gray-500">${session.result.costUsd.toFixed(2)}</span>
                )}
              </div>
            </Link>
          )
        })}

        {!loading && sessions.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-500">No sessions yet</p>
          </div>
        )}
      </nav>
    </aside>
  )
}

export { SessionSidebar }
