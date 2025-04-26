import { Message, callModelAPI } from '../modelApiHandler';

/**
 * Call Claude API with provided messages and model
 */
export async function callClaude(messages: Message[], model: string): Promise<string> {
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
      max_tokens: 1000
    },
    responseHandler: (data) => data.content[0].text
  });
}