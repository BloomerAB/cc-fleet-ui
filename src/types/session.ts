export type SessionStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "waiting_for_input"
  | "timed_out"
  | "cancelled"

export interface RepoConfig {
  readonly url: string
  readonly branch?: string
}

export interface DirectRepoSource {
  readonly mode: "direct"
  readonly repos: readonly RepoConfig[]
}

export interface OrgRepoSource {
  readonly mode: "org"
  readonly org: string
  readonly pattern?: string
}

export interface DiscoveryRepoSource {
  readonly mode: "discovery"
  readonly org: string
  readonly hint?: string
}

export type RepoSource = DirectRepoSource | OrgRepoSource | DiscoveryRepoSource

export type RepoSourceMode = RepoSource["mode"]

export type PermissionMode = "plan" | "acceptEdits" | "bypassPermissions"
export type ModelChoice = "sonnet" | "opus"

export interface TaskConfig {
  readonly prompt: string
  readonly repoSource: RepoSource
  readonly maxTurns?: number
  readonly maxBudgetUsd?: number
  readonly deadlineSeconds?: number
}

export interface Session {
  readonly id: string
  readonly userId: string
  readonly status: SessionStatus
  readonly prompt: string
  readonly repoSource: RepoSource
  readonly repos: readonly RepoConfig[]
  readonly rules: string | null
  readonly permissionMode: PermissionMode
  readonly model: ModelChoice
  readonly cliSessionId: string | null
  readonly pipelineId: string | null
  readonly maxTurns: number
  readonly maxBudgetUsd: number
  readonly deadlineSeconds: number
  readonly result: SessionResult | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly startedAt: string | null
  readonly completedAt: string | null
}

export interface SessionResult {
  readonly success: boolean
  readonly summary: string
  readonly prUrl?: string
  readonly costUsd?: number
  readonly turnsUsed?: number
}
