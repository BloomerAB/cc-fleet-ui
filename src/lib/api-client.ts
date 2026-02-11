import type {
  CreateTaskRequest,
  CreateTaskResponse,
  ListTasksResponse,
  GetTaskResponse,
  CancelTaskResponse,
} from "@bloomer-ab/claude-types"
import { getToken } from "./auth.js"

const BASE_URL = "/api"

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  createTask(data: CreateTaskRequest): Promise<CreateTaskResponse> {
    return request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  listTasks(page = 1, limit = 20): Promise<ListTasksResponse> {
    return request(`/tasks?page=${page}&limit=${limit}`)
  },

  getTask(id: string): Promise<GetTaskResponse> {
    return request(`/tasks/${id}`)
  },

  cancelTask(id: string): Promise<CancelTaskResponse> {
    return request(`/tasks/${id}/cancel`, { method: "POST" })
  },

  exchangeCode(code: string, state: string) {
    return request<{ success: boolean; data: { token: string; user: { id: string; login: string; avatarUrl: string } } }>(
      "/auth/github/callback",
      {
        method: "POST",
        body: JSON.stringify({ code, state }),
      },
    )
  },
}
