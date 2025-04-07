import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    // Define system and assistant prompts
    const systemPrompt = {
      role: 'system',
      content: 'You are a helpful assistant and expert on the topic given by the **user**.'
    };

    const assistantStartPrompt = {
      role: 'assistant',
      content: `Hello! How can I assist you today?
      You can ask me anything related to the topic at hand.\n\n
      Please provide as much detail as possible for the best results.\n\n
      If you're unsure where to start, here are some suggestions:\n\n
      - Ask for a summary of a specific topic.\n\n
      - Request a list of resources or references.\n\n
      - Inquire about best practices or tips.\n\n
      - Seek clarification on a concept or term.\n\n
      - Ask for examples or case studies.\n\n
      If you have a specific question or task, feel free to ask!\n\n
      .\n
      You can also select a template from the list in the right panel to get started.`
    };

    const assistantPrompt = {
      role: 'assistant',
      content: 'Please provide a detailed response to the user\'s query.'
    };
    // Extract the latest user message
    const userMessage = messages[messages.length - 1]?.content || '';

    // Check if the input is vague or empty
    if (!userMessage.trim() || isInputVague(userMessage)) {
      return NextResponse.json({ message: assistantStartPrompt.content }, { status: 200 });
    }

    // Prepend the prompts to the messages array
    const updatedMessages = [systemPrompt, assistantPrompt, ...messages];
    // Helper function to check if input is vague
    function isInputVague(input) {

      // Check if input is only one word
      const words = input.trim().split(/\s+/);
      const isSingleWord = words.length === 1;
      
      return  isSingleWord;
    }

    console.log('34 Updated messages:', updatedMessages);
    // Choose the appropriate API based on the model
    let response;

    if (model.startsWith('gpt')) {
      response = await callOpenAI(updatedMessages, model);
    } else if (model.startsWith('claude')) {
      response = await callClaude(updatedMessages, model);
    } else if (model.startsWith('mistral')) {
      response = await callMistral(updatedMessages, model);
    } else if (model.startsWith('gemini')) {
      response = await callGemini(updatedMessages, model);
    } else if (model.startsWith('deepseek')) {
      response = await callDeepseek(updatedMessages, model);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }

    return NextResponse.json({ message: response }, { status: 200 });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process your request: ' + error.message },
      { status: 500 }
    );
  }
}

// OpenAI API implementation
async function callOpenAI(messages, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

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
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Claude API implementation
async function callClaude(messages, model) {
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

// Mistral API implementation
async function callMistral(messages, model) {
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

// Google Gemini API implementation
async function callGemini(messages, model) {
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

// Deepseek API implementation - fixed the duplicate return statement
async function callDeepseek(messages, model) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
  }

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
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Deepseek API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}