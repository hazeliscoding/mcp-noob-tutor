import type { MCPResponse } from '../shared/types';

/**
 * Context passed to every tool execution.
 *
 * Keep this small and stable: tools should do the majority of their work from
 * their input + this context, rather than reaching into global state.
 */
export interface ToolContext {
  learnerLevel: 'beginner' | 'intermediate';
  previousTopics: string[];
}

/**
 * A single “tool” the tutor can run.
 *
 * Tools are intentionally simple:
 * - `name` is the dispatch key used by `MCPRequest.toolName`
 * - `execute` returns a structured response (output + checkpoints + optional tutor notes)
 */
export interface MCPTool<TInput = unknown> {
  name: string;
  execute(input: TInput, ctx: ToolContext): Promise<MCPResponse>;
}

const tools = new Map<string, MCPTool>();

/**
 * Registers a tool by name.
 *
 * If a tool is re-registered with the same name, it will overwrite the previous entry.
 * That can be handy during development, but for production you might choose to reject duplicates.
 */
export function registerTool(tool: MCPTool) {
  tools.set(tool.name, tool);
}

/**
 * Looks up a tool by its dispatch name.
 */
export function getTool(name: string): MCPTool | undefined {
  return tools.get(name);
}
