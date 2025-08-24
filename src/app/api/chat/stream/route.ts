import { NextRequest } from 'next/server';
import { messageStore } from '../messageStore';

export async function GET(request: NextRequest) {
    console.log('=== STREAM ROUTE START ===');
    console.log('Request URL:', request.url);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const model = searchParams.get('model') || 'mistral-small-latest';
    const temperature = parseFloat(searchParams.get('temperature') || '0.5');

    console.log('Stream request params:', {
        sessionId,
        model,
        temperature: temperature.toString()
    });

    if (!sessionId) {
        console.error('No sessionId provided');
        return new Response('Missing sessionId', { status: 400 });
    }

    try {
        console.log(`Stream request received for session ${sessionId}`);

        // Get session data  
        const sessionData = messageStore.get(sessionId);
        if (!sessionData) {
            console.error(`Session ${sessionId} not found in messageStore`);
            console.log('Available sessions:', Array.from(messageStore.keys()));
            return new Response('Session not found', { status: 404 });
        }

        console.log(`Found session ${sessionId}, proceeding with streaming...`);
        console.log('Session data:', {
            messageCount: sessionData.messages?.length || 0,
            model: sessionData.model
        });

        const { messages, model: sessionModel, temperature: sessionTemperature } = sessionData;
        const modelToUse = sessionModel || model;
        const temperatureToUse = sessionTemperature ?? temperature;

        // Create the stream
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Make the API request to your AI service
                    let apiUrl: string;
                    let apiKey: string | undefined;

                    let provider: 'openai' | 'deepseek' | 'mistral' = 'mistral';
                    if (modelToUse.startsWith('gpt-')) {
                        apiUrl = 'https://api.openai.com/v1/chat/completions';
                        apiKey = process.env.OPENAI_API_KEY;
                        provider = 'openai';
                    } else if (modelToUse.startsWith('deepseek')) {
                        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                        apiKey = process.env.DEEPSEEK_API_KEY;
                        provider = 'deepseek';
                    } else {
                        apiUrl = 'https://api.mistral.ai/v1/chat/completions';
                        apiKey = process.env.MISTRAL_API_KEY;
                        provider = 'mistral';
                    }

                    if (!apiKey) {
                        throw new Error('Missing API key for selected provider');
                    }

                    // NEW: fetch the upstream streaming response
                    // Build request body carefully: some providers/models (eg. OpenAI gpt-*) only support the default temperature (1)
                    const requestBody: any = {
                        model: modelToUse,
                        messages: messages,
                        stream: true,
                    };

                    if (provider === 'openai') {
                        // OpenAI gpt-* models often only accept the default temperature. Only include it when the value is 1.
                        if (temperatureToUse === 1) {
                            requestBody.temperature = temperatureToUse;
                        } else {
                            console.warn(`Requested temperature ${temperatureToUse} not supported for model ${modelToUse}; omitting temperature to use provider default.`);
                        }
                    } else {
                        // Other providers (mistral, deepseek) can receive the temperature value
                        requestBody.temperature = temperatureToUse;
                    }

                    const upstreamResponse = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (!upstreamResponse.ok) {
                        const errorBody = await upstreamResponse.text();
                        console.error('API request failed with body:', errorBody);

                        // Try to parse error to detect if streaming was rejected (common with some OpenAI models/orgs)
                        let parsedError: any = null;
                        try { parsedError = JSON.parse(errorBody); } catch (e) { /* ignore */ }

                        const streamRejected = parsedError?.error?.param === 'stream'
                            || parsedError?.error?.code === 'unsupported_value'
                            || /stream/i.test(errorBody) && /unsupported|verify|verified|organization/i.test(errorBody);

                        if (streamRejected) {
                            console.warn('Upstream rejected streaming; attempting fallback to non-streaming request');

                            // Fallback: request a non-streaming completion and send it as a single SSE payload
                            const fallbackBody = { ...requestBody, stream: false };

                            let fallbackResp: Response | null = null;
                            try {
                                fallbackResp = await fetch(apiUrl, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${apiKey}`,
                                    },
                                    body: JSON.stringify(fallbackBody),
                                });
                            } catch (fbNetErr) {
                                console.error('Fallback network error:', fbNetErr);
                                const errData = `data: ${JSON.stringify({ error: 'fallback_network_error', message: fbNetErr instanceof Error ? fbNetErr.message : String(fbNetErr) })}\n\n`;
                                controller.enqueue(encoder.encode(errData));
                                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                                controller.close();
                                return;
                            }

                            if (!fallbackResp.ok) {
                                const fbBody = await fallbackResp.text();
                                console.error('Fallback non-streaming request failed with body:', fbBody);
                                const errData = `data: ${JSON.stringify({ error: 'fallback_failed', status: fallbackResp.status, body: fbBody })}\n\n`;
                                controller.enqueue(encoder.encode(errData));
                                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                                controller.close();
                                return;
                            }

                            try {
                                const json = await fallbackResp.json();

                                // Extract content from common response shapes
                                const content = json?.choices?.[0]?.message?.content
                                    ?? json?.choices?.[0]?.text
                                    ?? json?.content
                                    ?? json?.output
                                    ?? '';

                                if (content) {
                                    const out = `data: ${JSON.stringify({ content })}\n\n`;
                                    controller.enqueue(encoder.encode(out));
                                } else {
                                    // Send whole JSON as a fallback payload
                                    const out = `data: ${JSON.stringify({ content: JSON.stringify(json) })}\n\n`;
                                    controller.enqueue(encoder.encode(out));
                                }

                                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                                controller.close();
                                return;
                            } catch (fbErr) {
                                console.error('Fallback response parsing failed:', fbErr);
                                const errData = `data: ${JSON.stringify({ error: 'fallback_parse_error', message: fbErr instanceof Error ? fbErr.message : String(fbErr) })}\n\n`;
                                controller.enqueue(encoder.encode(errData));
                                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                                controller.close();
                                return;
                            }
                        }

                        throw new Error(`API request failed: ${upstreamResponse.status} ${upstreamResponse.statusText}`);
                    }

                    const reader = upstreamResponse.body?.getReader();
                    if (!reader) {
                        throw new Error('Failed to get response reader');
                    }

                    const decoder = new TextDecoder();
                    let buffer = ''; // carry-over buffer for partial lines

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });

                        // Split into lines; keep the last partial one in the buffer
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed) continue;

                            // Skip provider's [DONE] markers; we send our own
                            if (trimmed === 'data: [DONE]') {
                                continue;
                            }

                            if (!trimmed.startsWith('data: ')) {
                                // ignore comments/other SSE fields
                                continue;
                            }

                            const jsonStr = trimmed.slice(6).trim();
                            try {
                                const parsed = JSON.parse(jsonStr);

                                // Support OpenAI-compatible deltas and simple content payloads
                                const content =
                                    parsed?.choices?.[0]?.delta?.content ??
                                    parsed?.delta?.content ??
                                    parsed?.content ??
                                    '';

                                if (content) {
                                    const out = `data: ${JSON.stringify({ content })}\n\n`;
                                    controller.enqueue(encoder.encode(out));
                                }
                            } catch (e) {
                                // Likely an incomplete JSON split across chunks — re-buffer it
                                buffer = `${jsonStr}\n${buffer}`;
                            }
                        }
                    }

                    // Send our own [DONE] marker
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);

                    try {
                        const errorData = `data: ${JSON.stringify({
                            error: 'stream_error',
                            message: error instanceof Error ? error.message : String(error),
                        })}\n\n`;
                        controller.enqueue(encoder.encode(errorData));
                    } finally {
                        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                        controller.close();
                    }
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Stream route error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}