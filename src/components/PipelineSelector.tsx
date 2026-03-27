import { useEffect, useState } from "react"
import type { PipelineDefinition } from "../types/index.js"
import { api } from "../lib/api-client.js"

interface PipelineSelectorProps {
  readonly value: string | null
  readonly onChange: (pipelineId: string | null) => void
}

const PipelineSelector = ({ value, onChange }: PipelineSelectorProps) => {
  const [pipelines, setPipelines] = useState<readonly PipelineDefinition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await api.listPipelines()
        if (response.success && response.data) {
          setPipelines(response.data)
        }
      } catch {
        // Pipelines are optional — silently ignore errors
      } finally {
        setLoading(false)
      }
    }
    fetchPipelines()
  }, [])

  if (loading) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Workflow Pipeline</label>
        <div className="py-2 text-sm text-gray-500">Loading pipelines...</div>
      </div>
    )
  }

  if (pipelines.length === 0) {
    return null
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">Workflow Pipeline</label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* No pipeline option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
            value === null
              ? "border-claude bg-claude/10 text-claude-light"
              : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
          }`}
        >
          <span className="font-medium">Freestyle</span>
          <p className="mt-0.5 text-xs text-gray-500">No pipeline stages</p>
        </button>

        {/* Pipeline options */}
        {pipelines.map((pipeline) => (
          <button
            key={pipeline.id}
            type="button"
            onClick={() => onChange(pipeline.id)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              value === pipeline.id
                ? "border-claude bg-claude/10 text-claude-light"
                : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
            }`}
          >
            <span className="font-medium">{pipeline.name}</span>
            {pipeline.description && (
              <p className="mt-0.5 text-xs text-gray-500">{pipeline.description}</p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {pipeline.stages.map((stage) => (
                <span
                  key={stage.id}
                  className="rounded-full bg-gray-700/50 px-2 py-0.5 text-[10px] text-gray-400"
                >
                  {stage.name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export { PipelineSelector }
