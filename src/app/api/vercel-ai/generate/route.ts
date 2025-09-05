import { NextResponse } from 'next/server';

const VERCEL_AI_ENDPOINT = process.env.VERCEL_AI_ENDPOINT;
const VERCEL_AI_API_KEY = process.env.VERCEL_AI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEBUG = process.env.VERCEL_AI_DEBUG === '1';

function isOpenAI(model: string) { return model?.startsWith('gpt-'); }
function isMistral(model: string) { return model?.startsWith('mistral'); }
function isDeepSeek(model: string) { return model?.startsWith('deepseek'); }

function normalizeOutput(json: any) {
  // OpenAI chat.completions style
  const chatOut = (json?.choices || []).map((c: any, i: number) => ({
    id: String(i),
    type: 'message',
    content: c?.message?.content ?? c?.text ?? '',
  }));
  if (chatOut.length > 0) return { output: chatOut };

  // OpenAI responses style
  if (Array.isArray(json?.output)) {
    const parts = json.output
      .flatMap((o: any) => Array.isArray(o?.content) ? o.content : [])
      .map((p: any) => p?.text ?? p?.content ?? '')
      .filter(Boolean);
    const text = parts.join('');
    if (text) return { output: [{ id: '0', type: 'message', content: text }] };
  }
  if (Array.isArray(json?.output_text) && json.output_text.length) {
    return { output: [{ id: '0', type: 'message', content: String(json.output_text[0] ?? '') }] };
  }
  if (typeof json?.output_text === 'string' && json.output_text) {
    return { output: [{ id: '0', type: 'message', content: json.output_text }] };
  }

  // Some gateways may return a flat content
  if (typeof json?.content === 'string') {
    return { output: [{ id: '0', type: 'message', content: json.content }] };
  }
  return json;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const model: string = body.model || 'gpt-4o-mini';
  const prompt: string = body.prompt || '';
  const max_tokens_input = body.max_tokens;
  const max_completion_tokens_input = body.max_completion_tokens;
  const maxTokens: number | undefined =
    typeof max_tokens_input === 'number'
      ? max_tokens_input
      : typeof max_completion_tokens_input === 'number'
        ? max_completion_tokens_input
        : undefined;
  const temperature = typeof body.temperature === 'number' ? body.temperature : undefined;

  // 1) If a Vercel AI Gateway endpoint is configured, forward the request as-is
  if (VERCEL_AI_ENDPOINT) {
    if (!VERCEL_AI_API_KEY) {
      return NextResponse.json({ error: 'Missing VERCEL_AI_API_KEY for Vercel AI Gateway. Set process.env.VERCEL_AI_API_KEY' }, { status: 500 });
    }
    if (DEBUG) {
      console.log('[vercel-ai] Forwarding to gateway:', VERCEL_AI_ENDPOINT);
      console.log('[vercel-ai] Payload:', JSON.stringify(body, null, 2));
    }
    try {
      // Translate max_tokens to max_completion_tokens for gateways that expect it
      const forward: any = { ...body };
      if (isOpenAI(model)) {
        if (typeof body.max_tokens === 'number') {
          delete forward.max_tokens;
          forward.max_completion_tokens = body.max_tokens;
        }
      }
      const resp = await fetch(VERCEL_AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${VERCEL_AI_API_KEY}` },
        body: JSON.stringify(forward),
      });
      const text = await resp.text();
      if (DEBUG) {
        console.log('[vercel-ai] status:', resp.status);
        console.log('[vercel-ai] response:', text);
      }
      try {
        const json = JSON.parse(text);
        return NextResponse.json(json, { status: resp.status });
      } catch {
        return new NextResponse(text, { status: resp.status, headers: { 'Content-Type': 'text/plain' } });
      }
    } catch (err: any) {
      console.error('[vercel-ai] Error forwarding:', err);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // Helper: minimal alias mapping for direct provider calls (no gateway)
  const mapAliasForDirect = (m: string): string => {
    // Map UI-friendly IDs to real provider model IDs
    if (m === 'gpt-5-mini') return 'gpt-4o-mini';
    if (m === 'gpt-5') return 'gpt-4o-2024-08-06';
    if (m === 'mistral') return 'mistral-small-latest';
    return m;
  };

  // 2) Provider-aware direct calls (fallback if no gateway)
  try {
    if (isOpenAI(model)) {
      if (!OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
      }
      const resolved = mapAliasForDirect(model);
      // Use Responses API for broader model compatibility
      const resp = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: resolved,
          input: prompt,
          ...(typeof maxTokens === 'number' ? { max_output_tokens: maxTokens } : {}),
          ...(typeof temperature === 'number' ? { temperature } : {}),
        }),
      });
      const json = await resp.json();
      if (!resp.ok) return NextResponse.json(json, { status: resp.status });
      return NextResponse.json(normalizeOutput(json), { status: 200 });
    }

    if (isDeepSeek(model)) {
      if (!DEEPSEEK_API_KEY) {
        return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 500 });
      }
      const resolved = mapAliasForDirect(model);
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: resolved,
          messages: [{ role: 'user', content: prompt }],
          ...(typeof maxTokens === 'number' ? { max_tokens: maxTokens } : {}),
          ...(typeof temperature === 'number' ? { temperature } : {}),
        }),
      });
      const json = await resp.json();
      if (!resp.ok) return NextResponse.json(json, { status: resp.status });
      return NextResponse.json(normalizeOutput(json), { status: 200 });
    }

    // default to Mistral for other models
    if (!MISTRAL_API_KEY) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY not configured' }, { status: 500 });
    }
    const resolved = mapAliasForDirect(model);
    const resp = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MISTRAL_API_KEY}` },
      body: JSON.stringify({
        model: resolved,
        messages: [{ role: 'user', content: prompt }],
        ...(typeof maxTokens === 'number' ? { max_tokens: maxTokens } : {}),
        ...(typeof temperature === 'number' ? { temperature } : {}),
      }),
    });
    const json = await resp.json();
    if (!resp.ok) return NextResponse.json(json, { status: resp.status });
    return NextResponse.json(normalizeOutput(json), { status: 200 });
  } catch (err: any) {
    console.error('[provider-fallback] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
