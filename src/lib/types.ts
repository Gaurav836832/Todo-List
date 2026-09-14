export interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface TaskCreate {
  title: string;
}

export interface TaskUpdate {
  completed?: boolean;
  title?: string;
}

export interface TaskDeleteResponse {
  id: string;
  deleted: boolean;
}

export type FilterStatus = 'all' | 'active' | 'completed';
export type SortOption = 'newest' | 'oldest' | 'alphabetical';
