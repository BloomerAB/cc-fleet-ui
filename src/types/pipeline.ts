export interface StageDefinition {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly permissionMode: string
  readonly transition: "auto" | "manual"
}

export interface PipelineDefinition {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly stages: readonly StageDefinition[]
}

export interface StageState {
  readonly pipelineId: string
  readonly currentStageIndex: number
  readonly stageResults: readonly StageResult[]
  readonly stageStartedAt: string | null
}

export interface StageResult {
  readonly stageId: string
  readonly status: "completed" | "skipped"
  readonly completedAt: string
}
