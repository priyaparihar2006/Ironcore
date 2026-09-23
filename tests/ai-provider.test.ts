import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Pool } from 'pg';
import { setPoolForTests } from '../server/postgres.js';
import { aiConfig } from '../server/ai/config.js';
import { aiAvailable, generateStructured, objectSchema } from '../server/ai/provider.js';

const keys = ['NODE_ENV', 'AI_ENABLED', 'AI_API_FORMAT', 'AI_BASE_URL', 'AI_API_KEY',
  'OPENROUTER_API_KEY', 'AI_OUTPUT_MODE',
  'AI_MODEL', 'AI_PRICING_MODE', 'AI_INPUT_USD_PER_MILLION', 'AI_OUTPUT_USD_PER_MILLION',
  'AI_MONTHLY_BUDGET', 'AI_DAILY_REQUEST_LIMIT'];
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const realFetch = globalThis.fetch;
let calls: { url: string; init: RequestInit; body: any }[];
let writes: { sql: string; params?: unknown[] }[];
let spent: number, daily: number;
let reply: unknown;
const schema = objectSchema({ observations: { type: 'array', items: { type: 'string' } } });
const run = () => generateStructured('member', 'Summarize observations.', {}, schema);

beforeEach(() => {
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, {
    NODE_ENV: 'test', AI_ENABLED: 'true', AI_MODEL: 'test-model', AI_API_KEY: 'test-key',
    AI_INPUT_USD_PER_MILLION: '1', AI_OUTPUT_USD_PER_MILLION: '2', AI_MONTHLY_BUDGET: '10',
  });
  calls = [];
  writes = [];
  spent = daily = 0;
  reply = { status: 'completed', output: [{ content: [
    { type: 'output_text', text: '{"observations":["Test"]}' },
  ] }], usage: { input_tokens: 12, output_tokens: 8 } };
  const query = async (sql: string, params?: unknown[]) => {
    writes.push({ sql, params });
    return { rows: sql.includes('AS spent') ? [{ spent, daily }] : [] };
  };
  setPoolForTests({ query, connect: async () => ({ query, release() {} }) } as unknown as Pool);
  globalThis.fetch = (async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init, body: JSON.parse(String(init.body)) });
    return Response.json(reply);
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

test('existing paid Responses configuration remains compatible', async () => {
  assert.equal(aiAvailable(), true);
  assert.deepEqual(await run(), { observations: ['Test'] });
  assert.equal(calls[0].url, 'https://api.openai.com/v1/responses');
  assert.equal(calls[0].body.store, false);
  assert.deepEqual(calls[0].body.text.format.schema, schema);
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal((calls[0].init.headers as any).Authorization, 'Bearer test-key');
  assert.ok(writes.some((w) => w.params?.[1] === 'complete' && w.params[2] === 12));
});

test('compatible providers receive Chat Completions format and usage is recorded', async () => {
  process.env.AI_API_FORMAT = 'chat_completions';
  process.env.AI_BASE_URL = 'https://provider.example/v1/';
  reply = { choices: [{ finish_reason: 'stop', message: { content: '{"observations":[]}' } }],
    usage: { prompt_tokens: 5, completion_tokens: 3 } };
  assert.deepEqual(await run(), { observations: [] });
  assert.equal(calls[0].url, 'https://provider.example/v1/chat/completions');
  assert.equal(calls[0].body.model, 'test-model');
  assert.equal(calls[0].body.messages[0].role, 'system');
  assert.deepEqual(calls[0].body.response_format.json_schema.schema, schema);
  assert.equal(calls[0].body.max_tokens, 1800);
  assert.equal(calls[0].body.store, undefined);
  assert.ok(writes.some((w) => w.params?.[1] === 'complete' && w.params[2] === 5 && w.params[3] === 3));
});

test('free local models allow no key, reserve zero cost and still enforce daily limits', async () => {
  Object.assign(process.env, { AI_BASE_URL: 'http://localhost:11434/v1', AI_PRICING_MODE: 'free',
    AI_API_KEY: '', AI_INPUT_USD_PER_MILLION: '0', AI_OUTPUT_USD_PER_MILLION: '0',
    AI_MONTHLY_BUDGET: '0', AI_DAILY_REQUEST_LIMIT: '2' });
  spent = 10; // Earlier paid usage must not prevent a zero-cost call.
  assert.equal(aiAvailable(), true);
  await run();
  assert.equal((calls[0].init.headers as any).Authorization, undefined);
  assert.ok(writes.some((w) => w.sql.startsWith('INSERT') && w.params?.[2] === 0));
  daily = 2;
  await assert.rejects(run(), { status: 429 });
  assert.equal(calls.length, 1);
});

