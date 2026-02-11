import type { SessionStatus } from "@bloomer-ab/claude-types"

const STATUS_STYLES: Record<SessionStatus, string> = {
  queued: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  waiting_for_input: "bg-purple-100 text-purple-800",
  timed_out: "bg-gray-100 text-gray-800",
  cancelled: "bg-gray-100 text-gray-500",
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  waiting_for_input: "Waiting for Input",
  timed_out: "Timed Out",
  cancelled: "Cancelled",
}

const StatusBadge = ({ status }: { readonly status: SessionStatus }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
  >
    {status === "running" && (
      <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
    )}
    {STATUS_LABELS[status]}
  </span>
)

export { StatusBadge }
