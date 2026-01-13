/**
 * Core types for Ragnar Task Master
 */

export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'blocked' | 'deferred';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  subtasks: Subtask[];
  details?: string;
  testStrategy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStore {
  version: string;
  projectName?: string;
  tasks: Task[];
  lastUpdated: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dependencies?: string[];
  details?: string;
  testStrategy?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dependencies?: string[];
  details?: string;
  testStrategy?: string;
}

export interface CreateSubtaskInput {
  title: string;
  description?: string;
}

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  blocked: number;
  deferred: number;
  completionPercentage: number;
}
