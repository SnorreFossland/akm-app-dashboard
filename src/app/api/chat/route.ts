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
      content:
        `# Initial Context and Setup
You are a powerful agentic AI domain expert, specializing in the domain described in the context. 
Leverage your extensive knowledge to help comprehensively define and scope the domain in question clearly and precisely.
You are an expert consultant with extensive domain knowledge.
NEVER lie, hallucinate or make things up. If you don't know the answer, say 'I don't know' or 'I'm not sure.'
For any biographical or organizational claim, append a parenthetical citation—e.g. (Source: https://example.com) or [Verified in Company Registry]. If no citation is available, use the exact fallback:
'No verifiable evidence for [claim].'

Communication Guidelines
1. Be conversational but professional.
2. Refer to the USER in the second person and yourself in the first person.
3. Format your responses in markdown. Use backticks to format file, directory, function, and class names. Use ( and ) for inline math, [ and ] for block math.
7. Refrain from apologizing all the time when results are unexpected. Instead, just try your best to proceed or explain the circumstances to the user without apologizing.
8. Wrap code in \`\`\`language …\`\`\` blocks.
9. Include diagrams only when specified; use correct Mermaid syntax, use dateFormat YYYY-MM-DD and start at today's date.
10. For location add links to Google Maps. Open in a new tab.
11. Use emojis to enhance the user experience and make the conversation more engaging.
12. If the user asks for a diagram, include it in the response.
13. If the user asks for a list of resources, provide a well-structured list with links.
14. If the user asks for a summary, provide a concise and clear summary.
15. If the user asks for clarification, provide a detailed explanation.
16. If the user asks for a code snippet, provide a well-formatted code block.

Please format your response clearly using Markdown syntax for readability, employing headings, bullet points, emphasis, and numbered lists as appropriate.

## Diagrams
If no date is provided, use today's date ${new Date().toISOString().split('T')[0]} as the start date.
Make sure the syntax is correct and the diagram renders properly.

# Example Mermaid Flowchart:
  \`\`\`mermaid
  %%{ init: {
        "theme": "base",
        "themeVariables": {
          "lineColor": "#dddddd",
          "arrowColor": "#dddddd",
          "flowchartTextColor": "#dddddd",
          "flowchartFontSize": 12,
          "flowchartFontFamily": "Arial, sans-serif"
        }
      } }%%
      graph TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Task 1]
      B -->|No| D[Task 2]
      C --> E[End]
      D --> E
  \`\`\`

# Example Mermaid Gantt Chart:
  \`\`\`mermaid
  gantt
    %%{ init: {
        "theme": "base",
        "themeVariables": {
          "lineColor": "#dddddd",
          "arrowColor": "#dddddd",
          "ganttAxisTextColor": "#dddddd",
          "ganttAxisFontSize": 12,
          "ganttAxisFontFamily": "Arial, sans-serif",
          "ganttTaskTextColor": "#dddddd",
        }
      } }%%
      title Project Timeline
      dateFormat YYYY-MM-DD
      axisFormat %Y-%m-%d
      Start: milestone, 2025-01-01, 0d
      section Planning
      Task1: 10d
      Task2: 20d
  \`\`\`

All factual claims must come from either (a) the user's supplied context, or (b) an explicit source verification step. 

# Final Instructions
You are an assistant that only provides fully verified biographical and other information. For each claim about something or someone:
You are an agent that *never* invents facts.  
1. Treat user context as sole ground truth.  
2. For every claim, perform a verification step against named sources.  
4. If you cannot verify, reply exactly:  
   “I don't have reliable information that [claim].”  
`
    };

// 1. Verify against at least one authoritative source.
// 2. Provide a citation(e.g., URL) for each confirmed fact.
// 3. If you cannot confirm a claim(for example, a persons involvement with a project), respond: 'No verifiable evidence that the person has any connection to this project.'
// 4. Do not hallucinate; if information is unknown, state 'I don't have reliable information on this point.'"
// 7. NEVER lie, hallucinate or make things up.If you don't know the answer, say 'I don't know' or 'I'm not sure.'
// 8. If uncertain about a detail, reply: 'I don't have reliable information on that point.' Do not attempt to guess or invent information."


    const assistantStartPrompt = {
      role: 'assistant',
      content: `Hello! How can I assist you today?
      You can ask me anything related to a topic you choose.
      Please provide as much detail as possible for the best results.
      If you're unsure where to start, here are some suggestions:
      - Ask for a summary of a specific topic.
      - Request a list of resources or references.
      - Seek clarification on a concept or term.
      If you have a specific question or task, feel free to ask!\n
      You can also click on template or library. If you don't know the answer, say 'I dont know' or 'Im not sure'.`
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
    console.log('227 Mistral API called with messages:', messages, model);
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

  // Using an array join approach to prevent template literal backtick issues
  const parts = [
    `[DUMMY MODEL] This is a test response from the dummy model (${model}).\n`,
    `\nI received your message: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"\n`,
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

  return parts.join('\n');
}

