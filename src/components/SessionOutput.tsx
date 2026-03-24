import { useEffect, useRef } from "react"
import type { DashboardOutputMessage } from "@bloomerab/cc-fleet-types"

interface SessionOutputProps {
  readonly outputs: readonly DashboardOutputMessage[]
}

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
      className="h-[600px] overflow-y-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100"
    >
      {outputs.length === 0 && (
        <p className="text-gray-500">Waiting for output...</p>
      )}
      {outputs.map((output, i) => (
        <div key={i} className="mb-2">
          {output.toolName && (
            <span className="mr-2 text-xs font-semibold text-cyan-400">
              [{output.toolName}]
            </span>
          )}
          <span className="whitespace-pre-wrap break-words">{output.text}</span>
        </div>
      ))}
    </div>
  )
}

export { SessionOutput }
