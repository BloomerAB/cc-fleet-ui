import { Link } from "react-router-dom"
import type { Session } from "@bloomer-ab/claude-types"
import { StatusBadge } from "./StatusBadge.js"

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function extractRepoName(url: string): string {
  const match = url.match(/\/([^/]+\/[^/]+?)(?:\.git)?$/)
  return match?.[1] ?? url
}

export function SessionCard({ session }: { readonly session: Session }) {
  return (
    <Link
      to={`/tasks/${session.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {session.taskConfig.prompt.slice(0, 100)}
            {session.taskConfig.prompt.length > 100 ? "..." : ""}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {extractRepoName(session.taskConfig.repoUrl)}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
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
