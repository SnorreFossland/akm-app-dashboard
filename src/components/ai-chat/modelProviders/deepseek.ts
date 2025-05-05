import { Message, callModelAPI } from '../modelApiHandler';

/**
 * Call Deepseek API with provided messages and model
 */
export async function callDeepseek(messages: Message[], model: string, temperature: number): Promise<string> {
  console.log('Deepseek API called with model:', model);

  return callModelAPI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    apiKeyName: 'DEEPSEEK_API_KEY',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: {
      model: model,
      messages: messages,
      temperature: temperature || 0.7,
    },
    responseHandler: (data) => data.choices[0].message.content
  });
}

export async function streamDeepseek(
  messages: Message[],
  model: string,
  temperature: number,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  console.log('Streaming Deepseek API with model:', model);

  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
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
      throw new Error(`Deepseek API error: ${response.status} ${JSON.stringify(errorData)}`);
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
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.substring(6));
            const content = data.choices[0]?.delta?.content || '';
            if (content) {
              await onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing Deepseek chunk:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from Deepseek:', error);
    throw error;
  }
}