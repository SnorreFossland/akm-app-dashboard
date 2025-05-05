import { NextRequest } from 'next/server';
import { getModelResponseStream } from '@/components/ai-chat/modelProviders';

export const runtime = 'edge'; // Use edge runtime for better streaming support

export async function GET(request: NextRequest) {
    try {
        // Get parameters from URL
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const messagesParam = searchParams.get('messages');
        const model = searchParams.get('model');
        const temperature = searchParams.get('temperature');

        console.log(`Stream request received for session ${sessionId}`);

        // Validate required parameters
        if (!messagesParam || !model) {
            return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Parse messages from URL parameter
        let messages;
        try {
            // First check if we even have a messages parameter
            if (!messagesParam) {
                console.error('No messages parameter provided in request');
                return new Response(
                    JSON.stringify({ error: 'Missing messages parameter' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            try {
                messages = JSON.parse(decodeURIComponent(messagesParam));
            } catch (parseError) {
                console.error('Failed to parse messages JSON:', parseError);
                return new Response(
                    JSON.stringify({
                        error: 'Invalid JSON format in messages parameter',
                        details: parseError.message
                    }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Check that messages is an array
            if (!Array.isArray(messages)) {
                console.error('Messages is not an array:', typeof messages);
                return new Response(
                    JSON.stringify({
                        error: 'Messages must be an array',
                        received: typeof messages
                    }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Handle empty array case with a fallback
            if (messages.length === 0) {
                console.warn('Empty messages array received, using fallback message');

                // Create a streaming response with an error message
                const encoder = new TextEncoder();
                const stream = new TransformStream();
                const writer = stream.writable.getWriter();

                // Send an error message explaining the issue
                writer.write(encoder.encode(`data: ${JSON.stringify({
                    content: "⚠️ Error: No messages were provided in your request. Please try again with a proper prompt."
                })}\n\n`));
                writer.write(encoder.encode('data: [DONE]\n\n'));
                writer.close();

                return new Response(stream.readable, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    }
                });
            }

            // Log the messages for debugging
            console.log(`Processing ${messages.length} messages`);
            if (messages.length > 0) {
                console.log(`First message: ${messages[0].role} - ${messages[0].content?.substring(0, 50)}...`);
                console.log(`Last message: ${messages[messages.length - 1].role} - ${messages[messages.length - 1].content?.substring(0, 50)}...`);
            }

        } catch (error) {
            console.error('Error processing messages:', error);
            return new Response(
                JSON.stringify({
                    error: 'Failed to process messages',
                    details: error.message
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        // Set up streaming response
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Stream response using model provider
        getModelResponseStream(
            messages,
            model,
            parseFloat(temperature || '0.7'),
            async (chunk) => {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            }
        ).then(() => {
            writer.write(encoder.encode('data: [DONE]\n\n'));
            writer.close();
        }).catch((error) => {
            console.error('Error in stream processing:', error);
            writer.abort(error);
        });

        // Return the stream with proper SSE headers
        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no' // Prevents Nginx from buffering the response
            }
        });
    } catch (error) {
        console.error('Unhandled error in stream API:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}