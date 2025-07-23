import { Message, callModelAPI } from '../modelApiHandler';

/**
 * Call ALLama API with provided messages and model
 */
export async function clearALLama(messages: Message[], model: string, temperature: number): Promise<string> {
  console.log('ALLama API called with model:', model);

  return callModelAPI({
    apiKey: process.env.ALLAMA_API_KEY,
    apiKeyName: 'ALLAMA_API_KEY',
    endpoint: 'http://localhost:8000/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ALLAMA_API_KEY}`
    },
    body: {
      model: model,
      messages: messages,
      temperature: temperature || 0.5,
    },
    responseHandler: (data) => data.choices[0].message.content
  });
}

/**
 * Stream ALLama API response with provided messages and model
 */
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
    // Using native fetch instead of node-fetch
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ALLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature || 0.5,
        stream: true
      })
    });

    // Rest of your function remains the same
  } catch (error) {
    console.error('Error streaming from ALLama:', error);
    throw error;
  }
}