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
    <div className="flex items-center gap-3">
      {/* Current stage label */}
      {currentStage && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-claude" />
          <span className="text-sm font-medium text-claude-light">{currentStage.name}</span>
        </div>
      )}

      {/* Stage progress pills */}
      <div className="flex items-center gap-1">
        {stages.map((stage, index) => {
          const status = getStageStatus(index)
          return (
            <div
              key={stage.id}
              title={`${stage.name}${status === "active" ? " (current)" : status === "completed" ? " (done)" : status === "skipped" ? " (skipped)" : ""}`}
              className={`h-1.5 rounded-full transition-colors ${
                stages.length <= 6 ? "w-8" : "w-5"
              } ${
                status === "completed"
                  ? "bg-green-500"
                  : status === "skipped"
                    ? "bg-gray-600"
                    : status === "active"
                      ? "bg-claude"
                      : "bg-gray-700"
              }`}
            />
          )
        })}
      </div>

      {/* Stage counter */}
      <span className="text-xs text-gray-500">
        {currentStageIndex + 1}/{stages.length}
      </span>

      {/* Manual controls */}
      {showManualControls && (
        <div className="flex gap-1.5">
          <button
            onClick={onAdvance}
            className="rounded border border-claude bg-claude/10 px-2.5 py-0.5 text-xs font-medium text-claude hover:bg-claude/20"
          >
            Next
          </button>
          <button
            onClick={onSkip}
            className="rounded border border-gray-700 px-2.5 py-0.5 text-xs text-gray-400 hover:bg-gray-800"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  )
}

export { StageIndicator }
