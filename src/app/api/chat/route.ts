import { NextResponse } from 'next/server';
import { getModelResponseStream } from '@/components/ai-chat/modelProviders';

// export const runtime = 'edge'; // This enables Edge runtime

export async function POST(request: Request) {
  try {
    // Extract request data
    const { messages = [], model, temperature } = await request.json();

    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages must be an array' }, { status: 400 });
    }

    if (!model || typeof model !== 'string') {
      return NextResponse.json({ error: 'Model must be specified' }, { status: 400 });
    }

    // Define prompt this is used as system common prompt for all prompts. 
    const systemPrompt2 = {
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
      `}

    // Define system prompt
    const systemPrompt = {
      role: 'system',
      content: `You are a helpful AI assistant. You have a friendly and conversational tone, but you're precise and direct in your responses. 
You can assist with general knowledge questions, programming, creative writing, and many other tasks.
You will receive:
1. A “system” message defining your global behavior.
2. A “user” message containing a multi-page domain context or content and a detailed task request.

When processing long contexts (several pages):
- Keep all context in active memory.
- If the conversation approaches token limits, automatically archive the earliest messages (label them “Archived Context”) but retain the ability to recall or expand upon them on demand.

Tone & Style:
- Friendly and conversational, yet precise and direct.
- Formal, unambiguous language.
- Segment every multi-part answer clearly into the requested sections.

Structure Enforcement:
For any multi-section deliverable, explicitly output each of the numbered sections in order. If data for a section is unavailable, make a best-guess assumption, clearly noting it as an assumption.

Mermaid Diagrams:
- For “Timeline,” use Gantt chart syntax.
- For “Communication Plan,” use flowchart syntax.

Error & Uncertainty Handling:
- Never fabricate information.
- If unsure, acknowledge uncertainty and provide your best-guess rationale.

When providing information, aim to be accurate. If you're unsure about something, acknowledge it rather than making up facts.
`
    };

    // Extract the latest user message
    const userMessage = messages[messages.length - 1]?.content || '';
    console.log('109 User message:', userMessage);
    // Check if the input is vague or empty
    if (userMessage === 'Continue') {
      return NextResponse.json({
        message: `Continue`
      }, { status: 200 });
    } else if (!userMessage.trim() || isInputVague(userMessage)) {
        // Provide a more helpful prompt for vague inputs
        return NextResponse.json({
          message: `I'd be happy to help! Your question seems quite broad. To provide a more helpful response, could you:   
- Be more specific about what you're looking for
- Provide some context or background information
- Ask a more focused question
This will help me give you a more relevant and useful answer.`
      }, { status: 200 });
    }

    // Prepend the system prompt to the messages array
    const updatedMessages = [systemPrompt, ...messages];

    // Get response from the appropriate model
    // const response = await getModelResponse(updatedMessages, model, temperature);

    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process stream
    getModelResponseStream(
      [systemPrompt, ...messages],
      model,
      temperature || 0.7,
      async (chunk) => {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
      }
    ).then(() => {
      writer.write(encoder.encode('data: [DONE]\n\n'));
      writer.close();
    }).catch((error) => {
      console.error('Error streaming response:', error);
      writer.abort(error);
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
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
}

// Helper function to check if input is vague
function isInputVague(input: string): boolean {
  const vaguePhrases = [
    'hi', 'hello', 'hey', 'test', 'help', 'who are you',
    'what can you do', 'what do you do', '?'
  ];

  const normalizedInput = input.toLowerCase().trim();

  return normalizedInput.length < 5 ||
    vaguePhrases.includes(normalizedInput) ||
    normalizedInput.split(' ').length < 2;
}

