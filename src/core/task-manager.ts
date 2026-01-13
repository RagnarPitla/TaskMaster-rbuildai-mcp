/**
 * Task Manager - Core business logic for task operations
 */

import { TaskStorage } from './storage.js';
import type {
  Task,
  Subtask,
  TaskStatus,
  TaskFilter,
  TaskStats,
  CreateTaskInput,
  UpdateTaskInput,
  CreateSubtaskInput,
} from './types.js';

export class TaskManager {
  private storage: TaskStorage;

  constructor(projectRoot: string) {
    this.storage = new TaskStorage(projectRoot);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.storage.isInitialized();
  }

  /**
   * Initialize Ragnar
   */
  initialize(projectName?: string) {
    return this.storage.initialize(projectName);
  }

  /**
   * Generate next task ID
   */
  private generateTaskId(tasks: Task[]): string {
    if (tasks.length === 0) return '1';
    const maxId = Math.max(...tasks.map((t) => parseInt(t.id, 10) || 0));
    return String(maxId + 1);
  }

  /**
   * Generate next subtask ID
   */
  private generateSubtaskId(subtasks: Subtask[]): string {
    if (subtasks.length === 0) return '1';
    const maxId = Math.max(...subtasks.map((s) => parseInt(s.id, 10) || 0));
    return String(maxId + 1);
  }

  /**
   * Get all tasks with optional filtering
   */
  getTasks(filter?: TaskFilter): Task[] {
    let tasks = this.storage.getTasks();

    if (filter?.status) {
      const statuses = Array.isArray(filter.status)
        ? filter.status
        : [filter.status];
      tasks = tasks.filter((t) => statuses.includes(t.status));
    }

    if (filter?.priority) {
      tasks = tasks.filter((t) => t.priority === filter.priority);
    }

    return tasks;
  }

  /**
   * Get a task by ID (supports dot notation for subtasks: "1.2")
   */
  getTask(taskId: string): Task | Subtask | null {
    const tasks = this.storage.getTasks();
    const parts = taskId.split('.');

    const task = tasks.find((t) => t.id === parts[0]);
    if (!task) return null;

    if (parts.length === 1) return task;

    // It's a subtask reference
    const subtask = task.subtasks.find((s) => s.id === parts[1]);
    return subtask || null;
  }

  /**
   * Get parent task (for subtask operations)
   */
  getParentTask(taskId: string): Task | null {
    const tasks = this.storage.getTasks();
    const parentId = taskId.split('.')[0];
    return tasks.find((t) => t.id === parentId) || null;
  }

  /**
   * Create a new task
   */
  createTask(input: CreateTaskInput): Task {
    const tasks = this.storage.getTasks();
    const now = new Date().toISOString();

    const task: Task = {
      id: this.generateTaskId(tasks),
      title: input.title,
      description: input.description || '',
      status: 'pending',
      priority: input.priority || 'medium',
      dependencies: input.dependencies || [],
      subtasks: [],
      details: input.details,
      testStrategy: input.testStrategy,
      createdAt: now,
      updatedAt: now,
    };

    tasks.push(task);
    this.storage.saveTasks(tasks);

    return task;
  }

  /**
   * Update an existing task
   */
  updateTask(taskId: string, input: UpdateTaskInput): Task | null {
    const tasks = this.storage.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);

    if (index === -1) return null;

    const task = tasks[index];
    const updatedTask: Task = {
      ...task,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updatedTask;
    this.storage.saveTasks(tasks);

    return updatedTask;
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): boolean {
    const tasks = this.storage.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);

    if (index === -1) return false;

    tasks.splice(index, 1);

    // Also remove this task from any dependencies
    for (const task of tasks) {
      task.dependencies = task.dependencies.filter((d) => d !== taskId);
    }

    this.storage.saveTasks(tasks);
    return true;
  }

  /**
   * Set task status
   */
  setStatus(taskId: string, status: TaskStatus): Task | Subtask | null {
    const tasks = this.storage.getTasks();
    const parts = taskId.split('.');

    const taskIndex = tasks.findIndex((t) => t.id === parts[0]);
    if (taskIndex === -1) return null;

    const now = new Date().toISOString();

    if (parts.length === 1) {
      // Update task status
      tasks[taskIndex].status = status;
      tasks[taskIndex].updatedAt = now;
      this.storage.saveTasks(tasks);
      return tasks[taskIndex];
    }

    // Update subtask status
    const subtaskIndex = tasks[taskIndex].subtasks.findIndex(
      (s) => s.id === parts[1]
    );
    if (subtaskIndex === -1) return null;

    tasks[taskIndex].subtasks[subtaskIndex].status = status;
    tasks[taskIndex].subtasks[subtaskIndex].updatedAt = now;
    tasks[taskIndex].updatedAt = now;
    this.storage.saveTasks(tasks);

    return tasks[taskIndex].subtasks[subtaskIndex];
  }

  /**
   * Add a subtask to a task
   */
  addSubtask(taskId: string, input: CreateSubtaskInput): Subtask | null {
    const tasks = this.storage.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) return null;

    const now = new Date().toISOString();
    const subtask: Subtask = {
      id: this.generateSubtaskId(tasks[taskIndex].subtasks),
      title: input.title,
      description: input.description,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    tasks[taskIndex].subtasks.push(subtask);
    tasks[taskIndex].updatedAt = now;
    this.storage.saveTasks(tasks);

    return subtask;
  }

  /**
   * Get the next task to work on
   * Prioritizes: in-progress > high priority pending > medium > low
   * Only returns tasks with satisfied dependencies
   */
  getNextTask(): Task | null {
    const tasks = this.storage.getTasks();
    const doneTasks = new Set(
      tasks.filter((t) => t.status === 'done').map((t) => t.id)
    );

    // Filter to tasks that can be worked on
    const availableTasks = tasks.filter((t) => {
      if (t.status === 'done' || t.status === 'blocked' || t.status === 'deferred') {
        return false;
      }
      // Check all dependencies are done
      return t.dependencies.every((d) => doneTasks.has(d));
    });

    if (availableTasks.length === 0) return null;

    // First, check for in-progress tasks
    const inProgress = availableTasks.find((t) => t.status === 'in-progress');
    if (inProgress) return inProgress;

    // Sort by priority
    const priorityOrder: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    availableTasks.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] ?? 1;
      const bPriority = priorityOrder[b.priority] ?? 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      // If same priority, prefer lower ID (earlier created)
      return parseInt(a.id, 10) - parseInt(b.id, 10);
    });

    return availableTasks[0] || null;
  }

  /**
   * Get task statistics
   */
  getStats(): TaskStats {
    const tasks = this.storage.getTasks();
    const total = tasks.length;

    const stats: TaskStats = {
      total,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      deferred: tasks.filter((t) => t.status === 'deferred').length,
      completionPercentage: total > 0
        ? Math.round((tasks.filter((t) => t.status === 'done').length / total) * 100)
        : 0,
    };

    return stats;
  }
}
