import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { DomainSchema } from "@/domainSchema";
import { ObjectSchema } from "@/objectSchema";
import { OntologySchema } from "@/ontologySchema";
import { ModelviewSchema } from "@/modelviewSchema";

const debug = false;

// Model provider mapping
const MODEL_PROVIDERS = {
  'gpt-4o': 'openai',
  // 'gpt-4o-mini': 'openai',
  // 'gpt-4-turbo': 'openai',
  'gpt-4': 'openai',
  // 'gpt-3.5-turbo': 'openai',
  'deepseek-chat': 'deepseek',
  'deepseek-r1': 'deepseek-r1',
  'mistral-mistral-small-24b-instruct-2501': 'mistral-24b',
  'mistral-small-latest': 'mistral',
  'dummy': 'dummy'
};

// Create clients for different providers
// Update the createClient function with better error handling
function createClient(provider: string) {
  switch (provider) {
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    case 'deepseek':
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY environment variable is not set');
      }
      return new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1', // Add /v1 to the URL
        timeout: 60000, // 60 second timeout
      });
    case 'mistral':
      if (!process.env.MISTRAL_API_KEY) {
        throw new Error('MISTRAL_API_KEY environment variable is not set');
      }
      return new OpenAI({
        apiKey: process.env.MISTRAL_API_KEY,
        baseURL: 'https://api.mistral.ai/v1',
        timeout: 60000, // 60 second timeout
      });
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function POST(req: Request) {
  console.log('13 route POST');

  try {
    // Check if the request has a body
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the request body as text first to debug
    const bodyText = await req.text();
    // console.log('72 Request body text:', bodyText);

    // Check if body is empty
    if (!bodyText || bodyText.trim() === '') {
      return new Response(JSON.stringify({ error: 'Request body is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const {
      aiModelName,
      schemaName,
      systemPrompt,
      systemBehaviorGuidelines,
      userPrompt,
      userInput,
      contextItems,
      contextOntology,
      contextMetamodel
    } = parsedBody;

    if (debug) console.log('106 Parsed request data:', {
      aiModelName,
      schemaName,
      parsedBody // For debugging, log the first 100 characters of systemPrompt and userPrompt
    });

    // Handle dummy model
    if (aiModelName === 'dummy') {
      const dummyResponse = {
        name: "Sample Model",
        description: "This is a dummy model response for testing",
        objects: [
          {
            name: "TestObject",
            description: "A test object",
            properties: ["property1", "property2"]
          }
        ],
        relships: []
      };

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(dummyResponse)));
          controller.close();
        }
      });

      return new Response(stream);
    }

    // Get provider for the model
    const provider = MODEL_PROVIDERS[aiModelName as keyof typeof MODEL_PROVIDERS];

    if (!provider) {
      return new Response(JSON.stringify({
        error: 'Unsupported model',
        details: `Model ${aiModelName} is not supported`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (debug) console.log('15 route \nschemaName', schemaName, '\nsystemPrompt', systemPrompt, '\nsystemBehaviorGuidelines', systemBehaviorGuidelines, '\nuserPrompt', userPrompt, '\nuserInput', userInput, '\ncontextItems', contextItems, '\ncontextOntology', contextOntology, '\ncontextMetamodel', contextMetamodel);

    // Create client for the specific provider
    const client = createClient(provider);

    let schema;
    if (schemaName === 'DomainSchema') {
      schema = DomainSchema;
    } else if (schemaName === 'OntologySchema') {
      schema = OntologySchema;
    } else if (schemaName === 'ObjectSchema') {
      schema = ObjectSchema;
    } else if (schemaName === 'ModelviewSchema') {
      schema = ModelviewSchema;
    } else {
      return new NextResponse("Invalid schema", { status: 400 });
    }

    console.log('27 route schema', schemaName);

    const messages = [
      systemPrompt ? { role: 'system' as const, content: systemPrompt } : null,
      systemBehaviorGuidelines ? { role: 'system' as const, content: systemBehaviorGuidelines } : null,
      userPrompt ? { role: 'user' as const, content: userPrompt } : null,
      userInput ? { role: 'user' as const, content: userInput } : null,
      contextItems ? { role: 'assistant' as const, content: contextItems } : null,
      contextOntology ? { role: 'assistant' as const, content: contextOntology } : null,
      contextMetamodel ? { role: 'assistant' as const, content: contextMetamodel } : null,
    ].filter((message): message is { role: 'system' | 'user' | 'assistant'; content: string } => message !== null);

    if (!debug) console.log('182 route messages', aiModelName, messages);

    // Handle different providers differently for structured output
    let response;

    if (provider === 'openai') {
      // OpenAI supports structured output with zodResponseFormat
      response = await client.chat.completions.create({
        model: aiModelName,
        messages: messages,
        response_format: zodResponseFormat(schema, `${schema.constructor.name.toLowerCase()}Schema`),
        stream: true,
        temperature: 0.3,
      });
    } else {
      // For Deepseek and Mistral, add detailed JSON schema instructions and collect full response

      // Create a proper schema example based on the actual schema being used
      let schemaExample;

      if (schemaName === 'ObjectSchema') {
        schemaExample = JSON.stringify({
          name: "Example Model Name",
          description: "Example description of the model",
          objects: [
            {
              id: "obj_1",
              name: "ExampleObject",
              description: "Example object description",
              typeRef: "entity",
              typeName: "ExampleObjectType",
              proposedType: "ExampleProposedType",
              properties: [
                {
                  id: "prop_1",
                  name: "property1",
                  description: "First example property",
                  type: "string"
                }
              ]
            }
          ],
          relships: [] // Ensure this is always included, even if empty
        }, null, 2);
      } else if (schemaName === 'DomainSchema') {
        schemaExample = JSON.stringify({
          name: "Example Domain",
          description: "Example domain description",
          // Add other required fields for DomainSchema
        }, null, 2);
      } else if (schemaName === 'OntologySchema') {
        schemaExample = JSON.stringify({
          name: "Example Ontology",
          description: "Example ontology description",
          concepts: [
            {
              id: "concept_1",
              name: "ExampleConcept",
              description: "Description of example concept",
              properties: []
            }
          ],
          // Add other required fields for OntologySchema
        }, null, 2);
      } else if (schemaName === 'ModelviewSchema') {
        schemaExample = JSON.stringify({
          name: "Example Modelview",
          description: "Example modelview description",
          // Add other required fields for ModelviewSchema
        }, null, 2);
      } else {
        // Simplified fallback for other schemas
        schemaExample = JSON.stringify({
          name: "Example Model Name",
          description: "Example description",
          objects: [],
          relships: []
        }, null, 2);
      }

//       const jsonInstructions = `\n\nCRITICAL: You MUST respond with ONLY valid JSON matching this EXACT structure. Every field shown is REQUIRED:

// ${schemaExample}

// MANDATORY REQUIREMENTS:
// 1. Root level MUST have: "name" (string), "description" (string), "objects" (array), "relships" (array)
// 2. Both "objects" and "relships" arrays are REQUIRED even if empty: []
// 3. Every object MUST have: "id", "name", "description", "typeRef", "typeName", "proposedType", "properties" (array)
// 4. Every property MUST have: "id", "name", "description", "type"
// 5. Every relationship MUST have: "id", "name", "description", "from", "to", "type"
// 6. NO missing fields allowed
// 7. NO explanatory text - ONLY the JSON object
// 8. NO markdown formatting or code blocks

// RESPOND WITH THE JSON OBJECT ONLY - START WITH { and END WITH }`;
      const jsonInstructions = `\n\nIMPORTANT: Respond with ONLY valid JSON matching this structure:\n\n${schemaExample}\n\nNo explanatory text, just the JSON object.`;

      // Add instructions to the last user message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        lastMessage.content += jsonInstructions;
      }

      let completionResponse;
      try {
        // For non-OpenAI providers, don't use streaming to ensure we get complete JSON
        completionResponse = await client.chat.completions.create({
          model: aiModelName,
          messages: messages,
          temperature: 0.3,
          max_tokens: 2000, // Add token limit
          stream: false,
        });
      } catch (apiError) {
        console.error('API call failed:', apiError);

        // If Deepseek fails, try to fall back to a basic OpenAI model
        if (provider === 'deepseek' || provider === 'mistral') {
          console.log('Falling back to OpenAI due to provider error');

          try {
            const fallbackClient = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY
            });

            completionResponse = await fallbackClient.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: messages,
              temperature: 0.3,
              max_tokens: 2000,
              stream: false,
            });
          } catch (fallbackError) {
            console.error('Fallback to OpenAI also failed:', fallbackError);

            // Return a basic error response
            const errorResponse = {
              name: "Error: API Unavailable",
              description: `Unable to connect to ${provider} API. Please try again later or use a different model.`,
              objects: [],
              relships: []
            };

            const stream = new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(JSON.stringify(errorResponse)));
                controller.close();
              }
            });

            return new NextResponse(stream);
          }
        } else {
          throw apiError; // Re-throw if not a provider we can fallback from
        }
      }

      const content = completionResponse.choices[0]?.message?.content || "";

      console.log('Raw response from provider:', content);

      if (!content || content.trim() === '') {
        throw new Error('Empty response from AI provider');
      }

      // Continue with the existing JSON processing logic...
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```')) {
        const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonContent = codeBlockMatch[1].trim();
        }
      }

      // If response starts with text, try to find JSON within it
      if (!jsonContent.startsWith('{')) {
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        } else {
          // Create a fallback response from the text
          const fallbackResponse = {
            name: "Generated Model",
            description: content.substring(0, 500),
            objects: [],
            relships: []
          };
          jsonContent = JSON.stringify(fallbackResponse);
        }
      }

      // Validate and attempt to fix the JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonContent);
        console.log('Successfully parsed JSON:', Object.keys(parsedJson));
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Attempted to parse:', jsonContent);

        // Last resort: create a minimal valid response
        const fallbackResponse = {
          name: "Error Recovery Model",
          description: "Model created due to JSON parsing error. Original response: " + content.substring(0, 200),
          objects: [],
          relships: []
        };

        parsedJson = fallbackResponse;
        jsonContent = JSON.stringify(fallbackResponse);
        console.log('Using fallback response due to parse error');
      }

      // Ensure all required fields are present
      if (!parsedJson.name) parsedJson.name = "Generated Model";
      if (!parsedJson.description) parsedJson.description = "AI-generated model description";
      if (!parsedJson.objects) parsedJson.objects = [];
      if (!parsedJson.relships) parsedJson.relships = [];

      // Fix missing fields in objects
      if (parsedJson.objects) {
        parsedJson.objects.forEach((obj: any, index: number) => {
          if (!obj.id) obj.id = `obj_${index + 1}`;
          if (!obj.name) obj.name = `Object${index + 1}`;
          if (!obj.description) obj.description = `Description for object ${index + 1}`;
          if (!obj.typeRef) obj.typeRef = "entity";
          if (!obj.typeName) obj.typeName = `${obj.name}Type`;
          if (!obj.proposedType) obj.proposedType = `${obj.name}ProposedType`;
          if (!obj.properties) obj.properties = [];

          // Fix properties
          obj.properties.forEach((prop: any, propIndex: number) => {
            if (!prop.id) prop.id = `prop_${index}_${propIndex + 1}`;
            if (!prop.name) prop.name = `property${propIndex + 1}`;
            if (!prop.description) prop.description = `Description for property ${propIndex + 1}`;
            if (!prop.type) prop.type = "string";
          });
        });
      }

      // Fix missing fields in relationships
      if (parsedJson.relships) {
        parsedJson.relships.forEach((rel: any, index: number) => {
          if (!rel.id) rel.id = `rel_${index + 1}`;
          if (!rel.name) rel.name = `Relationship${index + 1}`;
          if (!rel.description) rel.description = `Description for relationship ${index + 1}`;
          if (!rel.from) rel.from = parsedJson.objects[0]?.id || "obj_1";
          if (!rel.to) rel.to = parsedJson.objects[0]?.id || "obj_1";
          if (!rel.type) rel.type = "association";
        });
      }

      // Re-encode the fixed JSON
      jsonContent = JSON.stringify(parsedJson);
      console.log('Final JSON to return:', jsonContent.substring(0, 300));

      // Create a stream with the complete JSON response
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(jsonContent));
          controller.close();
        }
      });

      return new NextResponse(stream);
    }

    // Handle OpenAI streaming response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(new TextEncoder().encode(content));
        }
        controller.close();
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
