// no-check
"use server"
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { deepseek } from "@ai-sdk/deepseek";
import { mistral } from "@ai-sdk/mistral";
import { generateText } from "ai";

// Default model if none is specified
const defaultModel = "deepseek-chat"; // Change this to your preferred default model
// const defaultModel = "gpt-4-turbo";

export async function POST(req: Request) {
  try {
    const { prompt, aiModelName } = await req.json(); // Parse the JSON body

    if (!prompt || typeof prompt !== "string") {
      console.error("Invalid or missing prompt");
      return NextResponse.json({ error: "Invalid or missing prompt" }, { status: 400 });
    }

    console.log("Received prompt:", prompt);
    console.log("Using model:", aiModelName || defaultModel);

    // Choose the model provider based on the specified model name
    let modelProvider;

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

      return NextResponse.json({ prompt, response: dummyResponse });
    } else if (aiModelName?.includes("deepseek")) {
      // Check for Deepseek API key
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      if (!deepseekApiKey) {
        return NextResponse.json({
          error: "Deepseek API key is missing. Set the DEEPSEEK_API_KEY environment variable."
        }, { status: 500 });
      }
      modelProvider = deepseek(aiModelName, { apiKey: deepseekApiKey } as any);
    } else if (aiModelName?.includes("mistral")) {
      // Check for Mistral API key
      const mistralApiKey = process.env.MISTRAL_API_KEY;
      if (!mistralApiKey) {
        return NextResponse.json({
          error: "Mistral API key is missing. Set the MISTRAL_API_KEY environment variable."
        }, { status: 500 });
      }
      modelProvider = mistral(aiModelName, { apiKey: mistralApiKey } as any);
    } else {
      // Check for OpenAI API key
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json({
          error: "OpenAI API key is missing. Set the OPENAI_API_KEY environment variable."
        }, { status: 500 });
      }
      modelProvider = openai(aiModelName || defaultModel, { apiKey: openaiApiKey } as any);
    }

    try {
      // Generate response from the selected API
      const text = await generateText({
        model: modelProvider, // Type assertion to bypass incompatible types
        prompt,
      });

      if (!text || typeof text.text !== "string") {
        console.error("Failed to generate a response");
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
      }

      console.log("Generated response:", text.text);

      // Return a structured JSON response with the text string
      return NextResponse.json({ prompt, response: text.text });
    } catch (apiError) {
      // Handle specific API errors
      console.error("API call error:", apiError);

      // Check for insufficient balance error from Deepseek
      if (
        typeof apiError === 'object' && 
        apiError !== null && 
        'responseBody' in apiError && 
        typeof apiError.responseBody === 'string' && 
        apiError.responseBody.includes("Insufficient Balance")
      ) {
        // Handle insufficient balance error
        return NextResponse.json({
          error: "Insufficient balance in your Deepseek account"
        }, { status: 402 });
      }
      
      // Handle other API errors
      return NextResponse.json({
        error: `API error: ${apiError instanceof Error ? apiError.message : "Unknown error occurred"}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}





// import { NextResponse } from "next/server";
// import OpenAI from "openai";
// import { zodResponseFormat } from "openai/helpers/zod";
// import { DomainSchema } from "@/domainSchema";
// import { ObjectSchema } from "@/objectSchema";
// import { OntologySchema } from "@/ontologySchema";
// import { ModelviewSchema } from "@/modelviewSchema";
// import { ChatCompletionMessageParam } from "openai/resources/chat/completions";


// // const aiModelName = "gpt-4o-2024-08-06";

// const debug = false;

// export async function POST(req: Request) {
//   console.log('13 route POST');
//   const { aiModelName, schemaName, systemPrompt, systemBehaviorGuidelines, userPrompt, userInput, contextItems, contextOntology, contextMetamodel } = await req.json();
//   // if (!debug) console.log('15 route userPrompt', userPrompt);
//   if (!debug) console.log('15 route \nschemaName', schemaName, '\nsystemPrompt', systemPrompt, '\nsystemBehaviorGuidelines', systemBehaviorGuidelines, '\nuserPrompt', userPrompt, '\nuserInput', userInput, '\ncontextItems', contextItems, '\ncontextOntology', contextOntology, '\ncontextMetamodel', contextMetamodel);
//   const client = new OpenAI();

//   let schema;
//   if (schemaName === 'DomainSchema') {
//     schema = DomainSchema;
//   } else if (schemaName === 'OntologySchema') {
//     schema = OntologySchema;
//   } else if (schemaName === 'ObjectSchema') {
//     schema = ObjectSchema;
//   } else if (schemaName === 'ModelviewSchema') {
//     schema = ModelviewSchema;
//   } else {
//     return new NextResponse("Invalid schema", { status: 400 });
//   }

//   console.log('27 route schema', schemaName);
  
//   const messages = [
//     systemPrompt ? { role: 'system', content: systemPrompt } : null,
//     systemBehaviorGuidelines ? { role: 'system', content: systemBehaviorGuidelines } : null,
//     userPrompt ? { role: 'user', content: userPrompt } : null,
//     userInput ? { role: 'user', content: userInput } : null,
//     contextItems ? { role: 'assistant', content: contextItems } : null,
//     contextOntology ? { role: 'assistant', content: contextOntology } : null,
//     contextMetamodel ? { role: 'assistant', content: contextMetamodel } : null,
//   ].filter((message): message is NonNullable<typeof message> => message !== null) as ChatCompletionMessageParam[]; // Type assertion after filtering

//   const response = await client.chat.completions.create({
//     model: aiModelName,
//     messages: messages,
//     response_format: zodResponseFormat(schema, `${schema.constructor.name.toLowerCase()}Schema`),
//     stream: true,
//     temperature: 0.1, // Set the temperature here
//   });

//   const stream = new ReadableStream({
//     async start(controller) {
//       for await (const chunk of response) {
//         const content = chunk.choices[0]?.delta?.content || "";
//         controller.enqueue(new TextEncoder().encode(content));
//       }
//       controller.close();
//     },
//   });

//   return new NextResponse(stream);
// }

// "use server"
// import { NextResponse } from "next/server";
// import OpenAI from "openai";
// // import { openai } from "@ai-sdk/openai";
// // import { generateText } from "ai";

// const modelName = "gpt-4-turbo";
// const modelAi = `llama-3`;
// // Alternative models you can use:


// export async function POST(req: Request) {
//   try {
//     const { prompt } = await req.json(); // Extract domain as well

//     const client = new OpenAI();

//     if (!prompt || typeof prompt !== "string") {
//       console.error("Invalid or missing prompt");
//       return NextResponse.json({ error: "Invalid or missing prompt" }, { status: 400 });
//     }

//     console.log("16 Received prompt:", prompt);
//     // Create final prompt including instruction to return a JSON with domain with name, description, presentation
//     const finalPrompt = `${prompt}\n\nPlease respond with the domain's "name", "description" and "presentation" in md format.`;
//     console.log("23 Received prompt:", finalPrompt);

//     // Generate response from OpenAI API
//     const response = await client.chat.completions.create({
//       model: modelName,
//       messages: [{ role: "user", content: finalPrompt }],
//       stream: true,
//       temperature: 0.1,
//       // max_tokens: 150,
//     });

//     const stream = new ReadableStream({
//       async start(controller) {
//         for await (const chunk of response) {
//           const content = chunk.choices[0]?.delta?.content || "";
//           controller.enqueue(new TextEncoder().encode(content));
//         }
//         controller.close();
//       },
//     });

//     console.log("44 Generated response:", stream);
//     const reader = stream.getReader();
//     let result = "";
//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;
//       result += new TextDecoder().decode(value);
//     }
//     console.log("52 Full result stream:", result);
//     try {
//       // const jsonResponse = result;
//       // const jsonResponse = JSON.parse(result.trim());
//       // const { name, description, presentation } = jsonResponse;
//       return new Response(result);
//       // return NextResponse.json({ name, description, presentation });
//     } catch (parseError) {
//       console.error("Error parsing JSON:", parseError);
//       return NextResponse.json({ error: "Failed to parse JSON response" }, { status: 500 });
//     }
//   } catch (error) {
//     console.error("Error processing request:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }