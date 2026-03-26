import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSessions } from "../hooks/useSessions.js"
import { SessionCard } from "../components/SessionCard.js"
import { useAuth } from "../hooks/useAuth.js"
import { api } from "../lib/api-client.js"

const Dashboard = () => {
  const { sessions, loading, error, refetch } = useSessions()
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
        navigate(`/tasks/${response.data.id}`)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import session")
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-100">Claude Code Fleet</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-400">{user.login}</span>
            )}
            <Link to="/settings" className="text-sm text-gray-400 hover:text-gray-200">
              Settings
            </Link>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">Sessions</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
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
            <Link
              to="/tasks/new"
              className="rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark"
            >
              New Task
            </Link>
          </div>
        </div>

        {loading && <p className="text-gray-500">Loading sessions...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {importError && (
          <div className="mb-3 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
            Import failed: {importError}
          </div>
        )}

        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} onDeleted={refetch} />
          ))}
          {!loading && sessions.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gray-700 py-12 text-center">
              <p className="text-gray-500">No sessions yet</p>
              <Link
                to="/tasks/new"
                className="mt-2 inline-block text-sm text-claude hover:underline"
              >
                Create your first task
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export { Dashboard }
