import type {
  CreateTaskRequest,
  CreateTaskResponse,
  ListTasksResponse,
  GetTaskResponse,
  CancelTaskResponse,
  ApiResponse,
  GitHubOrg,
  GitHubRepo,
  PipelineDefinition,
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
  getSettings: (): Promise<ApiResponse<{ hasAnthropicKey: boolean; rules: string; authMode?: "apiKey" | "subscription"; claudeSettings?: string; hasKubeconfig?: boolean }>> =>
    request("/settings"),

  updateSettings: (data: { anthropicApiKey?: string; rules?: string; claudeSettings?: string; kubeconfig?: string }): Promise<ApiResponse<null>> =>
    request("/settings", { method: "PUT", body: JSON.stringify(data) }),

  removeAnthropicKey: (): Promise<ApiResponse<null>> =>
    request("/settings/anthropic-key", { method: "DELETE" }),

  resumeTask: (id: string): Promise<ApiResponse<{ id: string }>> =>
    request(`/tasks/${id}/resume`, { method: "POST" }),

  exportSession: async (id: string): Promise<string> => {
    const token = getToken()
    const response = await fetch(`${BASE_URL}/tasks/${id}/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`)
    }
    return response.text()
  },

  importSession: (jsonl: string, prompt?: string): Promise<ApiResponse<{ id: string; cliSessionId: string }>> =>
    request("/tasks/import", {
      method: "POST",
      body: JSON.stringify({ jsonl, prompt }),
    }),

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

  generateApiToken: (): Promise<ApiResponse<{ token: string }>> =>
    request("/settings/api-token", { method: "POST" }),

  // Pipelines
  listPipelines: (): Promise<ApiResponse<readonly PipelineDefinition[]>> =>
    request("/pipelines"),

  createPipeline: (pipeline: PipelineDefinition): Promise<ApiResponse<PipelineDefinition>> =>
    request("/pipelines", { method: "POST", body: JSON.stringify({ pipeline }) }),

  deletePipeline: (id: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    request(`/pipelines/${id}`, { method: "DELETE" }),

  advanceStage: (id: string): Promise<ApiResponse<null>> =>
    request(`/tasks/${id}/advance-stage`, { method: "POST" }),

  skipStage: (id: string): Promise<ApiResponse<null>> =>
    request(`/tasks/${id}/skip-stage`, { method: "POST" }),
}

export { api }
