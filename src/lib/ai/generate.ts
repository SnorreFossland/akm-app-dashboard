export interface GatewayPayload {
  prompt: string;
  model: string;
  temperature?: number;
  max_completion_tokens?: number;
}

function toJson(body: unknown) {
  try {
    return JSON.stringify(body);
  } catch {
    return "{}";
  }
}

function extractContent(payload: any): string {
  if (!payload) return '';
  if (Array.isArray(payload.output)) {
    return payload.output.map((o: any) => o?.content ?? '').filter(Boolean).join('\n\n');
  }
  if (payload.choices?.length) {
    return payload.choices.map((c: any) => c?.message?.content ?? c?.text ?? '').filter(Boolean).join('\n');
  }
  if (typeof payload.content === 'string') return payload.content;
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload);
}

async function doCall(payload: GatewayPayload): Promise<{ resp: Response; text: string; data: any }> {
  const resp = await fetch('/api/vercel-ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: toJson(payload),
  });
  const text = await resp.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { content: text }; }
  return { resp, text, data };
}

export async function callGateway(payload: GatewayPayload): Promise<string> {
  // First attempt as-is
  let { resp, text, data } = await doCall(payload);

  if (!resp.ok) {
    // Retry without temperature if provider rejects it
    const errMsg = typeof data?.error?.message === 'string' ? data.error.message : String(text || '');
    const isTempError = (resp.status === 400) && errMsg.toLowerCase().includes('temperature');
    if (isTempError && 'temperature' in payload) {
      const { temperature, ...retryPayload } = payload as any;
      ({ resp, text, data } = await doCall(retryPayload));
      if (!resp.ok) {
        throw new Error(`gateway HTTP ${resp.status}: ${data?.error ?? text}`);
      }
    } else {
      throw new Error(`gateway HTTP ${resp.status}: ${data?.error ?? text}`);
    }
  }

  return extractContent(data) || '';
}

