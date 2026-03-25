import type { SessionStatus } from "../types/index.js"

const STATUS_STYLES: Record<SessionStatus, string> = {
  queued: "bg-yellow-900/30 text-yellow-400 border border-yellow-800",
  running: "bg-claude/10 text-claude-light border border-claude/30",
  completed: "bg-green-900/30 text-green-400 border border-green-800",
  failed: "bg-red-900/30 text-red-400 border border-red-800",
  waiting_for_input: "bg-purple-900/30 text-purple-400 border border-purple-800",
  timed_out: "bg-gray-800 text-gray-400 border border-gray-700",
  cancelled: "bg-gray-800 text-gray-500 border border-gray-700",
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  waiting_for_input: "Ready",
  timed_out: "Timed Out",
  cancelled: "Cancelled",
}

const StatusBadge = ({ status }: { readonly status: SessionStatus }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
  >
    {status === "running" && (
      <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-claude" />
    )}
    {STATUS_LABELS[status]}
  </span>
)

export { StatusBadge }
