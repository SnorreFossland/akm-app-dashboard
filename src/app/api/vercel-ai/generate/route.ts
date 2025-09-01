import { NextResponse } from 'next/server';

const VERCEL_AI_ENDPOINT = process.env.VERCEL_AI_ENDPOINT; // require explicit config
const VERCEL_AI_API_KEY = process.env.VERCEL_AI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEBUG = process.env.VERCEL_AI_DEBUG === '1';

/**
 * POST handler: proxies a JSON body { prompt, model, ... } to the Vercel AI Gateway.
 * Returns the gateway's JSON response.
 */
export async function POST(req: Request) {
    let body: any;
    try {
        body = await req.json();
    } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // If a Vercel AI Gateway endpoint is configured, proxy to it.
    if (VERCEL_AI_ENDPOINT) {
        if (!VERCEL_AI_API_KEY) {
            return NextResponse.json({
                error: 'Missing VERCEL_AI_API_KEY for Vercel AI Gateway. Set process.env.VERCEL_AI_API_KEY',
            }, { status: 500 });
        }

        if (DEBUG) {
            console.log('[vercel-ai] Forwarding request to', VERCEL_AI_ENDPOINT);
            console.log('[vercel-ai] Outgoing payload:', JSON.stringify(body, null, 2));
        }

        try {
            const resp = await fetch(VERCEL_AI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${VERCEL_AI_API_KEY}`,
                },
                body: JSON.stringify(body),
            });

            const text = await resp.text();

            if (DEBUG) {
                console.log('[vercel-ai] Gateway status:', resp.status);
                console.log('[vercel-ai] Gateway response:', text);
                try {
                    const hdrs: Record<string, string> = {};
                    resp.headers.forEach((v, k) => (hdrs[k] = v));
                    console.log('[vercel-ai] Gateway headers:', hdrs);
                } catch (e) { }
            }

            try {
                const json = JSON.parse(text);
                return NextResponse.json(json, { status: resp.status });
            } catch {
                return new NextResponse(text, { status: resp.status, headers: { 'Content-Type': 'text/plain' } });
            }
        } catch (err: any) {
            console.error('[vercel-ai] Error forwarding request:', err);
            return NextResponse.json({ error: String(err) }, { status: 500 });
        }
    }

    // Fallback: call OpenAI directly if configured
    if (OPENAI_API_KEY) {
        const model = body.model || 'gpt-4o-mini';
        const prompt = body.prompt || '';
        const max_tokens = body.max_tokens;

        try {
            const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    ...(max_tokens ? { max_tokens } : {}),
                }),
            });

            const json = await resp.json();
            if (DEBUG) {
                console.log('[openai-fallback] status:', resp.status);
                console.log('[openai-fallback] response:', JSON.stringify(json));
            }

            // Normalize to a structure the client can display easily
            if (!resp.ok) {
                return NextResponse.json(json, { status: resp.status });
            }

            const output = (json.choices || []).map((c: any, i: number) => ({
                id: String(i),
                type: 'message',
                content: c.message?.content ?? c.text ?? '',
            }));

            return NextResponse.json({ output }, { status: 200 });
        } catch (err: any) {
            console.error('[openai-fallback] Error:', err);
            return NextResponse.json({ error: String(err) }, { status: 500 });
        }
    }

    // Neither gateway nor OpenAI configured
    return NextResponse.json({
        error: 'No AI backend configured. Set VERCEL_AI_ENDPOINT + VERCEL_AI_API_KEY for a gateway, or OPENAI_API_KEY to use OpenAI directly.',
    }, { status: 500 });
}
