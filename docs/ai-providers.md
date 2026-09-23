# AI providers and free/paid models

IronCore supports one active provider/model configuration at a time. Change the private `.env` or server environment and restart the backend to switch. Existing OpenAI configurations keep working: the default format is `responses`, default base URL is `https://api.openai.com/v1`, and default pricing mode is `paid`.

By default, the selected endpoint/model must support strict JSON Schema structured output. The app sends `text.format` for Responses or `response_format.json_schema` for Chat Completions. For chat models without schema support, set `AI_OUTPUT_MODE=prompt_json`: the schema is included in the prompt instead of sending `response_format`. Both modes validate the returned JSON against the application's schema subset locally, reject refusals/incomplete responses, and retain domain validation. There is no automatic fallback to another provider or paid model.

## Requested OpenRouter model

The private `.env` has been configured for `inclusionai/ling-3.0-flash-vl:free`. Add your key as `OPENROUTER_API_KEY=your-key` and restart the backend. This key takes precedence over `AI_API_KEY` only for the `openrouter.ai` host.

```dotenv
AI_ENABLED=true
AI_API_FORMAT=chat_completions
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=inclusionai/ling-3.0-flash-vl:free
AI_OUTPUT_MODE=prompt_json
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
AI_PRICING_MODE=free
AI_INPUT_USD_PER_MILLION=0
AI_OUTPUT_USD_PER_MILLION=0
AI_MONTHLY_BUDGET=0
```

The [OpenRouter catalog](https://openrouter.ai/api/v1/models) lists this free variant without `response_format` or `structured_outputs` support at the time of setup. Prompted JSON is therefore used; the model may still return invalid output, which the app rejects without saving a result. Unlike the sample streaming curl request, the app uses `stream:false` to validate complete responses before persistence. No live authenticated request was performed.

## Hosted compatible provider: free model

Replace placeholders with a provider key and an exact model ID from that provider. Confirm both zero cost and structured-output support for that model/account; a free website subscription does not imply a free API.

```dotenv
AI_ENABLED=true
AI_API_FORMAT=chat_completions
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=YOUR_OPENROUTER_KEY
AI_MODEL=YOUR_EXACT_FREE_SCHEMA_CAPABLE_MODEL_ID
AI_PRICING_MODE=free
AI_INPUT_USD_PER_MILLION=0
AI_OUTPUT_USD_PER_MILLION=0
AI_MONTHLY_BUDGET=0
AI_DAILY_REQUEST_LIMIT=20
AI_TIMEOUT_MS=25000
```

These placeholders are not runnable model recommendations. Model availability, free quotas and structured-output support can change. Setting `free` does not make a paid model free or enforce a provider billing limit.

## Paid model

Use the same configuration with your paid model ID and these changes. Example rates below demonstrate the numeric format only; replace them with the actual model prices.

```dotenv
AI_PRICING_MODE=paid
AI_INPUT_USD_PER_MILLION=1.25
AI_OUTPUT_USD_PER_MILLION=10.00
AI_MONTHLY_BUDGET=10
```

Both rates must be explicitly configured and non-negative; at least one must be positive. The budget must be positive. Free mode requires both rates explicitly set to zero and a non-negative budget. Blank, negative or invalid values disable AI instead of bypassing accounting.

The budget is shared across the application and provider switches. Previously reserved paid usage remains counted. Zero-cost requests can still run after paid budget exhaustion, but both modes enforce the daily member limit. Failed calls retain their reservations. Provider quotas and billing controls remain independent.

## Other endpoints

| Service | `AI_API_FORMAT` | `AI_BASE_URL` | Key/model |
| --- | --- | --- | --- |
| OpenAI | `responses` | `https://api.openai.com/v1` | OpenAI key and supported model ID |
| OpenRouter | `chat_completions` | `https://openrouter.ai/api/v1` | OpenRouter key and full provider/model ID |
| Gemini compatibility API | `chat_completions` | `https://generativelanguage.googleapis.com/v1beta/openai` | Gemini key and supported model ID |
| Local Ollama | `chat_completions` | `http://localhost:11434/v1` | Installed schema-capable model; key may be empty |

Custom providers/gateways can use either supported protocol. Chat Completions requests use `max_tokens`; choose Responses for OpenAI models that require its token parameter. Native Anthropic Messages and native Gemini `generateContent` are not implemented; their URLs are not interchangeable with compatible API URLs. Additional provider-specific headers or authentication schemes are not supported.

Base URLs include the API prefix but exclude `/responses` and `/chat/completions`, which the app appends. URLs must use HTTPS, except loopback HTTP for local serving. URLs with credentials, query strings or fragments are rejected; redirects are not followed. Hosted endpoints require a key. A local endpoint must be reachable from the backend process/container.

## Local model example

Start your local model server and install a model supporting structured output before enabling:

```dotenv
AI_ENABLED=true
AI_API_FORMAT=chat_completions
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=
AI_MODEL=YOUR_INSTALLED_SCHEMA_CAPABLE_MODEL
AI_PRICING_MODE=free
AI_INPUT_USD_PER_MILLION=0
AI_OUTPUT_USD_PER_MILLION=0
AI_MONTHLY_BUDGET=0
AI_DAILY_REQUEST_LIMIT=20
AI_TIMEOUT_MS=45000
```

Timeouts remain capped at 45 seconds. Local inference still uses your hardware resources. Nutrition food lookup separately requires `FOOD_DATA_API_KEY`; accepting targets and generating diet plans still require the existing policy review flag and eligible user consent. A provider switch does not change these conditions.

The consent page displays the configured endpoint hostname. Review the new provider's data handling before switching; gateways may forward requests to upstream providers. Responses requests include `store:false`; the generic chat adapter does not assume other providers support this field or promise zero retention. Existing saved consent is not automatically revoked on provider changes; inform members and obtain renewed consent where required by your deployment policy.

## Verification and references

Adapter tests mock all provider calls, covering configuration, both wire formats, authentication headers, refusals, truncated/malformed output, usage accounting, budgets and free-model quotas. No live provider compatibility or account quota has been tested.

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenRouter API format](https://openrouter.ai/docs/api_reference/overview)
- [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- [Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility)
