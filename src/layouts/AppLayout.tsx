import { Outlet, useParams, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useSessions } from "../hooks/useSessions.js"
import { SessionSidebar } from "../components/SessionSidebar.js"
import { MobileSessionDropdown } from "../components/MobileSessionDropdown.js"

const AppLayout = () => {
  const { sessions, loading, error, refetch } = useSessions()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // On desktop, if no session is selected and sessions exist, navigate to the most recent
  useEffect(() => {
    if (!id && !loading && sessions.length > 0) {
      navigate(`/tasks/${sessions[0].id}`, { replace: true })
    }
  }, [id, loading, sessions, navigate])

  const showEmptyState = !id && !loading && sessions.length === 0

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      {/* Mobile header + dropdown */}
      <MobileSessionDropdown
        sessions={sessions}
        loading={loading}
        onImported={refetch}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <SessionSidebar
          sessions={sessions}
          loading={loading}
          error={error}
          onImported={refetch}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {showEmptyState ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500">No sessions yet</p>
                <a
                  href="/tasks/new"
                  className="mt-2 inline-block text-sm text-claude hover:underline"
                >
                  Create your first task
                </a>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}

export { AppLayout }
