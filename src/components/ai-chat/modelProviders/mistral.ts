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
      temperature: temperature || 0.7,
    },
    responseHandler: (data) => data.choices[0].message.content
  });
}