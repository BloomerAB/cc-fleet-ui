import type { StageDefinition, StageState } from "../types/index.js"

interface StageIndicatorProps {
  readonly stages: readonly StageDefinition[]
  readonly stageState: StageState
  readonly isWaiting: boolean
  readonly onAdvance: () => void
  readonly onSkip: () => void
}

const StageIndicator = ({ stages, stageState, isWaiting, onAdvance, onSkip }: StageIndicatorProps) => {
  const { currentStageIndex, stageResults } = stageState

  const getStageStatus = (index: number): "completed" | "skipped" | "active" | "future" => {
    const result = stageResults.find((r) => r.stageId === stages[index]?.id)
    if (result) return result.status
    if (index === currentStageIndex) return "active"
    return "future"
  }

  const currentStage = stages[currentStageIndex]
  const showManualControls = isWaiting && currentStage?.transition === "manual"

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      {/* Stage pills */}
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage, index) => {
          const status = getStageStatus(index)
          return (
            <div key={stage.id} className="flex items-center gap-2">
              {index > 0 && (
                <div
                  className={`hidden h-px w-4 sm:block ${
                    status === "completed" || status === "skipped" ? "bg-gray-600" : "bg-gray-800"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === "completed"
                    ? "bg-green-900/40 text-green-400 border border-green-800"
                    : status === "skipped"
                      ? "bg-gray-800 text-gray-500 border border-gray-700 line-through"
                      : status === "active"
                        ? "bg-claude/15 text-claude-light border border-claude"
                        : "bg-gray-800/50 text-gray-500 border border-gray-800"
                }`}
              >
                {status === "completed" && (
                  <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {status === "active" && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-claude" />
                )}
                {stage.name}
              </div>
            </div>
          )
        })}
      </div>

      {/* Current stage description + actions */}
      {currentStage && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            Stage {currentStageIndex + 1}/{stages.length}: {currentStage.description}
          </p>
          {showManualControls && (
            <div className="flex gap-2">
              <button
                onClick={onAdvance}
                className="rounded border border-claude bg-claude/10 px-3 py-1 text-xs font-medium text-claude hover:bg-claude/20"
              >
                Next Stage
              </button>
              <button
                onClick={onSkip}
                className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:bg-gray-800"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { StageIndicator }
