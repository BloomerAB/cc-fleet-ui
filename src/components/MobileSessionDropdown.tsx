import { useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { Session } from "../types/index.js"
import { StatusBadge } from "./StatusBadge.js"
import { useAuth } from "../hooks/useAuth.js"
import { api } from "../lib/api-client.js"

interface MobileSessionDropdownProps {
  readonly sessions: readonly Session[]
  readonly loading: boolean
  readonly onImported: () => void
}

const MobileSessionDropdown = ({ sessions, loading, onImported }: MobileSessionDropdownProps) => {
  const { id: activeId } = useParams<{ id: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const activeSession = sessions.find((s) => s.id === activeId)

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
        setOpen(false)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import")
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="md:hidden border-b border-gray-800 bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <h1 className="text-lg font-semibold text-gray-100">CC Fleet</h1>
        <div className="flex items-center gap-3">
          {user && <span className="text-xs text-gray-500">{user.login}</span>}
          <Link to="/settings" className="text-xs text-gray-400 hover:text-gray-200">
            Settings
          </Link>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-200">
            Sign out
          </button>
        </div>
      </div>

      {/* Session selector */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex flex-1 items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200"
        >
          <span className="truncate">
            {activeSession
              ? activeSession.prompt.slice(0, 40) + (activeSession.prompt.length > 40 ? "..." : "")
              : "Select session"}
          </span>
          <svg
            className={`ml-2 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <Link
          to="/tasks/new"
          className="rounded-lg bg-claude px-3 py-2 text-sm font-medium text-white hover:bg-claude-dark"
        >
          New
        </Link>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
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
        <div className="mx-4 mb-2 rounded border border-red-800 bg-red-900/30 px-3 py-2 text-xs text-red-400">
          {importError}
        </div>
      )}

      {/* Dropdown list */}
      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-gray-800">
          {loading && <p className="px-4 py-3 text-xs text-gray-500">Loading...</p>}
          {sessions.map((session) => {
            const isActive = session.id === activeId
            return (
              <Link
                key={session.id}
                to={`/tasks/${session.id}`}
                onClick={() => setOpen(false)}
                className={`block border-b border-gray-800/50 px-4 py-2 transition-colors hover:bg-gray-800/50 ${
                  isActive ? "border-l-2 border-l-claude bg-gray-800/30" : ""
                }`}
              >
                <p className="truncate text-sm text-gray-200">
                  {session.prompt.slice(0, 60)}
                  {session.prompt.length > 60 ? "..." : ""}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={session.status} />
                  {session.result?.costUsd !== undefined && (
                    <span className="text-xs text-gray-500">${session.result.costUsd.toFixed(2)}</span>
                  )}
                </div>
              </Link>
            )
          })}
          {!loading && sessions.length === 0 && (
            <p className="px-4 py-3 text-xs text-gray-500">No sessions yet</p>
          )}
        </div>
      )}
    </div>
  )
}

export { MobileSessionDropdown }
