import { Message } from '../modelApiHandler';

/**
 * Call the Qwen3 API with the provided messages
 * @param messages Array of message objects to send to Qwen API
 * @param model Specific Qwen model to use (e.g., 'qwen3-max', 'qwen3-plus', etc.)
 * @returns Promise with the AI's response text
 */
export async function callQwen(messages: Message[], model: string, temperature: number): Promise<string> {
    try {
        const apiKey = process.env.QWEN_API_KEY;

        if (!apiKey) {
            throw new Error('QWEN_API_KEY is not configured in environment variables');
        }

        // Map our internal message format to Qwen's expected format if needed
        const qwenMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // URL depends on whether you're using Qwen directly or through another service
        const url = 'https://api.qwen.ai/v1/chat/completions'; // Adjust as needed

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: qwenMessages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Qwen API error: ${response.status} ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error: any) {
        console.error('Error calling Qwen API:', error);
        return `Error calling Qwen API: ${error.message}`;
    }
}