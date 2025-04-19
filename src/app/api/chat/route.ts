import { NextResponse } from 'next/server';


interface Message {
  role: 'system' | 'assistant' | 'user';
  content: string;
}
interface RequestBody {
  messages: Message[];
  model: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;
    // Provide a default (e.g. 'gpt-4') if body.model is undefined or empty
    const effectiveModel = (body.model && body.model.trim()) ? body.model.trim() : 'gpt-4';


    // Define prompt this is used as system common prompt for all prompts. 
    const systemPrompt = {
      role: 'system',
      content: `You are an expert consultant specializing in the domain described in the context. 
Leverage your extensive knowledge to help comprehensively define and scope the domain in question clearly and precisely.
You are an expert consultant with extensive domain knowledge.
  • Provide responses that are clear, precise, and actionable.
  • Use Markdown: headings, bullet points, numbered lists.
  • Wrap code in \`\`\`language …\`\`\` blocks.
  • Include diagrams only when specified; use correct Mermaid syntax.
  • For Gantt charts, use dateFormat YYYY-MM-DD and start at today's date.
  • Use the latest version of Mermaid syntax.
  • Use the latest version of Markdown.
Please format your response clearly using Markdown syntax for readability, employing headings, bullet points, emphasis, and numbered lists as appropriate.
For Mermaid diagrams, use today's date as the start date and follow this exact format:

# Example Gantt Chart:
\`\`\`mermaid
gantt
  %%{ init: {
      "theme": "base",
      "themeVariables": {
        "lineColor": "#dddddd",
        "arrowColor": "#dddddd",
        "ganttAxisTextColor": "#dddddd",
        "ganttAxisFontSize": 12,
        "ganttAxisFontFamily": "Arial, sans-serif"
        "ganttTaskTextColor": "#dddddd",
      }
    } }%%
    title Project Timeline
    dateFormat YYYY-MM-DD
    axisFormat %Y-%m-%d
    Start: milestone, ${new Date().toISOString().split('T')[0]}, 5d
    section Planning
    Task1: 10d
    Task2: 20d
\`\`\`
    `
    };

    const assistantStartPrompt = {
      role: 'assistant',
      content: `Hello! How can I assist you today?
      You can ask me anything related to a topic you choose.\n\n
      Please provide as much detail as possible for the best results.\n\n
      If you're unsure where to start, here are some suggestions:\n\n
      - Ask for a summary of a specific topic.\n\n
      - Request a list of resources or references.\n\n
      - Inquire about best practices or tips.\n\n
      - Seek clarification on a concept or term.\n\n
      - Ask for examples or case studies.\n\n
      If you have a specific question or task, feel free to ask!\n\n
      .\n
      You can also select a template from the list in the left panel to get started.`
    };

    const assistantPrompt = {
      role: 'assistant',
      content: 'Please provide as detailed response as possible to the user\'s query.'
    };
    // Extract the latest user message
    const userMessage = messages[messages.length - 1]?.content || '';

    // Check if the input is vague or empty
    if (!userMessage.trim() || isInputVague(userMessage)) {
      return NextResponse.json({ message: assistantStartPrompt.content }, { status: 200 });
    }

    // Prepend the prompts to the messages array
    const updatedMessages = [systemPrompt, ...messages];
    // const updatedMessages = [systemPrompt, assistantPrompt, ...messages];
    // Helper function to check if input is vague
    function isInputVague(input: string): boolean {
      // Check if input is only one word
      const words = input.trim().split(/\s+/);
      const isSingleWord = words.length === 1;

      return isSingleWord;
    }

    // console.log('34 Updated messages:', updatedMessages);
    // Choose the appropriate API based on the model
    let response;

    if (effectiveModel.startsWith('gpt')) {
      response = await callOpenAI(updatedMessages, effectiveModel);
    } else if (effectiveModel.startsWith('claude')) {
      response = await callClaude(updatedMessages, effectiveModel);
    } else if (effectiveModel.startsWith('mistral')) {
      response = await callMistral(updatedMessages, effectiveModel);
    } else if (effectiveModel.startsWith('gemini')) {
      response = await callGemini(updatedMessages, effectiveModel);
    } else if (effectiveModel.startsWith('deepseek')) {
      response = await callDeepseek(updatedMessages, effectiveModel);
    } else if (effectiveModel.startsWith('dummy')) {
      response = await callDummyModel(updatedMessages, effectiveModel);
    } else {
      throw new Error(`Unsupported model: ${effectiveModel}`);
    }

    return NextResponse.json({ message: response }, { status: 200 });
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    let userErrorMsg = 'Failed to process your request: ' + errorMessage;
    if (errorMessage.toLowerCase().includes('timed out')) {
      userErrorMsg = 'The request timed out. Please try again.';
    }

    return NextResponse.json(
      { error: userErrorMsg },
      { status: 500 }
    );
  }

  // OpenAI API implementation
  async function callOpenAI(messages: Message[], model: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    // Create an AbortController to timeout the fetch request
    const controller = new AbortController();
    const timeout = 10000; // timeout in milliseconds (e.g. 10 seconds)
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 100
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  // Deepseek API implementation - fixed the duplicate return statement
  async function callDeepseek(messages: Message[], model: string): Promise<string> {
    console.log('147 Deepseek API called with messages:', messages, model);
    const apiKey = process.env.DEEPSEEK_API_KEY;
    console.log('api key', process.env.DEEPSEEK_API_KEY)
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
    }
    // Use an AbortController to set a timeout
    const controller = new AbortController();
    const timeout = 20000; // 120 seconds timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7
        }),
        signal: controller.signal   // Use the same controller
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Deepseek API error: ${JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  // Mistral API implementation
  async function callMistral(messages: Message[], model: string): Promise<string> {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is not set in environment variables');
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mistral API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Claude API implementation
  async function callClaude(messages: Message[], model: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    // Convert messages to Anthropic format
    // Anthropic expects a specific format with human/assistant messages
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // Google Gemini API implementation
  async function callGemini(messages: Message[], model: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Convert messages to Gemini format
    // For Gemini API, we might need to format differently depending on their API requirements
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}

// Dummy model implementation for UI testing
async function callDummyModel(messages: Message[], model: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get the last user message to customize the response
  const userMessage = messages.find(msg => msg.role === 'user')?.content || '';

  // Generate a sample response based on the user's message
  return `[DUMMY MODEL] This is a test response from the dummy model (${model}).
    
I received your message: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"

This is a simulated response for UI testing purposes. No actual AI model was called.

Some sample formatted text:
- Point 1: Test data
- Point 2: More test data

\`\`\`
Sample code block
function test() {
  return "Hello world";
}
\`\`\`

The current timestamp is: ${new Date().toISOString()}`;
}

