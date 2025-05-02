import { Message } from '../modelApiHandler';
import { callOpenAI } from './openai';
import { callMistral } from './mistral';
import { callClaude } from './anthropic';
import { callGemini } from './gemini';
import { callDeepseek } from './deepseek';
import { callQwen } from './qwen';
import { clearALLama } from './allama';

/**
 * Factory function that selects and calls the appropriate AI model API
 */
export async function getModelResponse(messages: Message[], model: string, temperature: number): Promise<string> {
  if (!model) {
    throw new Error('No model specified');
  }


  console.log(`Using temperature: ${temperature}`);

  const dummy = [
    `[DUMMY MODEL] This is a test response from the dummy model (${model}) with temperature ${temperature}.\n`,
    `\nI received your message: "${messages}${messages.length > 50 ? '...' : ''}"\n`,
    `\nThis is a simulated response for UI testing purposes. No actual AI model was called.`,
    `This is a very long line that goes on and on without any breaks, serving as a test string to ensure that extremely lengthy log messages or sample texts can be handled appropriately by the system when rendered in a UI, or potentially displayed in a code block in Markdown. It continues, unceasingly, narrating its verbose messages and including enough details so that every element of its exhaustive composition is displayed without any subjects omitted or truncated in the debugging interface.\n`,
    `\nSome sample formatted text:`,
    `- Point 1: Test data`,
    `- Point 2: More test data\n`,
    `\nSample code block\n`,
    "```javascript",
    "function test() {",
    "  return \"Hello world\";",
    "}",
    "```\n",
    `\nThe current timestamp is: ${new Date().toISOString()}`
  ];
  console.log(`Model: ${model} - Temperature: ${temperature} - Messages: ${JSON.stringify(messages)}`);
  if (model.startsWith('gpt')) {
    return callOpenAI(messages, model, temperature);
  } else if (model.startsWith('llama')) {
    return clearALLama(messages, model, temperature);
  } else if (model.startsWith('claude')) {
    return callClaude(messages, model, temperature);
  } else if (model.startsWith('mistral')) {
    return callMistral(messages, model, temperature);
  } else if (model.startsWith('gemini')) {
    return callGemini(messages, model, temperature);
  } else if (model.startsWith('deepseek')) {
    return callDeepseek(messages, model, temperature);
  } else if (model.startsWith('qwen')) {
    return callQwen(messages, model, temperature);
  } else if (model.startsWith('dummy')) {
    // Dummy model for testing
    return `This is a dummy response for model: ${model} \n` + dummy.join('');
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}

