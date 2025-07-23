import { Message, callModelAPI } from '../modelApiHandler';

/**
 * Call Claude API with provided messages and model
 */
export async function callClaude(messages: Message[], model: string, temperature: number): Promise<string> {
  console.log('Claude API called with model:', model);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not defined in environment variables');
  }

  // Convert messages to Anthropic format
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  return callModelAPI({
    apiKey: process.env.ANTHROPIC_API_KEY,
    apiKeyName: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY as string,
      'anthropic-version': '2023-06-01'
    },
    body: {
      model: model,
      messages: formattedMessages,
      temperature: temperature || 0.5,
      // top_k: 40,
      // top_p: 0.9,
      // stop_sequences: ['\n\n'],
      // Anthropic's API has a different max_tokens parameter
      // compared to OpenAI's API. Adjust as needed.
      // max_tokens_to_sample: 2000,
    },
    responseHandler: (data) => data.content[0].text
  });
}


/**
 * Stream Claude API response with provided messages and model
 */
export async function streamClaude(
  messages: Message[],
  model: string,
  temperature: number,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  console.log('Streaming Claude API with model:', model);

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  try {
    // Convert messages array to Anthropic format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'system',
      content: msg.content
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: temperature || 0.5,
        stream: true,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${response.status} ${JSON.stringify(errorData)}`);
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
            // Claude returns content in the delta field
            if (data.type === 'content_block_delta') {
              const content = data.delta?.text || '';
              if (content) {
                await onChunk(content);
              }
            }
          } catch (e) {
            console.error('Error parsing Claude chunk:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from Claude:', error);
    throw error;
  }
}