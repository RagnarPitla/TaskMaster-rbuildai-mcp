# TaskMaster RBuildAI MCP

A task master MCP (Model Context Protocol) server for AI-driven development in VS Code, Cursor, and other MCP-compatible editors.

[![npm version](https://badge.fury.io/js/taskmaster-rbuildai-mcp.svg)](https://www.npmjs.com/package/taskmaster-rbuildai-mcp)

## Features

- 📋 **Task Management**: Create, update, list, and organize tasks
- 🎯 **Subtasks**: Break down complex tasks into manageable subtasks
- 📊 **Status Tracking**: Track progress with status updates (pending, in-progress, done, blocked, deferred)
- 🏷️ **Priority Levels**: Organize by priority (high, medium, low)
- 🔗 **Dependencies**: Define task dependencies
- 💾 **JSON Storage**: Simple file-based storage in `.taskmaster/tasks.json`
- 🤖 **AI-Ready**: Designed to work seamlessly with GitHub Copilot, Claude, and other AI assistants

## Quick Install for VS Code

### Option 1: NPX (Recommended - No Install Required)

Add to your VS Code MCP configuration at `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "taskmaster": {
      "command": "npx",
      "args": ["-y", "taskmaster-rbuildai-mcp"],
      "type": "stdio"
    }
  }
}
```

### Option 2: Global Install

```bash
npm install -g taskmaster-rbuildai-mcp
```

Then add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "taskmaster": {
      "command": "taskmaster-rbuildai-mcp",
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
    "taskmaster": {
      "command": "npx",
      "args": ["-y", "taskmaster-rbuildai-mcp"]
    }
  }
}
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `taskmaster_init` | Initialize TaskMaster in a project |
| `taskmaster_get_tasks` | Get all tasks with optional filtering |
| `taskmaster_get_task` | Get a specific task by ID |
| `taskmaster_create_task` | Create a new task |
| `taskmaster_update_task` | Update an existing task |
| `taskmaster_delete_task` | Delete a task |
| `taskmaster_set_status` | Update task status |
| `taskmaster_add_subtask` | Add a subtask to a task |
| `taskmaster_next_task` | Get the next task to work on |
| `taskmaster_stats` | Get project statistics |

## Task Structure

Tasks are stored in `.taskmaster/tasks.json`:

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

| Status | Description |
|--------|-------------|
| `pending` | Task not yet started |
| `in-progress` | Currently being worked on |
| `done` | Completed |
| `blocked` | Cannot proceed (waiting on something) |
| `deferred` | Postponed for later |

## Priority Levels

| Priority | Description |
|----------|-------------|
| `high` | Urgent/critical tasks |
| `medium` | Normal priority (default) |
| `low` | Can wait |

## Development

```bash
# Clone the repo
git clone https://github.com/RagnarPitla/TaskMaster-rbuildai-mcp.git
cd TaskMaster-rbuildai-mcp

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