test('invalid config and paid budget exhaustion make no provider call', async () => {
  for (const [key, value] of [
    ['AI_API_FORMAT', 'unknown'], ['AI_PRICING_MODE', 'unknown'],
    ['AI_BASE_URL', 'http://remote.example/v1'], ['AI_BASE_URL', 'https://user:pass@host.example/v1'],
    ['AI_BASE_URL', 'https://host.example/v1?api_key=secret'], ['AI_BASE_URL', 'not a URL'],
    ['AI_API_KEY', ' '], ['AI_MODEL', ' '], ['AI_INPUT_USD_PER_MILLION', ''],
    ['AI_INPUT_USD_PER_MILLION', '-1'], ['AI_OUTPUT_USD_PER_MILLION', 'NaN'],
    ['AI_MONTHLY_BUDGET', '0'],
  ]) {
    const previous = process.env[key];
    process.env[key] = value;
    assert.equal(aiConfig(), undefined, key + ': ' + value);
    await assert.rejects(run(), { status: 503 });
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
  spent = 10;
  await assert.rejects(run(), { status: 429 });
  assert.equal(calls.length, 0);
});

test('zero prices require explicit free mode; a paid model can have one zero rate', () => {
  process.env.AI_INPUT_USD_PER_MILLION = '0';
  assert.equal(aiAvailable(), true);
  process.env.AI_OUTPUT_USD_PER_MILLION = '0';
  assert.equal(aiAvailable(), false);
  process.env.AI_PRICING_MODE = 'free';
  assert.equal(aiAvailable(), true);
  process.env.AI_OUTPUT_USD_PER_MILLION = '1';
  assert.equal(aiAvailable(), false);
});

test('OpenRouter free model uses its own key and validates prompted JSON without response_format', async () => {
  Object.assign(process.env, {
    AI_API_FORMAT: 'chat_completions', AI_BASE_URL: 'https://openrouter.ai/api/v1',
    AI_MODEL: 'inclusionai/ling-3.0-flash-vl:free', OPENROUTER_API_KEY: 'router-test-key',
    AI_OUTPUT_MODE: 'prompt_json', AI_PRICING_MODE: 'free',
    AI_INPUT_USD_PER_MILLION: '0', AI_OUTPUT_USD_PER_MILLION: '0', AI_MONTHLY_BUDGET: '0',
  });
  reply = { choices: [{ finish_reason: 'stop', message: { content: '{"observations":["Test"]}' } }] };
  assert.deepEqual(await run(), { observations: ['Test'] });
  assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal((calls[0].init.headers as any).Authorization, 'Bearer router-test-key');
  assert.equal(calls[0].body.model, 'inclusionai/ling-3.0-flash-vl:free');
  assert.equal(calls[0].body.stream, false);
  assert.equal(calls[0].body.response_format, undefined);
  assert.ok(calls[0].body.messages[0].content.includes(JSON.stringify(schema)));
  for (const content of ['{}', '{"observations":[1]}', '{"observations":[],"extra":true}']) {
    reply = { choices: [{ finish_reason: 'stop', message: { content } }] };
    await assert.rejects(run(), { status: 502 });
  }
  process.env.AI_BASE_URL = 'https://other.example/v1';
  assert.equal(aiConfig()?.key, 'test-key'); // Never forward the router key elsewhere.
});

test('chat refusal, truncation, malformed JSON and provider failures never report success', async () => {
  process.env.AI_API_FORMAT = 'chat_completions';
  for (const choice of [
    { finish_reason: 'stop', message: { refusal: 'No' } },
    { finish_reason: 'content_filter', message: {} },
    { finish_reason: 'length', message: { content: '{"observations":[]}' } },
    { finish_reason: 'stop', message: { content: '{bad' } },
    { finish_reason: 'stop', message: { content: 'null' } },
    { finish_reason: 'stop', message: { content: [] } },
  ]) {
    reply = { choices: [choice] };
    await assert.rejects(run());
  }
  globalThis.fetch = async () => Response.json({ error: 'private provider detail' }, { status: 429 });
  await assert.rejects(run(), { status: 503, message: 'The AI service is unavailable. Your existing records are safe.' });
  globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };
  await assert.rejects(run(), { status: 503 });
  assert.equal(writes.filter((w) => w.params?.[1] === 'failed').length, 8);
  assert.equal(writes.some((w) => w.params?.[1] === 'complete'), false);
});
