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
        const temperatureToUse = sessionTemperature || temperature;

        // Create the stream
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Make the API request to your AI service
                    let apiUrl;
                    let apiKey;

                    if (modelToUse.startsWith('gpt-')) {
                        apiUrl = 'https://api.openai.com/v1/chat/completions';
                        apiKey = process.env.OPENAI_API_KEY;
                    } else if (modelToUse.startsWith('deepseek')) {
                        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                        apiKey = process.env.DEEPSEEK_API_KEY;
                    } else {
                        apiUrl = 'https://api.mistral.ai/v1/chat/completions';
                        apiKey = process.env.MISTRAL_API_KEY;
                    }

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: modelToUse,
                            messages: messages,
                            temperature: temperatureToUse,
                            stream: true,
                        }),
                    });

                    if (!response.ok) {
                        const errorBody = await response.text();
                        console.error('API request failed with body:', errorBody);
                        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                    }

                    const reader = response.body?.getReader();
                    if (!reader) {
                        throw new Error('Failed to get response reader');
                    }

                    const decoder = new TextDecoder();

                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            break;
                        }

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (trimmed === '' || trimmed === 'data: [DONE]') {
                                continue;
                            }

                            if (trimmed.startsWith('data: ')) {
                                try {
                                    const jsonStr = trimmed.slice(6); // Remove 'data: '
                                    const parsed = JSON.parse(jsonStr);

                                    if (parsed.choices?.[0]?.delta?.content) {
                                        const content = parsed.choices[0].delta.content;
                                        const data = `data: ${JSON.stringify({ content })}\n\n`;
                                        controller.enqueue(encoder.encode(data));
                                    }
                                } catch (parseError) {
                                    console.warn('Failed to parse chunk:', trimmed, parseError);
                                }
                            }
                        }
                    }

                    // Send completion signal
                    const doneData = `data: [DONE]\n\n`;
                    controller.enqueue(encoder.encode(doneData));
                    controller.close();

                    console.log(`Streaming completed for session ${sessionId}`);

                } catch (error) {
                    console.error('Streaming error:', error);

                    // Send error to client
                    const errorData = `data: ${JSON.stringify({
                        error: `Failed to get AI response: ${error instanceof Error ? error.message : String(error)}`
                    })}\n\n`;
                    controller.enqueue(encoder.encode(errorData));

                    const doneData = `data: [DONE]\n\n`;
                    controller.enqueue(encoder.encode(doneData));
                    controller.close();
                } finally {
                    // Clean up session after streaming
                    messageStore.delete(sessionId);
                    console.log(`Session ${sessionId} cleaned up after streaming`);
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