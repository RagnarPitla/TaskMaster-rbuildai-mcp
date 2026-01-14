#!/usr/bin/env node

/**
 * RTaskmaster - MCP Server Entry Point
 */

import { FastMCP } from "fastmcp";
import { registerTools } from "./mcp/tools.js";

const server = new FastMCP({
  name: "RTaskmaster",
  version: "0.2.0",
});

// Register all tools
registerTools(server);

// Start the server
server.start({
  transportType: "stdio",
});
