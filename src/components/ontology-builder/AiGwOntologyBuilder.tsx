'use client';

import React, { useState } from 'react';
import { NextResponse } from 'next/server';

const VERCEL_AI_ENDPOINT = process.env.VERCEL_AI_ENDPOINT || 'https://api.vercel.ai/v1/generate';
const VERCEL_AI_API_KEY = process.env.VERCEL_AI_API_KEY;
const DEBUG = process.env.VERCEL_AI_DEBUG === '1';

type GenerateResponse = {
    // shape returned from the API route — we return the raw JSON from the gateway
    [key: string]: any;
};

export default function AiGwOntologyBuilder() {
    const [prompt, setPrompt] = useState<string>('Create an ontology for a simple e-commerce domain with products, categories, users, and orders.');
    const [model, setModel] = useState<string>('gpt-4o');
    const [maxTokens, setMaxTokens] = useState<number>(800);
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    async function handleGenerate(e?: React.FormEvent) {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        setResult('');

        try {
            const resp = await fetch('/api/vercel-ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model, max_tokens: maxTokens }),
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Server returned ${resp.status}: ${text}`);
            }

            const json: GenerateResponse = await resp.json();

            // Try to find a meaningful text field from the gateway response:
            // Some gateways return { output: [{ content: "..." }, ...] } or { choices: [...] }.
            let outputText = '';
            if (json.output && Array.isArray(json.output)) {
                // Vercel AI often returns `output: [{ id, type, content: "..." }]`
                outputText = json.output.map((o: any) => (o.content ?? o.text ?? JSON.stringify(o))).join('\n\n');
            } else if (json.choices && Array.isArray(json.choices)) {
                outputText = json.choices.map((c: any) => c.text ?? c.message?.content ?? JSON.stringify(c)).join('\n\n');
            } else if (typeof json.text === 'string') {
                outputText = json.text;
            } else {
                // fallback: pretty-print JSON
                outputText = JSON.stringify(json, null, 2);
            }

            setResult(outputText);
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? String(err));
        } finally {
            setLoading(false);
        }
    }

    function handleCopy() {
        if (!result) return;
        navigator.clipboard?.writeText(result);
    }

    return (
        <div className="p-4 bg-transparent rounded-md shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Ontology Builder (Vercel AI Gateway)</h2>
            <form onSubmit={handleGenerate} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium">Model</label>
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1">
                        <option value="gpt-4o">gpt-4o</option>
                        <option value="gpt-4o-mini">gpt-4o-mini</option>
                        <option value="gpt-4">gpt-4</option>
                        <option value="gpt-3.5">gpt-3.5</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">Max tokens</label>
                    <input
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(Number(e.target.value))}
                        className="mt-1 block w-40 border rounded px-2 py-1"
                        min={1}
                        max={4000}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={6}
                        className="mt-1 block w-full border rounded px-2 py-1 font-mono text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
                    >
                        {loading ? 'Generating…' : 'Generate Ontology'}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setPrompt(''); setResult(''); setError(null); }}
                        className="px-3 py-1 border rounded"
                    >
                        Reset
                    </button>

                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!result}
                        className="px-3 py-1 border rounded disabled:opacity-60"
                    >
                        Copy Result
                    </button>
                </div>

                {error && <div className="text-red-600 text-sm">Error: {error}</div>}

                {result && (
                    <div className="mt-3">
                        <label className="block text-sm font-medium">Result</label>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-sm font-mono">{result}</pre>
                    </div>
                )}
            </form>
        </div>
    );
}

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

    // Log request payload for debugging (server logs only)
    if (DEBUG) {
        console.log('[vercel-ai] Forwarding request to', VERCEL_AI_ENDPOINT);
        console.log('[vercel-ai] Request payload:', JSON.stringify(body, null, 2));
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

        // Log gateway response body+status for debug
        if (DEBUG) {
            console.log('[vercel-ai] Gateway status:', resp.status);
            console.log('[vercel-ai] Gateway response text:', text);
            // If possible, log headers too (caution: don't log sensitive headers)
            try {
                const hdrs: Record<string, string> = {};
                resp.headers.forEach((v, k) => (hdrs[k] = v));
                console.log('[vercel-ai] Gateway response headers:', hdrs);
            } catch (e) { /* ignore */ }
        }

        // Forward JSON or text response
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