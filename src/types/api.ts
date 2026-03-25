import type { Session, RepoSource, PermissionMode, ModelChoice } from "./session.js"

// Generic API response wrapper
export interface ApiResponse<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly meta?: PaginationMeta
}

export interface PaginationMeta {
  readonly total: number
  readonly page: number
  readonly limit: number
}

// POST /api/tasks
export interface CreateTaskRequest {
  readonly prompt: string
  readonly repoSource: RepoSource
  readonly rules?: string
  readonly permissionMode?: PermissionMode
  readonly model?: ModelChoice
  readonly maxTurns?: number
  readonly maxBudgetUsd?: number
}

// GitHub API types
export interface GitHubOrg {
  readonly login: string
  readonly avatarUrl: string
}

export interface GitHubRepo {
  readonly name: string
  readonly fullName: string
  readonly url: string
  readonly description: string | null
  readonly language: string | null
  readonly defaultBranch: string
  readonly updatedAt: string
  readonly archived: boolean
}

export type CreateTaskResponse = ApiResponse<Session>

// GET /api/tasks
export interface ListTasksQuery {
  readonly page?: number
  readonly limit?: number
  readonly status?: string
}

export type ListTasksResponse = ApiResponse<readonly Session[]>

// GET /api/tasks/:id
export type GetTaskResponse = ApiResponse<Session>

// POST /api/tasks/:id/cancel
export type CancelTaskResponse = ApiResponse<{ readonly cancelled: boolean }>

// Auth user info (from JWT claims)
export interface AuthUser {
  readonly id: string
  readonly login: string
  readonly name?: string
  readonly picture?: string
}
