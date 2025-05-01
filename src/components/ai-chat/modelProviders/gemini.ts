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
        temperature: temperature || 0.7,
      }
    },
    responseHandler: (data) => data.candidates[0].content.parts[0].text
  });
}