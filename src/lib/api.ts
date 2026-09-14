import { Task, TaskCreate, TaskUpdate, TaskDeleteResponse } from './types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// The live backend API URL (set VITE_API_URL in .env for production, defaults to local dev backend)
const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const LOCAL_STORAGE_CACHE_KEY = 'taskflow_cached_tasks_v1';

// Helper to safely load cached tasks in case of cold-start or offline
export function getLocalCache(): Task[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCache(tasks: Task[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Failed to save to localStorage cache:', err);
  }
}

export async function fetchTasks(): Promise<Task[]> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/tasks`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ApiError(`Failed to fetch tasks: ${response.status} ${response.statusText}`, response.status);
    }

    const data: Task[] = await response.json();
    saveLocalCache(data);
    return data;
  } catch (error) {
    console.warn('Could not fetch from live backend, falling back to cached tasks:', error);
    const cached = getLocalCache();
    if (cached.length > 0) return cached;
    throw error;
  }
}

export async function createTask(payload: TaskCreate): Promise<Task> {
  const response = await fetch(`${BACKEND_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(`Failed to create task: ${response.status} ${errorText}`, response.status);
  }

  const task: Task = await response.json();
  return task;
}

export async function updateTask(taskId: string, payload: TaskUpdate): Promise<Task> {
  const response = await fetch(`${BACKEND_BASE_URL}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(`Failed to update task: ${response.status} ${errorText}`, response.status);
  }

  const task: Task = await response.json();
  return task;
}

export async function deleteTask(taskId: string): Promise<TaskDeleteResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(`Failed to delete task: ${response.status} ${errorText}`, response.status);
  }

  const result: TaskDeleteResponse = await response.json();
  return result;
}
