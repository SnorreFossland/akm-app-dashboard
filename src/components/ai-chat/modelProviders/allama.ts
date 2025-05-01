import { Message } from '../modelApiHandler';
import fetch from 'node-fetch';

/**
 * Calls the ALLama API with the provided messages
 * 
 * @param messages - The conversation history
 * @param model - The specific LLama model to use
 * @param temperature - Controls randomness in outputs (0.0-1.0)
 * @returns A promise that resolves to the model's response text
 */
export async function clearALLama(messages: Message[], model: string, temperature: number): Promise<string> {
  try {
    const API_URL = process.env.ALLAMA_API_URL || 'https://api.allama.ai/v1/chat/completions';
    const API_KEY = process.env.ALLAMA_API_KEY;
    
    if (!API_KEY) {
      throw new Error('Missing ALLAMA_API_KEY environment variable');
    }
    
    // Format messages in the expected format for the ALLama API
    const formattedMessages = messages.map(message => ({
      role: message.role,
      content: message.content
    }));
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: temperature,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ALLama API error: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling ALLama API:', error);
    throw error;
  }
}