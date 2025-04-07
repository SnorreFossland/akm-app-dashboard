import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { messages, model } = await request.json();

        // Validate input
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error('Invalid messages array');
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4', // Default to GPT-4 if no model is provided
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
        const aiMessage = data.choices[0]?.message?.content || 'No response from AI';

        return NextResponse.json({ message: aiMessage });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: 'Failed to process your request' }, { status: 500 });
    }
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