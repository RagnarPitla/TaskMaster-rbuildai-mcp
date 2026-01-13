# RTaskmaster MCP

A task master MCP (Model Context Protocol) server for AI-driven development in VS Code, Cursor, and other MCP-compatible editors.

[![npm version](https://badge.fury.io/js/rtaskmaster-mcp.svg)](https://www.npmjs.com/package/rtaskmaster-mcp)

## Features

- 📋 **Task Management**: Create, update, list, and organize tasks
- 🎯 **Subtasks**: Break down complex tasks into manageable subtasks
- 📊 **Status Tracking**: Track progress with status updates (pending, in-progress, done, blocked, deferred)
- 🏷️ **Priority Levels**: Organize by priority (high, medium, low)
- 🔗 **Dependencies**: Define task dependencies
- 💾 **JSON Storage**: Simple file-based storage in `.rtaskmaster/tasks.json`
- 🤖 **AI-Ready**: Designed to work seamlessly with GitHub Copilot, Claude, and other AI assistants

## Quick Install for VS Code

### Option 1: NPX (Recommended - No Install Required)

Add to your VS Code MCP configuration at `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "rtaskmaster": {
      "command": "npx",
      "args": ["-y", "rtaskmaster-mcp"],
      "type": "stdio"
    }
  }
}
```

### Option 2: Global Install

```bash
npm install -g rtaskmaster-mcp
```

Then add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "rtaskmaster": {
      "command": "rtaskmaster-mcp",
      "type": "stdio"
    }
  }
}
```

### Option 3: Cursor IDE

Add to `~/.cursor/mcp.json` or your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "rtaskmaster": {
      "command": "npx",
      "args": ["-y", "rtaskmaster-mcp"]
    }
  }
}
```

## 📖 AI Agent Instructions

For AI agents (GitHub Copilot, Claude, etc.) to work effectively with RTaskmaster, reference the instructions file:

**Location**: `.github/instructions.md` in this repository

The instructions file provides:

- ✅ Getting started workflow
- ✅ Task lifecycle management
- ✅ Best practices for AI agents
- ✅ TASKS.md checklist format
- ✅ Example sessions

### Quick Workflow for AI Agents

1. **Initialize**: `rtaskmaster_init` at project start
2. **Create tasks**: Break down requirements into tasks
3. **Generate checklist**: `rtaskmaster_generate_tasks_md` for human-readable view
4. **Work loop**: `rtaskmaster_next_task` → work → `rtaskmaster_set_status` → repeat
5. **Track progress**: `rtaskmaster_stats` to see completion

## Available MCP Tools

| Tool                           | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `rtaskmaster_init`              | Initialize RTaskmaster in a project           |
| `rtaskmaster_get_tasks`         | Get all tasks with optional filtering        |
| `rtaskmaster_get_task`          | Get a specific task by ID                    |
| `rtaskmaster_create_task`       | Create a new task                            |
| `rtaskmaster_update_task`       | Update an existing task                      |
| `rtaskmaster_delete_task`       | Delete a task                                |
| `rtaskmaster_set_status`        | Update task status                           |
| `rtaskmaster_add_subtask`       | Add a subtask to a task                      |
| `rtaskmaster_next_task`         | Get the next task to work on                 |
| `rtaskmaster_stats`             | Get project statistics                       |
| `rtaskmaster_generate_tasks_md` | Generate a human-readable TASKS.md checklist |
| `rtaskmaster_parse_prd`         | Parse requirements/PRD files to create tasks |
| `rtaskmaster_bulk_status`       | Update multiple task statuses at once        |

## 📋 TASKS.md Checklist File

RTaskmaster can generate a human-readable `TASKS.md` file that serves as a visual checklist:

```markdown
# Project Tasks

## 📊 Progress

| Status         | Count |
| -------------- | ----- |
| ✅ Done        | 2     |
| 🔄 In Progress | 1     |
| ⏳ Pending     | 3     |
| **Total**      | **6** |

**Completion: 33%**

---

## ✅ Tasks

### 🔴 High Priority

- [x] Set up project structure (#1)
- [ ] 🔄 Implement authentication (#2)
  - [x] Set up OAuth (#2.1)
  - [ ] Add JWT tokens (#2.2)

### 🟡 Medium Priority

- [ ] Add user profile page (#3)
```

Generate this file anytime using `rtaskmaster_generate_tasks_md`.

## Task Structure

Tasks are stored in `.rtaskmaster/tasks.json`:

```json
{
  "version": "1.0.0",
  "projectName": "My Project",
  "tasks": [
    {
      "id": "1",
      "title": "Implement authentication",
      "description": "Add user authentication system",
      "status": "pending",
      "priority": "high",
      "dependencies": [],
      "subtasks": [
        {
          "id": "1",
          "title": "Set up OAuth",
          "status": "pending"
        }
      ],
      "details": "Implementation notes here...",
      "testStrategy": "How to verify this task...",
      "createdAt": "2026-01-13T10:00:00.000Z",
      "updatedAt": "2026-01-13T10:00:00.000Z"
    }
  ],
  "lastUpdated": "2026-01-13T10:00:00.000Z"
}
```

## Usage Examples

Once configured, interact through your AI assistant:

```
Initialize taskmaster in this project

Create a task to implement user authentication with high priority

Show me all pending tasks

What's the next task I should work on?

Mark task 1 as in-progress

Add a subtask to task 1: "Set up database schema"
```

## Task Statuses

| Status        | Description                           |
| ------------- | ------------------------------------- |
| `pending`     | Task not yet started                  |
| `in-progress` | Currently being worked on             |
| `done`        | Completed                             |
| `blocked`     | Cannot proceed (waiting on something) |
| `deferred`    | Postponed for later                   |

## Priority Levels

| Priority | Description               |
| -------- | ------------------------- |
| `high`   | Urgent/critical tasks     |
| `medium` | Normal priority (default) |
| `low`    | Can wait                  |

## Development

```bash
# Clone the repo
git clone https://github.com/RagnarPitla/RTaskmaster-rbuildai-mcp.git
cd RTaskmaster-rbuildai-mcp

# Install dependencies
npm install

# Build
npm run build

# Watch mode for development
npm run dev

# Test with MCP Inspector
npm run inspector
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

RBuildAI - [GitHub](https://github.com/RagnarPitla)
