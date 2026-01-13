#!/usr/bin/env node

/**
 * TaskMaster RBuildAI - MCP Server Entry Point
 */

import { FastMCP } from 'fastmcp';
import { registerTools } from './mcp/tools.js';

const server = new FastMCP({
  name: 'TaskMaster RBuildAI',
  version: '0.1.0',
});

// Register all tools
registerTools(server);

// Start the server
server.start({
  transportType: 'stdio',
});
