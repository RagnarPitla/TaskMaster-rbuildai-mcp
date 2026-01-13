/**
 * Task Storage - File-based JSON storage for tasks
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Task, TaskStore } from './types.js';

const TASKMASTER_DIR = '.taskmaster';
const TASKS_FILE = 'tasks.json';
const VERSION = '1.0.0';

export class TaskStorage {
  private projectRoot: string;
  private tasksPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.tasksPath = path.join(projectRoot, TASKMASTER_DIR, TASKS_FILE);
  }

  /**
   * Check if TaskMaster is initialized in the project
   */
  isInitialized(): boolean {
    return fs.existsSync(this.tasksPath);
  }

  /**
   * Initialize TaskMaster in the project
   */
  initialize(projectName?: string): TaskStore {
    const taskmasterDir = path.join(this.projectRoot, TASKMASTER_DIR);
    
    if (!fs.existsSync(taskmasterDir)) {
      fs.mkdirSync(taskmasterDir, { recursive: true });
    }

    const store: TaskStore = {
      version: VERSION,
      projectName: projectName || path.basename(this.projectRoot),
      tasks: [],
      lastUpdated: new Date().toISOString(),
    };

    this.save(store);
    
    // Create .gitignore in .taskmaster if it doesn't exist
    const gitignorePath = path.join(taskmasterDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '# Ragnar files to ignore\n');
    }

    return store;
  }

  /**
   * Load task store from disk
   */
  load(): TaskStore {
    if (!this.isInitialized()) {
      throw new Error(
        'Ragnar is not initialized in this project. Run ragnar_init first.'
      );
    }

    const content = fs.readFileSync(this.tasksPath, 'utf-8');
    return JSON.parse(content) as TaskStore;
  }

  /**
   * Save task store to disk
   */
  save(store: TaskStore): void {
    store.lastUpdated = new Date().toISOString();
    const content = JSON.stringify(store, null, 2);
    fs.writeFileSync(this.tasksPath, content, 'utf-8');
  }

  /**
   * Get all tasks
   */
  getTasks(): Task[] {
    return this.load().tasks;
  }

  /**
   * Save all tasks
   */
  saveTasks(tasks: Task[]): void {
    const store = this.load();
    store.tasks = tasks;
    this.save(store);
  }

  /**
   * Get project root
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}
