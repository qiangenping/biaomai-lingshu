import type { RegionProfile } from '@biaomai/plugin-sdk';

export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpCallResult<T = unknown> {
  ok: boolean;
  httpStatus: number;
  latencyMs: number;
  data?: T;
  error?: string;
  isAuthMismatch?: boolean;
}

/**
 * Real MCP Streamable HTTP / JSON-RPC 2.0 Client.
 * Connects directly to aitoearn.cn, aitoearn.ai, or self-hosted Docker unified-mcp endpoints.
 */
export class McpHttpClient {
  private requestId = 1;

  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly authHeader = 'x-api-key',
    private readonly timeoutMs = 15000,
  ) {}

  static fromProfile(profile: RegionProfile, apiKey: string): McpHttpClient {
    return new McpHttpClient(
      profile.mcp.httpEndpoint,
      apiKey,
      profile.mcp.authHeader || 'x-api-key',
    );
  }

  async rpc<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<McpCallResult<T>> {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      };
      if (this.apiKey) {
        headers[this.authHeader] = this.apiKey;
      }

      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: this.requestId++,
          method,
          params,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - started;
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          httpStatus: res.status,
          latencyMs,
          error: `HTTP ${res.status}: Unauthorized for endpoint ${this.endpoint}`,
          isAuthMismatch: true,
        };
      }

      const text = await res.text();
      if (!res.ok) {
        return {
          ok: false,
          httpStatus: res.status,
          latencyMs,
          error: `HTTP ${res.status}: ${text.slice(0, 300)}`,
        };
      }

      // Support both application/json and SSE `data: {...}` responses
      const jsonLine = text
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'))
        ?.slice(5)
        .trim();
      const parsed = JSON.parse(jsonLine || text);

      if (parsed.error) {
        return {
          ok: false,
          httpStatus: res.status,
          latencyMs,
          error: parsed.error.message || JSON.stringify(parsed.error),
        };
      }

      return {
        ok: true,
        httpStatus: res.status,
        latencyMs,
        data: parsed.result as T,
      };
    } catch (err) {
      return {
        ok: false,
        httpStatus: 0,
        latencyMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async pingAndListTools(): Promise<McpCallResult<{ tools: McpToolDefinition[] }>> {
    await this.rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'biaomai-operations-platform', version: '1.0.0' },
    });
    return this.rpc<{ tools: McpToolDefinition[] }>('tools/list', {});
  }

  async callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<McpCallResult<T>> {
    return this.rpc<T>('tools/call', { name, arguments: args });
  }
}
