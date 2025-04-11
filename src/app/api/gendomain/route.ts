import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { DomainSchema } from "@/domainSchema";
import { ObjectSchema } from "@/objectSchema";
import { OntologySchema } from "@/ontologySchema";
import { ModelviewSchema } from "@/modelviewSchema";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";


// const aiModelName = "gpt-4o-2024-08-06";

const debug = false;

export async function POST(req: Request) {
  console.log('13 route POST');
  const { aiModelName, schemaName, systemPrompt, systemBehaviorGuidelines, userPrompt, userInput, contextItems, contextOntology, contextMetamodel } = await req.json();
  // if (!debug) console.log('15 route userPrompt', userPrompt);
  if (!debug) console.log('15 route \nschemaName', schemaName, '\nsystemPrompt', systemPrompt, '\nsystemBehaviorGuidelines', systemBehaviorGuidelines, '\nuserPrompt', userPrompt, '\nuserInput', userInput, '\ncontextItems', contextItems, '\ncontextOntology', contextOntology, '\ncontextMetamodel', contextMetamodel);
  const client = new OpenAI();

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
    systemPrompt ? { role: 'system', content: systemPrompt } : null,
    systemBehaviorGuidelines ? { role: 'system', content: systemBehaviorGuidelines } : null,
    userPrompt ? { role: 'user', content: userPrompt } : null,
    userInput ? { role: 'user', content: userInput } : null,
    contextItems ? { role: 'assistant', content: contextItems } : null,
    contextOntology ? { role: 'assistant', content: contextOntology } : null,
    contextMetamodel ? { role: 'assistant', content: contextMetamodel } : null,
  ].filter((message): message is NonNullable<typeof message> => message !== null) as ChatCompletionMessageParam[]; // Type assertion after filtering

  const response = await client.chat.completions.create({
    model: aiModelName,
    messages: messages,
    response_format: zodResponseFormat(schema, `${schema.constructor.name.toLowerCase()}Schema`),
    stream: true,
    temperature: 0.1, // Set the temperature here
  });

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
}

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