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
                temperature: 0.3,
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


export async function streamQwen(
    messages: Message[],
    model: string,
    temperature: number,
    onChunk: (chunk: string) => Promise<void>
): Promise<void> {
    console.log('Streaming Qwen API with model:', model);

    if (!process.env.QWEN_API_KEY) {
        throw new Error('QWEN_API_KEY not configured');
    }

    try {
        const response = await fetch('https://dashscope.aliyuncs.com/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.QWEN_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                input: {
                    messages: messages
                },
                parameters: {
                    temperature: temperature || 0.3
                },
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Qwen API error: ${response.status} ${JSON.stringify(errorData)}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }
        const reader = (response.body as ReadableStream<Uint8Array>).getReader();

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line && line !== '[DONE]') {
                    try {
                        const data = JSON.parse(line);
                        // Extract content based on Qwen's API response format
                        const content = data.output?.text || '';
                        if (content) {
                            await onChunk(content);
                        }
                    } catch (e) {
                        console.error('Error parsing Qwen chunk:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error streaming from Qwen:', error);
        throw error;
    }
  }