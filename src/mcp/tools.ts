/**
 * MCP Tools - All tool definitions for RTaskmaster Task Master
 */

import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import type { FastMCP } from "fastmcp";
import { TaskManager } from "../core/task-manager.js";
import type { TaskStatus, TaskPriority, Task } from "../core/types.js";

// Schemas
const ProjectRootSchema = z.object({
  projectRoot: z
    .string()
    .describe("Absolute path to the project root directory"),
});

const TaskIdSchema = z.object({
  projectRoot: z
    .string()
    .describe("Absolute path to the project root directory"),
  taskId: z
    .string()
    .describe('Task ID (e.g., "1") or subtask ID (e.g., "1.2")'),
});

const StatusSchema = z.enum([
  "pending",
  "in-progress",
  "done",
  "blocked",
  "deferred",
]);
const PrioritySchema = z.enum(["high", "medium", "low"]);

/**
 * Register all RTaskmaster MCP tools
 */
export function registerTools(server: FastMCP) {
  // ============ INIT ============
  server.addTool({
    name: "rtaskmaster_init",
    description:
      "Initialize RTaskmaster Task Master in a project. Creates .rtaskmaster directory with tasks.json.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      projectName: z.string().optional().describe("Optional project name"),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "✅ RTaskmaster is already initialized in this project.",
            },
          ],
        };
      }

      const store = manager.initialize(args.projectName);
      return {
        content: [
          {
            type: "text",
            text: `✅ RTaskmaster initialized successfully!\n\nProject: ${store.projectName}\nTasks file: ${args.projectRoot}/.rtaskmaster/tasks.json\n\nYou can now create tasks using rtaskmaster_create_task.`,
          },
        ],
      };
    },
  });

  // ============ GET TASKS ============
  server.addTool({
    name: "rtaskmaster_get_tasks",
    description:
      "Get all tasks from the project, optionally filtered by status or priority.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      status: StatusSchema.optional().describe("Filter by status"),
      priority: PrioritySchema.optional().describe("Filter by priority"),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const tasks = manager.getTasks({
        status: args.status as TaskStatus,
        priority: args.priority as TaskPriority,
      });
      const stats = manager.getStats();

      if (tasks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "📋 No tasks found.\n\nCreate your first task using rtaskmaster_create_task.",
            },
          ],
        };
      }

      const taskList = tasks
        .map((t) => {
          const statusEmoji =
            {
              pending: "⏳",
              "in-progress": "🔄",
              done: "✅",
              blocked: "🚫",
              deferred: "⏸️",
            }[t.status] || "❓";

          const priorityEmoji =
            {
              high: "🔴",
              medium: "🟡",
              low: "🟢",
            }[t.priority] || "";

          let taskLine = `${statusEmoji} [${t.id}] ${t.title} ${priorityEmoji}`;

          if (t.subtasks.length > 0) {
            const doneSubtasks = t.subtasks.filter(
              (s) => s.status === "done"
            ).length;
            taskLine += ` (${doneSubtasks}/${t.subtasks.length} subtasks)`;
          }

          return taskLine;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `📋 Tasks (${stats.completionPercentage}% complete)\n\n${taskList}\n\n📊 Stats: ${stats.done}/${stats.total} done, ${stats.inProgress} in progress, ${stats.pending} pending`,
          },
        ],
      };
    },
  });

  // ============ GET TASK ============
  server.addTool({
    name: "rtaskmaster_get_task",
    description: "Get detailed information about a specific task or subtask.",
    parameters: TaskIdSchema,
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const task = manager.getTask(args.taskId);

      if (!task) {
        return {
          content: [
            { type: "text", text: `❌ Task "${args.taskId}" not found.` },
          ],
        };
      }

      // Check if it's a subtask (no subtasks property)
      if (!("subtasks" in task)) {
        return {
          content: [
            {
              type: "text",
              text: `📌 Subtask ${args.taskId}\n\nTitle: ${
                task.title
              }\nStatus: ${task.status}\n${
                task.description ? `Description: ${task.description}` : ""
              }`,
            },
          ],
        };
      }

      let output = `📌 Task ${task.id}: ${task.title}\n\n`;
      output += `Status: ${task.status}\n`;
      output += `Priority: ${task.priority}\n`;
      output += `Description: ${task.description || "(none)"}\n`;

      if (task.dependencies.length > 0) {
        output += `Dependencies: ${task.dependencies.join(", ")}\n`;
      }

      if (task.details) {
        output += `\n📝 Details:\n${task.details}\n`;
      }

      if (task.testStrategy) {
        output += `\n🧪 Test Strategy:\n${task.testStrategy}\n`;
      }

      if (task.subtasks.length > 0) {
        output += `\n📋 Subtasks:\n`;
        task.subtasks.forEach((s) => {
          const emoji =
            s.status === "done"
              ? "✅"
              : s.status === "in-progress"
              ? "🔄"
              : "⏳";
          output += `  ${emoji} [${task.id}.${s.id}] ${s.title}\n`;
        });
      }

      return {
        content: [{ type: "text", text: output }],
      };
    },
  });

  // ============ CREATE TASK ============
  server.addTool({
    name: "rtaskmaster_create_task",
    description: "Create a new task.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      title: z.string().describe("Task title"),
      description: z.string().optional().describe("Task description"),
      priority: PrioritySchema.optional().describe(
        "Task priority (default: medium)"
      ),
      dependencies: z
        .array(z.string())
        .optional()
        .describe("Array of task IDs this task depends on"),
      details: z.string().optional().describe("Detailed implementation notes"),
      testStrategy: z
        .string()
        .optional()
        .describe("How to test/verify this task"),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const task = manager.createTask({
        title: args.title,
        description: args.description,
        priority: args.priority as TaskPriority,
        dependencies: args.dependencies,
        details: args.details,
        testStrategy: args.testStrategy,
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Task created!\n\nID: ${task.id}\nTitle: ${task.title}\nPriority: ${task.priority}\nStatus: ${task.status}`,
          },
        ],
      };
    },
  });

  // ============ UPDATE TASK ============
  server.addTool({
    name: "rtaskmaster_update_task",
    description: "Update an existing task.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      taskId: z.string().describe("Task ID to update"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      priority: PrioritySchema.optional().describe("New priority"),
      dependencies: z.array(z.string()).optional().describe("New dependencies"),
      details: z.string().optional().describe("New implementation details"),
      testStrategy: z.string().optional().describe("New test strategy"),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const { projectRoot, taskId, ...updates } = args;
      const task = manager.updateTask(taskId, updates as any);

      if (!task) {
        return {
          content: [{ type: "text", text: `❌ Task "${taskId}" not found.` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Task ${task.id} updated!\n\nTitle: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}`,
          },
        ],
      };
    },
  });

  // ============ DELETE TASK ============
  server.addTool({
    name: "rtaskmaster_delete_task",
    description: "Delete a task.",
    parameters: TaskIdSchema,
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const deleted = manager.deleteTask(args.taskId);

      if (!deleted) {
        return {
          content: [
            { type: "text", text: `❌ Task "${args.taskId}" not found.` },
          ],
        };
      }

      return {
        content: [{ type: "text", text: `✅ Task ${args.taskId} deleted.` }],
      };
    },
  });

  // ============ SET STATUS ============
  server.addTool({
    name: "rtaskmaster_set_status",
    description: "Update the status of a task or subtask.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      taskId: z
        .string()
        .describe('Task ID (e.g., "1") or subtask ID (e.g., "1.2")'),
      status: StatusSchema.describe("New status"),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const result = manager.setStatus(args.taskId, args.status as TaskStatus);

      if (!result) {
        return {
          content: [
            { type: "text", text: `❌ Task "${args.taskId}" not found.` },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Status updated!\n\n${args.taskId}: ${result.title} → ${args.status}`,
          },
        ],
      };
    },
  });

  // ============ ADD SUBTASK ============
  server.addTool({
    name: "rtaskmaster_add_subtask",
    description: "Add a subtask to an existing task.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      taskId: z.string().describe("Parent task ID"),
      title: z.string().describe("Subtask title"),
      description: z.string().optional().describe("Subtask description"),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const subtask = manager.addSubtask(args.taskId, {
        title: args.title,
        description: args.description,
      });

      if (!subtask) {
        return {
          content: [
            { type: "text", text: `❌ Task "${args.taskId}" not found.` },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Subtask added!\n\nID: ${args.taskId}.${subtask.id}\nTitle: ${subtask.title}`,
          },
        ],
      };
    },
  });

  // ============ NEXT TASK ============
  server.addTool({
    name: "rtaskmaster_next_task",
    description:
      "Get the next task to work on based on priority and dependencies.",
    parameters: ProjectRootSchema,
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const task = manager.getNextTask();
      const stats = manager.getStats();

      if (!task) {
        if (stats.total === 0) {
          return {
            content: [
              {
                type: "text",
                text: "📋 No tasks yet. Create your first task using rtaskmaster_create_task.",
              },
            ],
          };
        }
        if (stats.done === stats.total) {
          return {
            content: [
              {
                type: "text",
                text: "🎉 All tasks are complete! Great job!",
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: "⏳ No tasks available. Remaining tasks may be blocked or deferred.",
            },
          ],
        };
      }

      let output = `🎯 Next Task: [${task.id}] ${task.title}\n\n`;
      output += `Priority: ${task.priority}\n`;
      output += `Status: ${task.status}\n`;
      output += `Description: ${task.description || "(none)"}\n`;

      if (task.details) {
        output += `\n📝 Details:\n${task.details}\n`;
      }

      if (task.subtasks.length > 0) {
        const pendingSubtasks = task.subtasks.filter(
          (s) => s.status !== "done"
        );
        if (pendingSubtasks.length > 0) {
          output += `\n📋 Pending Subtasks:\n`;
          pendingSubtasks.forEach((s) => {
            output += `  ⏳ [${task.id}.${s.id}] ${s.title}\n`;
          });
        }
      }

      output += `\n💡 To start working: rtaskmaster_set_status with taskId="${task.id}" and status="in-progress"`;

      return {
        content: [{ type: "text", text: output }],
      };
    },
  });

  // ============ GET STATS ============
  server.addTool({
    name: "rtaskmaster_stats",
    description: "Get task statistics and project progress.",
    parameters: ProjectRootSchema,
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const stats = manager.getStats();

      const progressBar = (percent: number) => {
        const filled = Math.round(percent / 10);
        const empty = 10 - filled;
        return "█".repeat(filled) + "░".repeat(empty);
      };

      return {
        content: [
          {
            type: "text",
            text:
              `📊 Project Statistics\n\n` +
              `Progress: ${progressBar(stats.completionPercentage)} ${
                stats.completionPercentage
              }%\n\n` +
              `✅ Done: ${stats.done}\n` +
              `🔄 In Progress: ${stats.inProgress}\n` +
              `⏳ Pending: ${stats.pending}\n` +
              `🚫 Blocked: ${stats.blocked}\n` +
              `⏸️ Deferred: ${stats.deferred}\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `📋 Total: ${stats.total}`,
          },
        ],
      };
    },
  });

  // ============ GENERATE TASKS.MD ============
  server.addTool({
    name: "rtaskmaster_generate_tasks_md",
    description:
      "Generate a human-readable TASKS.md checklist file from the current tasks. Creates or updates the file in the project root.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      includeDetails: z
        .boolean()
        .optional()
        .describe("Include task details and test strategies (default: false)"),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const tasks = manager.getTasks();
      const stats = manager.getStats();

      const getStatusEmoji = (status: TaskStatus) => {
        const emojis: Record<TaskStatus, string> = {
          pending: "",
          "in-progress": "🔄 ",
          done: "",
          blocked: "🚫 ",
          deferred: "⏸️ ",
        };
        return emojis[status] || "";
      };

      const getCheckbox = (status: TaskStatus) =>
        status === "done" ? "[x]" : "[ ]";

      const formatTask = (task: Task, includeDetails: boolean): string => {
        let line = `- ${getCheckbox(task.status)} ${getStatusEmoji(
          task.status
        )}${task.title} (#${task.id})`;

        if (task.dependencies.length > 0) {
          line += ` [depends on: ${task.dependencies.join(", ")}]`;
        }

        let output = line + "\n";

        if (task.description && includeDetails) {
          output += `  > ${task.description}\n`;
        }

        // Add subtasks
        if (task.subtasks.length > 0) {
          task.subtasks.forEach((s) => {
            output += `  - ${getCheckbox(s.status)} ${getStatusEmoji(
              s.status as TaskStatus
            )}${s.title} (#${task.id}.${s.id})\n`;
          });
        }

        return output;
      };

      const highPriority = tasks.filter((t) => t.priority === "high");
      const mediumPriority = tasks.filter((t) => t.priority === "medium");
      const lowPriority = tasks.filter((t) => t.priority === "low");

      let content = `# Project Tasks

> Generated by RTaskmaster RBuildAI | Last updated: ${new Date().toISOString()}
> 
> Both humans and AI agents can update this file.
> Source of truth: \`.rtaskmaster/tasks.json\`

## 📊 Progress

| Status | Count |
|--------|-------|
| ✅ Done | ${stats.done} |
| 🔄 In Progress | ${stats.inProgress} |
| ⏳ Pending | ${stats.pending} |
| 🚫 Blocked | ${stats.blocked} |
| ⏸️ Deferred | ${stats.deferred} |
| **Total** | **${stats.total}** |

**Completion: ${stats.completionPercentage}%**

---

## ✅ Tasks

`;

      if (highPriority.length > 0) {
        content += `### 🔴 High Priority\n\n`;
        highPriority.forEach((t) => {
          content += formatTask(t, args.includeDetails || false);
        });
        content += "\n";
      }

      if (mediumPriority.length > 0) {
        content += `### 🟡 Medium Priority\n\n`;
        mediumPriority.forEach((t) => {
          content += formatTask(t, args.includeDetails || false);
        });
        content += "\n";
      }

      if (lowPriority.length > 0) {
        content += `### 🟢 Low Priority\n\n`;
        lowPriority.forEach((t) => {
          content += formatTask(t, args.includeDetails || false);
        });
        content += "\n";
      }

      if (tasks.length === 0) {
        content += `*No tasks yet. Create your first task using \`rtaskmaster_create_task\`.*\n\n`;
      }

      content += `---

## 📝 Checklist Legend

- \`[ ]\` - Pending/Not started
- \`[x]\` - Completed
- 🔄 - In Progress
- 🚫 - Blocked
- ⏸️ - Deferred

---

*Managed by [RTaskmaster RBuildAI](https://github.com/RagnarPitla/RTaskmaster-rbuildai-mcp)*
`;

      const tasksFilePath = path.join(args.projectRoot, "TASKS.md");
      fs.writeFileSync(tasksFilePath, content, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `✅ Generated TASKS.md successfully!\n\nFile: ${tasksFilePath}\n\n📊 Contains ${stats.total} tasks (${stats.completionPercentage}% complete)`,
          },
        ],
      };
    },
  });

  // ============ PARSE TASKS FROM REQUIREMENTS ============
  server.addTool({
    name: "rtaskmaster_parse_prd",
    description:
      "Parse a PRD (Product Requirements Document) or README file and create tasks from it. Provide either content directly or a file path.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      filePath: z
        .string()
        .optional()
        .describe("Path to a PRD, README, or requirements file to parse"),
      content: z
        .string()
        .optional()
        .describe("Direct content/requirements text to parse into tasks"),
      defaultPriority: PrioritySchema.optional().describe(
        "Default priority for created tasks (default: medium)"
      ),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      let textContent = args.content;

      if (!textContent && args.filePath) {
        const resolvedPath = path.isAbsolute(args.filePath)
          ? args.filePath
          : path.join(args.projectRoot, args.filePath);

        if (!fs.existsSync(resolvedPath)) {
          return {
            content: [
              { type: "text", text: `❌ File not found: ${resolvedPath}` },
            ],
          };
        }
        textContent = fs.readFileSync(resolvedPath, "utf-8");
      }

      if (!textContent) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Please provide either filePath or content to parse.",
            },
          ],
        };
      }

      // Simple parsing: look for bullet points, numbered lists, headers
      const lines = textContent.split("\n");
      const extractedTasks: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();

        // Match bullet points: - [ ] task, * task, - task
        const bulletMatch = trimmed.match(/^[-*•]\s*(?:\[.\])?\s*(.+)$/);
        if (
          bulletMatch &&
          bulletMatch[1].length > 5 &&
          bulletMatch[1].length < 200
        ) {
          extractedTasks.push(bulletMatch[1]);
          continue;
        }

        // Match numbered lists: 1. task, 1) task
        const numberedMatch = trimmed.match(/^\d+[.)]\s*(.+)$/);
        if (
          numberedMatch &&
          numberedMatch[1].length > 5 &&
          numberedMatch[1].length < 200
        ) {
          extractedTasks.push(numberedMatch[1]);
        }
      }

      if (extractedTasks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ No tasks could be extracted from the content.\n\nTip: Format requirements as bullet points or numbered lists for best results.",
            },
          ],
        };
      }

      // Create tasks from extracted items
      const createdTasks: Task[] = [];
      const defaultPriority = args.defaultPriority || "medium";

      for (const title of extractedTasks) {
        const task = manager.createTask({
          title: title.substring(0, 100), // Limit title length
          priority: defaultPriority as TaskPriority,
        });
        createdTasks.push(task);
      }

      const taskList = createdTasks
        .map((t) => `  [${t.id}] ${t.title}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `✅ Created ${createdTasks.length} tasks from the content!\n\n📋 Tasks created:\n${taskList}\n\n💡 Use rtaskmaster_get_tasks to see all tasks, or rtaskmaster_update_task to modify details.`,
          },
        ],
      };
    },
  });

  // ============ BULK SET STATUS ============
  server.addTool({
    name: "rtaskmaster_bulk_status",
    description: "Update the status of multiple tasks at once.",
    parameters: z.object({
      projectRoot: z
        .string()
        .describe("Absolute path to the project root directory"),
      taskIds: z.array(z.string()).describe("Array of task IDs to update"),
      status: StatusSchema.describe("New status for all specified tasks"),
    }),
    execute: async (args) => {
      const manager = new TaskManager(args.projectRoot);

      if (!manager.isInitialized()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ RTaskmaster is not initialized. Run rtaskmaster_init first.",
            },
          ],
        };
      }

      const results: string[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const taskId of args.taskIds) {
        const result = manager.setStatus(taskId, args.status as TaskStatus);
        if (result) {
          results.push(`✅ [${taskId}] ${result.title} → ${args.status}`);
          successCount++;
        } else {
          results.push(`❌ [${taskId}] Not found`);
          failCount++;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `📋 Bulk Status Update Complete\n\n${results.join(
              "\n"
            )}\n\n✅ Success: ${successCount} | ❌ Failed: ${failCount}`,
          },
        ],
      };
    },
  });
}
