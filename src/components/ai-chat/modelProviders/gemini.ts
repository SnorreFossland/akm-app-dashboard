import { Message, callModelAPI } from '../modelApiHandler';

/**
 * Call Google Gemini API with provided messages and model
 */
export async function callGemini(messages: Message[], model: string, temperature: number): Promise<string> {
  console.log('Gemini API called with model:', model);

  // Convert messages to Gemini format
  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  return callModelAPI({
    apiKey: process.env.GEMINI_API_KEY,
    apiKeyName: 'GEMINI_API_KEY',
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      contents: formattedMessages,
      generationConfig: {
        temperature: temperature || 0.5,
      }
    },
    responseHandler: (data) => data.candidates[0].content.parts[0].text
  });
}

export async function streamGemini(
  messages: Message[],
  model: string,
  temperature: number,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  console.log('Streaming Gemini API with model:', model);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    // Format messages for Gemini API
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, // Gemini doesn't support system role directly
      parts: [{ text: msg.content }]
    }));

    // If the first message is a system message, prepend it to the first user message
    if (messages[0]?.role === 'system' && messages.length > 1) {
      const systemContent = messages[0].content;
      const userIndex = messages.findIndex(m => m.role === 'user');

      if (userIndex > 0) {
        formattedMessages[userIndex].parts[0].text =
          `System instruction: ${systemContent}\n\nUser message: ${formattedMessages[userIndex].parts[0].text}`;
        formattedMessages.shift(); // Remove the system message
      }
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: {
          temperature: temperature || 0.5,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(errorData)}`);
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
            // Extract content from Gemini's response format
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              await onChunk(data.candidates[0].content.parts[0].text);
            }
          } catch (e) {
            console.error('Error parsing Gemini chunk:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    throw error;
  }
}