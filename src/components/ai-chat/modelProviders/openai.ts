import { Message, callModelAPI } from '../modelApiHandler';

/**
 * Call OpenAI API with provided messages and model
 */
export async function callOpenAI(messages: Message[], model: string, temperature: number): Promise<string> {
  console.log('OpenAI API called with model:', model);

  return callModelAPI({
    apiKey: process.env.OPENAI_API_KEY,
    apiKeyName: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: {
      model: model,
      messages: messages,
      temperature: temperature || 0.7,
    },
    timeout: 10000, // OpenAI uses a shorter timeout
    responseHandler: (data) => data.choices[0].message.content
  });
}

/**
 * Stream OpenAI API response with provided messages and model
 */
export async function streamOpenAI(
  messages: Message[],
  model: string,
  temperature: number,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  console.log('Streaming OpenAI API with model:', model);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
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
      throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Process all complete lines
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
            console.error('Error parsing OpenAI chunk:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from OpenAI:', error);
    throw error;
  }
}