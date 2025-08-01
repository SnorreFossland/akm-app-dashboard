import { NextRequest, NextResponse } from 'next/server';
import { messageStore } from '../messageStore';

export async function POST(request: NextRequest) {
    try {
        console.log('=== CREATE-STREAM ROUTE START ===');
        console.log('MessageStore instance ID:', messageStore);
        console.log('Current store size before operation:', messageStore.size);

        const body = await request.json();
        const { sessionId, messages, model, temperature } = body;

        console.log('Create-stream request data:', {
            sessionId,
            model,
            temperature,
            messageCount: messages?.length || 0
        });

        // Validate required fields
        if (!sessionId || !messages || !Array.isArray(messages)) {
            console.error('Invalid request data:', { sessionId, messagesIsArray: Array.isArray(messages) });
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, messages' },
                { status: 400 }
            );
        }

        // Store the session data
        messageStore.set(sessionId, { messages, model, temperature });

        console.log('Session stored successfully:', {
            sessionId,
            messageCount: messages.length,
            currentStoreSize: messageStore.size,
            storedKeys: Array.from(messageStore.keys()),
        });

        // Additional verification - immediately try to retrieve what we just stored
        const verification = messageStore.get(sessionId);
        console.log('Immediate verification of stored data:', {
            found: !!verification,
            messageCount: verification?.messages?.length || 0
        });

        console.log(`Stream session ${sessionId} created for model ${model}`);

        return NextResponse.json({
            success: true,
            sessionId,
            messageCount: messages.length
        });

    } catch (error) {
        console.error('Error in create-stream route:', error);
        return NextResponse.json(
            { error: 'Failed to create stream session' },
            { status: 500 }
        );
    }
}