import { useEffect, useRef } from "react"
import type { DashboardOutputMessage } from "../types/index.js"

interface SessionOutputProps {
  readonly outputs: readonly DashboardOutputMessage[]
}

const ToolBlock = ({ toolName, text }: { readonly toolName: string; readonly text: string }) => {
  const isRead = toolName === "Read"
  const isWrite = toolName === "Write" || toolName === "Edit"
  const isBash = toolName === "Bash"
  const isSearch = toolName === "Grep" || toolName === "Glob"

  const iconColor = isBash
    ? "text-yellow-400"
    : isRead || isSearch
      ? "text-cyan-400"
      : isWrite
        ? "text-green-400"
        : "text-purple-400"

  // Try to extract meaningful info from tool input JSON
  let summary = text
  try {
    const parsed = JSON.parse(text)
    if (parsed.command) summary = parsed.command
    else if (parsed.file_path) summary = parsed.file_path
    else if (parsed.pattern) summary = `${parsed.pattern}${parsed.path ? ` in ${parsed.path}` : ""}`
    else if (parsed.path) summary = parsed.path
  } catch {
    // Not JSON, use as-is
  }

  return (
    <div className="my-1 rounded border border-gray-700 bg-gray-800/50">
      <div className="flex items-center gap-2 border-b border-gray-700 px-3 py-1.5">
        <span className={`text-xs font-bold ${iconColor}`}>{toolName}</span>
      </div>
      <div className="px-3 py-2">
        <pre className="whitespace-pre-wrap break-all text-xs text-gray-400">{summary}</pre>
      </div>
    </div>
  )
}

const AssistantMessage = ({ text }: { readonly text: string }) => (
  <div className="my-3 border-l-2 border-orange-500/50 pl-3">
    <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-100">{text}</pre>
  </div>
)

const SystemMessage = ({ text }: { readonly text: string }) => (
  <div className="my-2 text-center">
    <span className="text-xs text-gray-500">{text}</span>
  </div>
)

const SessionOutput = ({ outputs }: SessionOutputProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [outputs])

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-280px)] min-h-[400px] overflow-y-auto rounded-lg bg-gray-950 p-4 font-mono text-sm"
    >
      {outputs.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-2xl text-orange-500/30">&#9679;</div>
            <p className="text-sm text-gray-600">Waiting for output...</p>
          </div>
        </div>
      )}
      {outputs.map((output, i) => {
        if (output.text.startsWith("[System:")) {
          return <SystemMessage key={i} text={output.text} />
        }
        if (output.toolName) {
          return <ToolBlock key={i} toolName={output.toolName} text={output.text} />
        }
        return <AssistantMessage key={i} text={output.text} />
      })}
    </div>
  )
}

export { SessionOutput }
