import { Message, callModelAPI } from '../modelApiHandler';

/**
 * Call Mistral API with provided messages and model
 */
export async function callMistral(messages: Message[], model: string, temperature: number): Promise<string> {
  console.log('Mistral API called with model:', model); //, 'and messages:', messages);

  return callModelAPI({
    apiKey: process.env.MISTRAL_API_KEY,
    apiKeyName: 'MISTRAL_API_KEY',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
    },
    body: {
      model: model,
      messages: messages,
      temperature: temperature || 0.3,
    },
    responseHandler: (data) => data.choices[0].message.content
  });
}

/**
 * Stream Mistral API response with provided messages and model
 */
export async function streamMistral(
  messages: Message[],
  model: string,
  temperature: number,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  console.log('Streaming Mistral API with model:', model);

  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature || 0.3,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Special handling for rate limits
      if (response.status === 429) {
        // Check if the response includes retry-after header
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) : 60;

        throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
      }

      throw new Error(`Mistral API error: ${response.status} ${JSON.stringify(errorData)}`);
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
            console.error('Error parsing Mistral chunk:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from Mistral:', error);
    throw error;
  }
}