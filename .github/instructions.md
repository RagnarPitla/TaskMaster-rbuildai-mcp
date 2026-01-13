# TaskMaster RBuildAI - Instructions for AI Agents

> **This file provides guidance for GitHub Copilot and other AI agents working with TaskMaster MCP.**

---

## 🎯 Overview

TaskMaster is a task management MCP server designed to help you track project tasks during development. When you start working on a project, TaskMaster can create and manage a structured task list that both you (the human) and AI agents can update.

---

## 🚀 Getting Started Workflow

When a user starts a new project or wants to use TaskMaster, follow these steps:

### Step 1: Initialize TaskMaster

```
Call: taskmaster_init
- projectRoot: <absolute path to the project>
- projectName: <optional project name>
```

This creates a `.taskmaster/` directory with a `tasks.json` file.

### Step 2: Create a Project Plan (Optional but Recommended)

After initialization, help the user create a `TASKS.md` file in the project root. This serves as a human-readable checklist that syncs conceptually with the JSON task store.

**Template for TASKS.md:**

```markdown
# Project Tasks

> This file tracks project tasks. Status is synced with `.taskmaster/tasks.json`.
> Both humans and AI agents can update this file.

## 📊 Progress

- Total: 0
- Completed: 0
- In Progress: 0

---

## ✅ Tasks

### High Priority

- [ ] Task 1 title (#1)
- [ ] Task 2 title (#2)

### Medium Priority

- [ ] Task 3 title (#3)

### Low Priority

- [ ] Task 4 title (#4)

---

## 📝 Notes

Add any project notes here.
```

### Step 3: Break Down the Project

Help the user identify and create tasks for their project goals. For each major feature or requirement:

1. Create a main task with `taskmaster_create_task`
2. Add subtasks for implementation steps with `taskmaster_add_subtask`
3. Set appropriate priorities and dependencies

---

## 📋 Working with Tasks

### Task Lifecycle

```
pending → in-progress → done
           ↓
        blocked / deferred
```

### When Starting Work on a Task

1. Call `taskmaster_next_task` to get the highest priority available task
2. Call `taskmaster_set_status` with `status: "in-progress"`
3. Work on the implementation
4. Call `taskmaster_set_status` with `status: "done"` when complete

### When a Task is Blocked

- Call `taskmaster_set_status` with `status: "blocked"`
- Add notes about what's blocking it using `taskmaster_update_task`

---

## 🤖 AI Agent Guidelines

### ALWAYS Do:

- ✅ Check `taskmaster_get_tasks` at the start of a session to understand project state
- ✅ Update task status when you complete work
- ✅ Create subtasks for complex implementations
- ✅ Use `taskmaster_next_task` to find what to work on
- ✅ Mark tasks as `done` immediately after completing them

### NEVER Do:

- ❌ Leave tasks in `in-progress` indefinitely
- ❌ Skip updating task status after completing work
- ❌ Create duplicate tasks without checking existing ones first
- ❌ Delete tasks without user confirmation

### Proactive Behavior

When working on code changes:

1. First check if there's a relevant task in TaskMaster
2. If there is, set it to `in-progress`
3. After completing the work, set it to `done`
4. If no task exists but the work is significant, offer to create one

---

## 📊 Task Checklist Format

For the `TASKS.md` file, use this checkbox format that both humans and AI can easily parse and update:

```markdown
- [ ] Task title (#taskId) - pending
- [x] Completed task (#taskId) - done
- [ ] 🔄 In-progress task (#taskId) - in-progress
- [ ] 🚫 Blocked task (#taskId) - blocked
- [ ] ⏸️ Deferred task (#taskId) - deferred
```

### Subtask Format:

```markdown
- [ ] Main task (#1)
  - [ ] Subtask 1 (#1.1)
  - [x] Subtask 2 (#1.2)
  - [ ] Subtask 3 (#1.3)
```

---

## 🔧 Available Tools Reference

| Tool                     | Use When                                           |
| ------------------------ | -------------------------------------------------- |
| `taskmaster_init`        | Starting a new project                             |
| `taskmaster_get_tasks`   | Need to see all tasks or filter by status/priority |
| `taskmaster_get_task`    | Need details about a specific task                 |
| `taskmaster_create_task` | Adding a new task                                  |
| `taskmaster_update_task` | Modifying task details                             |
| `taskmaster_delete_task` | Removing a task (use sparingly)                    |
| `taskmaster_set_status`  | Changing task/subtask status                       |
| `taskmaster_add_subtask` | Breaking down a task into smaller pieces           |
| `taskmaster_next_task`   | Finding what to work on next                       |
| `taskmaster_stats`       | Getting project progress overview                  |

---

## 📁 File Structure After Initialization

```
your-project/
├── .taskmaster/
│   ├── tasks.json      # JSON task store (source of truth)
│   └── .gitignore      # Optional: ignore local-only data
├── TASKS.md            # Human-readable checklist (optional)
└── ... your project files
```

---

## 💡 Best Practices

1. **Keep tasks focused**: Each task should be completable in a reasonable time
2. **Use subtasks**: For complex features, break them into 3-5 subtasks
3. **Set dependencies**: If Task B needs Task A, set the dependency
4. **Regular updates**: Update status as work progresses
5. **Add test strategies**: Include how to verify each task is complete

---

## 🎯 Example Session

**User**: "Help me build a REST API for user management"

**AI Agent Actions**:

1. `taskmaster_init` - Initialize TaskMaster
2. Create tasks:
   - Task 1: "Set up Express server" (high priority)
   - Task 2: "Create user model" (high, depends on 1)
   - Task 3: "Implement CRUD endpoints" (high, depends on 2)
   - Task 4: "Add authentication" (medium, depends on 3)
   - Task 5: "Write API tests" (medium, depends on 3)
3. `taskmaster_next_task` - Get "Set up Express server"
4. Work on implementation
5. `taskmaster_set_status` - Mark as done
6. Repeat for next tasks

---

## 🔄 Syncing TASKS.md with tasks.json

When updating tasks, consider updating both:

1. The JSON store via MCP tools (primary source)
2. The TASKS.md file for human readability (optional secondary)

The JSON store is the source of truth. TASKS.md is for human convenience.

---

_TaskMaster RBuildAI - Making AI-driven development organized and trackable._
