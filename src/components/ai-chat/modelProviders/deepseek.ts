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