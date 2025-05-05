import { Message } from '../modelApiHandler';
import { callOpenAI, streamOpenAI } from './openai';
import { callMistral, streamMistral } from './mistral';
import { callClaude, streamClaude } from './anthropic';
import { callGemini, streamGemini } from './gemini';
import { callDeepseek, streamDeepseek } from './deepseek';
import { callQwen, streamQwen } from './qwen';
import { clearALLama, streamALLama } from './allama';

/**
 * Factory function that selects and calls the appropriate AI model API
 */
export async function getModelResponse(messages: Message[], model: string, temperature: number): Promise<string> {
  if (!model) {
    throw new Error('No model specified');
  }

  console.log(`Using temperature: ${temperature}`);
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
    return `This is a dummy response for model: ${model} \n` + dummy.join('');
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}

/**
 * Streaming version that calls the appropriate AI model API and streams the response
 */
export async function getModelResponseStream(
  messages: Message[],
  model: string,
  temperature: number,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  if (!model) {
    throw new Error('No model specified');
  }

  console.log(`Streaming - Model: ${model} - Temperature: ${temperature}`);

  if (model.startsWith('gpt')) {
    await streamOpenAI(messages, model, temperature, onChunk);
  } else if (model.startsWith('claude')) {
    await streamClaude(messages, model, temperature, onChunk);
  } else if (model.startsWith('mistral')) {
    await streamMistral(messages, model, temperature, onChunk);
  } else if (model.startsWith('llama')) {
    await streamALLama(messages, model, temperature, onChunk);
  } else if (model.startsWith('gemini')) {
    await streamGemini(messages, model, temperature, onChunk);
  } else if (model.startsWith('deepseek')) {
    await streamDeepseek(messages, model, temperature, onChunk);
  } else if (model.startsWith('qwen')) {
    await streamQwen(messages, model, temperature, onChunk);
  } else if (model.startsWith('dummy')) {
    // Dummy streaming model for testing
    const dummy = [
      `[DUMMY STREAMING] This is a test response from the dummy model (${model}).\n`,
      `\nI received your message and am streaming a response...\n`,
      `\nThis is a simulated streaming response for UI testing purposes.`,
      `\nThe current timestamp is: ${new Date().toISOString()}`
    ];

    // Simulate streaming with delays
    for (const chunk of dummy) {
      await onChunk(chunk);
      // Add a small delay between chunks to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}

