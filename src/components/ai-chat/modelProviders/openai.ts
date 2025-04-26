import { Message, callModelAPI } from '../modelApiHandler';

/**
 * Call OpenAI API with provided messages and model
 */
export async function callOpenAI(messages: Message[], model: string): Promise<string> {
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
      temperature: 0.7,
    },
    timeout: 10000, // OpenAI uses a shorter timeout
    responseHandler: (data) => data.choices[0].message.content
  });
}