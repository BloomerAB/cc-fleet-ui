import { useState } from "react"
import { Link } from "react-router-dom"
import type { Session } from "../types/index.js"
import { StatusBadge } from "./StatusBadge.js"
import { api } from "../lib/api-client.js"

const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const extractRepoName = (url: string): string => {
  const match = url.match(/\/([^/]+\/[^/]+?)(?:\.git)?$/)
  return match?.[1] ?? url
}

const formatRepoSource = (session: Session): string => {
  switch (session.repoSource.mode) {
    case "direct":
      return session.repoSource.repos.map((r) => extractRepoName(r.url)).join(", ")
    case "org":
      return session.repoSource.pattern
        ? `${session.repoSource.org}/${session.repoSource.pattern}`
        : session.repoSource.org
    case "discovery":
      return `${session.repoSource.org} (discovery)`
  }
}

interface SessionCardProps {
  readonly session: Session
  readonly onDeleted?: () => void
}

const SessionCard = ({ session, onDeleted }: SessionCardProps) => {
  const canDelete = session.status !== "running"

  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    try {
      await api.deleteTask(session.id)
      onDeleted?.()
    } catch (err) {
      console.error("Delete failed:", err)
      setDeleting(false)
    }
  }

  return (
    <Link
      to={`/tasks/${session.id}`}
      className="block rounded-lg border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-100">
            {session.prompt.slice(0, 100)}
            {session.prompt.length > 100 ? "..." : ""}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatRepoSource(session)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={session.status} />
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50"
              title="Delete session"
            >
              {deleting ? "..." : "x"}
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>{timeAgo(session.createdAt)}</span>
        {session.result?.costUsd !== undefined && (
          <span>${session.result.costUsd.toFixed(2)}</span>
        )}
        {session.result?.turnsUsed !== undefined && (
          <span>{session.result.turnsUsed} turns</span>
        )}
      </div>
    </Link>
  )
}

export { SessionCard }
// exported for tests
export { timeAgo, extractRepoName } // eslint-disable-line react-refresh/only-export-components
