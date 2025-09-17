export interface GenmodelPayload {
  aiModelName: string;
  schemaName: string;
  systemPrompt?: string;
  developerPrompt?: string;
  userPrompt?: string;
}

function toJson(body: unknown) {
  try {
    return JSON.stringify(body);
  } catch {
    return "{}";
  }
}

async function readTextSafe(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function callGenmodel(payload: GenmodelPayload, init?: RequestInit): Promise<Response> {
  const res = await fetch('/api/genmodel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: toJson(payload),
    ...init,
  });

  if (!res.ok) {
    const body = await readTextSafe(res);
    throw new Error(`genmodel HTTP ${res.status}: ${body}`);
  }

  return res;
}

export async function streamGenmodel(
  payload: GenmodelPayload,
  onChunk: (chunk: string) => void,
  init?: RequestInit
): Promise<string> {
  const res = await callGenmodel(payload, init);
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const str = decoder.decode(value, { stream: true });
    accumulated += str;
    try {
      onChunk(str);
    } catch {
      // ignore consumer errors to avoid breaking the stream
    }
  }

  return accumulated;
}

