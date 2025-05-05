import { Message, callModelAPI } from '../modelApiHandler';
import fetch from 'node-fetch';

/**
 * Calls the ALLama API with the provided messages
 * 
 * @param messages - The conversation history
 * @param model - The specific LLama model to use
 * @param temperature - Controls randomness in outputs (0.0-1.0)
 * @returns A promise that resolves to the model's response text
 */
export async function clearALLama(messages: Message[], model: string, temperature: number): Promise<string> {
  try {
    const API_URL = process.env.ALLAMA_API_URL || 'https://api.allama.ai/v1/chat/completions';
    const API_KEY = process.env.ALLAMA_API_KEY;

    if (!API_KEY) {
      throw new Error('Missing ALLAMA_API_KEY environment variable');
    }

    // Format messages in the expected format for the ALLama API
    const formattedMessages = messages.map(message => ({
      role: message.role,
      content: message.content
    }));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: temperature,
        stream: false
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ALLama API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    // Add interface for the response structure
    interface ALLamaResponse {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    }

    const data = await response.json() as ALLamaResponse;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling ALLama API:', error);
    throw error;
  }
}

export async function streamALLama(
  messages: Message[],
  model: string,
  temperature: number,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  console.log('Streaming ALLama API with model:', model);

  if (!process.env.ALLAMA_API_KEY) {
    throw new Error('ALLAMA_API_KEY not configured');
  }

  try {
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ALLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature || 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ALLama API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Fix: Adding type assertion for ReadableStream
    const reader = (response.body as unknown as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.substring(6));
            const content = data.choices[0]?.delta?.content || '';
            if (content) {
              await onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing ALLama chunk:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from ALLama:', error);
    throw error;
  }
}