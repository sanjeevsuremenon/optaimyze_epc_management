/**
 * Minimal OpenAI-compatible chat client.
 *
 * Works with any OpenAI-compatible endpoint (DeepSeek, OpenAI, or a local
 * OpenAI-compatible server). Configure via environment variables:
 *   - OPENAI_KEY / OPENAI_API_KEY / DEEPSEEK_API_KEY (API key)
 *   - LLM_API_BASE (optional custom base URL, e.g. https://api.deepseek.com)
 *   - LLM_MODEL (optional model override, default "deepseek-chat")
 *
 * NOTE: only used for READ-ONLY natural-language query planning and result
 * summarization. The LLM never receives write credentials.
 */

export async function callDeepSeekChat(messages, options = {}) {
  const apiKey = (
    process.env.OPENAI_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    throw new Error(
      'No LLM API key found. Please set OPENAI_KEY, OPENAI_API_KEY or DEEPSEEK_API_KEY in .env'
    );
  }

  const model = options.model || process.env.LLM_MODEL || 'deepseek-chat';
  const temperature = options.temperature !== undefined ? options.temperature : 0.1;
  const max_tokens = options.max_tokens || 8192;

  const bases = process.env.LLM_API_BASE
    ? [process.env.LLM_API_BASE.replace(/\/$/, '')]
    : ['https://api.deepseek.com', 'https://api.deepseek.com/v1'];

  const endpoints = bases.map((b) => `${b}/chat/completions`);

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          ...(options.response_format ? { response_format: options.response_format } : {}),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error (${response.status}): ${errorText.slice(0, 300)}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response received from LLM model');
      }

      return content;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with endpoint ${endpoint} failed:`, err.message);
    }
  }

  throw lastError || new Error('Failed to communicate with LLM API');
}
