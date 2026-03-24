import type {
  CreateTaskRequest,
  CreateTaskResponse,
  ListTasksResponse,
  GetTaskResponse,
  CancelTaskResponse,
} from "@bloomerab/claude-types"

const BASE_URL = "/api"

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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

  exchangeCode: (code: string, state: string) =>
    request<{ success: boolean; data: { user: { id: string; login: string; avatarUrl: string } } }>(
      "/auth/github/callback",
      {
        method: "POST",
        body: JSON.stringify({ code, state }),
      },
    ),
}

export { api }
