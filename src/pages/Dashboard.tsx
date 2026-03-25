import { Link } from "react-router-dom"
import { useSessions } from "../hooks/useSessions.js"
import { SessionCard } from "../components/SessionCard.js"
import { useAuth } from "../hooks/useAuth.js"

const Dashboard = () => {
  const { sessions, loading, error, refetch } = useSessions()
  const { user, logout } = useAuth()

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
          <Link
            to="/tasks/new"
            className="rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark"
          >
            New Task
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading sessions...</p>}
        {error && <p className="text-red-400">{error}</p>}

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
