import { Link } from "react-router-dom"
import { useSessions } from "../hooks/useSessions.js"
import { SessionCard } from "../components/SessionCard.js"
import { useAuth } from "../hooks/useAuth.js"

export function Dashboard() {
  const { sessions, loading, error } = useSessions()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Claude Platform</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-500">{user.login}</span>
            )}
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Sessions</h2>
          <Link
            to="/tasks/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Task
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading sessions...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
          {!loading && sessions.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
              <p className="text-gray-500">No sessions yet</p>
              <Link
                to="/tasks/new"
                className="mt-2 inline-block text-sm text-blue-600 hover:underline"
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
