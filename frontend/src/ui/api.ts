export type RequestStatus = 'NEW' | 'IN_PROGRESS' | 'DONE'

export interface RequestDto {
  id: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: RequestStatus
  createdAt: string
}

export interface CreateRequestInput {
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }

  return (await res.json()) as T
}

export const api = {
  health: () => http<{ ok: boolean; service: string }>('/api/health'),
  listRequests: () => http<{ items: RequestDto[] }>('/api/requests'),
  createRequest: (input: CreateRequestInput) =>
    http<RequestDto>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(input)
    })
}
