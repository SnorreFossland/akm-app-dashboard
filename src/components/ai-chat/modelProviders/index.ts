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

  // Validate messages input
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    await onChunk("Error: No valid messages provided. Please try again with a proper prompt.");
    return;
  }

  console.log(`Streaming - Model: ${model} - Temperature: ${temperature}`);

  try {
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
      // Add try-catch specifically for Deepseek
      try {
        await streamDeepseek(messages, model, temperature, onChunk);
      } catch (error) {
        console.error(`Error with Deepseek model, falling back to dummy:`, error);
        await onChunk("\n\n⚠️ Deepseek API error: " + error.message + "\n\nFalling back to dummy model...\n\n");
        // Fall back to dummy model
        await streamDummy(messages, "dummy-fallback", temperature, onChunk);
      }
    } else if (model.startsWith('qwen')) {
      await streamQwen(messages, model, temperature, onChunk);
    } else if (model.startsWith('dummy')) {
      // Implement a simple dummy streaming model for testing
      await streamDummy(messages, model, temperature, onChunk);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    console.error(`Error streaming with model ${model}:`, error);
    // Send error message as a chunk so user sees it
    await onChunk(`\n\n⚠️ Error: ${error.message}\n\nPlease try again or choose a different model.`);
  }
}

// Add a dummy streaming function for fallbacks
async function streamDummy(
  messages: Message[],
  model: string,
  temperature: number,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  await onChunk(`[DUMMY FALLBACK MODEL]\n\nYour request to ${model} couldn't be processed.\n\n`);

  // Get the user's last message
  const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
  if (lastUserMessage) {
    await onChunk(`You asked: "${lastUserMessage.content}"\n\n`);
  }

  await onChunk(`This is a simulated response as the original model encountered an error. Please try again or select a different model.`);
}

