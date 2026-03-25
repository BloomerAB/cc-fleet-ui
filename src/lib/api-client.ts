import type {
  CreateTaskRequest,
  CreateTaskResponse,
  ListTasksResponse,
  GetTaskResponse,
  CancelTaskResponse,
  ApiResponse,
  GitHubOrg,
  GitHubRepo,
} from "../types/index.js"
import { getToken } from "./auth.js"

const BASE_URL = "/api"

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

const api = {
  createTask: (data: CreateTaskRequest): Promise<CreateTaskResponse> =>
    request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listTasks: (page = 1, limit = 20): Promise<ListTasksResponse> =>
    request(`/tasks?page=${page}&limit=${limit}`),

  getTask: (id: string): Promise<GetTaskResponse> =>
    request(`/tasks/${id}`),

  cancelTask: (id: string): Promise<CancelTaskResponse> =>
    request(`/tasks/${id}/cancel`, { method: "POST" }),

  deleteTask: (id: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    request(`/tasks/${id}`, { method: "DELETE" }),

  // Settings
  getSettings: (): Promise<ApiResponse<{ hasAnthropicKey: boolean; rules: string; authMode?: "apiKey" | "subscription"; claudeSettings?: string }>> =>
    request("/settings"),

  updateSettings: (data: { anthropicApiKey?: string; rules?: string; claudeSettings?: string }): Promise<ApiResponse<null>> =>
    request("/settings", { method: "PUT", body: JSON.stringify(data) }),

  removeAnthropicKey: (): Promise<ApiResponse<null>> =>
    request("/settings/anthropic-key", { method: "DELETE" }),

  getMessages: (id: string): Promise<ApiResponse<readonly { id: string; role: string; content: string; toolName?: string; createdAt: string }[]>> =>
    request(`/tasks/${id}/messages`),

  // GitHub endpoints
  listOrgs: (): Promise<ApiResponse<readonly GitHubOrg[]>> =>
    request("/github/orgs"),

  listRepos: (org: string, pattern?: string): Promise<ApiResponse<readonly GitHubRepo[]>> => {
    const params = new URLSearchParams({ org })
    if (pattern) params.set("pattern", pattern)
    return request(`/github/repos?${params}`)
  },
}

export { api }
