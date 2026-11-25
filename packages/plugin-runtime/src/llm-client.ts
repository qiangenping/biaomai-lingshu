export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionResult {
  ok: boolean;
  content: string;
  model: string;
  latencyMs: number;
  error?: string;
}

/**
 * Real OpenAI-compatible Chat Completions Client.
 * Works with DeepSeek, OpenAI, Qwen, OpenRouter, Gemini OpenAI-compat, and local Ollama/vLLM.
 */
export async function runChatCompletion(
  config: LlmConfig,
  messages: ChatMessageInput[],
  timeoutMs = 30000,
): Promise<LlmCompletionResult> {
  const started = Date.now();
  const base = config.baseUrl.replace(/\/+$/, '');
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - started;
    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        content: '',
        model: config.model,
        latencyMs,
        error: `HTTP ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';
    return {
      ok: true,
      content,
      model: config.model,
      latencyMs,
    };
  } catch (err) {
    return {
      ok: false,
      content: '',
      model: config.model,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}
