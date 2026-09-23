export function aiConfig() {
  if (process.env.AI_ENABLED !== 'true') return undefined;
  const format = process.env.AI_API_FORMAT?.trim() || 'responses';
  const pricing = process.env.AI_PRICING_MODE?.trim() || 'paid';
  const outputMode = process.env.AI_OUTPUT_MODE?.trim() || 'json_schema';
  if (!['json_schema', 'prompt_json'].includes(outputMode) ||
    (outputMode === 'prompt_json' && format !== 'chat_completions')) return undefined;
  if (!['responses', 'chat_completions'].includes(format) || !['paid', 'free'].includes(pricing))
    return undefined;
  let base: URL;
  try {
    base = new URL(process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1');
  } catch {
    return undefined;
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if (
    (base.protocol !== 'https:' && !(base.protocol === 'http:' && local)) ||
    base.username || base.password || base.search || base.hash
  ) return undefined;
  const key = base.hostname === 'openrouter.ai'
    ? process.env.OPENROUTER_API_KEY?.trim() || process.env.AI_API_KEY?.trim()
    : process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();
  if (!model || (!key && !local)) return undefined;
  const number = (name: string) => {
    const raw = process.env[name]?.trim();
    if (!raw || !/^\d+(?:\.\d+)?$/.test(raw)) return NaN;
    return Number(raw);
  };
  const inputPrice = number('AI_INPUT_USD_PER_MILLION');
  const outputPrice = number('AI_OUTPUT_USD_PER_MILLION');
  const budget = number('AI_MONTHLY_BUDGET');
  if (![inputPrice, outputPrice, budget].every(Number.isFinite)) return undefined;
  if (pricing === 'free' ? inputPrice !== 0 || outputPrice !== 0 : budget <= 0 || inputPrice + outputPrice <= 0)
    return undefined;
  return {
    format, outputMode, model, key, inputPrice, outputPrice, budget,
    endpoint: base.href.replace(/\/+$/, '') + (format === 'responses' ? '/responses' : '/chat/completions'),
  };
}
