import type { IsolatedAccountSession } from './session-manager.js';

export type BrowserAiEngineMode = 'agent-browser' | 'stagehand' | 'midscene';

export interface AgentBrowserMcpConfig {
  name: string;
  transport: 'stdio';
  command: string;
  args: string[];
  cdpEndpoint: string;
  mode: 'agent-browser';
}

/**
 * Bridge for vercel-labs/agent-browser (Apache-2.0).
 * Connects to the isolated Electron WebContentsView CDP endpoint and exposes
 * compact accessibility-tree (@e1 ref) MCP tools to OpenCode / Codex / Built-in Experts.
 */
export function buildAgentBrowserMcpConfig(session: IsolatedAccountSession): AgentBrowserMcpConfig {
  const cdpEndpoint = `http://127.0.0.1:${session.cdpPort}`;
  return {
    name: `biaomai-browser-${session.platform}-${session.accountId}`,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'agent-browser', '--cdp', cdpEndpoint, '--mcp'],
    cdpEndpoint,
    mode: 'agent-browser',
  };
}
