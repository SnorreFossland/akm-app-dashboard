import { NextResponse } from 'next/server';

const VERCEL_AI_ENDPOINT = process.env.VERCEL_AI_ENDPOINT || 'https://api.vercel.ai/v1/generate';
const VERCEL_AI_API_KEY = process.env.VERCEL_AI_API_KEY;
const DEBUG = process.env.VERCEL_AI_DEBUG === '1';

/**
 * POST handler: proxies a JSON body { prompt, model, ... } to the Vercel AI Gateway.
 * Returns the gateway's JSON response.
 */
export async function POST(req: Request) {
    if (!VERCEL_AI_API_KEY) {
        return NextResponse.json({ error: 'Missing VERCEL_AI_API_KEY on server. Set process.env.VERCEL_AI_API_KEY' }, { status: 500 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
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