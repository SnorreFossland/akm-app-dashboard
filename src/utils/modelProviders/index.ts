import { Message } from '../modelApiHandler';
import { callOpenAI } from './openai';
import { callMistral } from './mistral';
import { callClaude } from './anthropic';
import { callGemini } from './gemini';
import { callDeepseek } from './deepseek';

/**
 * Factory function that selects and calls the appropriate AI model API
 */
export async function getModelResponse(messages: Message[], model: string): Promise<string> {
  if (!model) {
    throw new Error('No model specified');
  }
  
  if (model.startsWith('gpt')) {
    return callOpenAI(messages, model);
  } else if (model.startsWith('claude')) {
    return callClaude(messages, model);
  } else if (model.startsWith('mistral')) {
    return callMistral(messages, model);
  } else if (model.startsWith('gemini')) {
    return callGemini(messages, model);
  } else if (model.startsWith('deepseek')) {
    return callDeepseek(messages, model);
  } else if (model.startsWith('dummy')) {
    // Dummy model for testing
    return `This is a dummy response for model: ${model}`;
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}