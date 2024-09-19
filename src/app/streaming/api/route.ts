import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  console.log("Received prompt:", prompt);

  const client = new OpenAI();

  const context = `
Context:
- The domain is related to ${prompt}.
- Detail the domain information concepts as Information objects with related Roles, Tasks, Views about the domain specified by the user.
Refer to the objecttypes and relshiptypes given below:

Objecttypes:
id: '05ea3e5c-e9a1-43f5-31a4-042acc4dbdbb', name: 'Information'
id: '0006897b-07c2-4824-683f-2c10146e1a4a', name: 'Role'
id: 'a7661dac-4deb-4668-81f3-0248d46f1c7e', name: 'Task'
id: '3808df57-878a-4738-dc95-644370cd1b08', name: 'View'
relshiptypes:
id: 'f46856b9-3041-41bd-239b-3db729390a73', name: 'performs'
id: '0f3b6357-d2ea-4ef3-927e-4f00f0f12b93', name: 'hasInput'
id: 'ef25d26e-2324-4633-2d9a-1e9f2ca82ea4', name: 'hasOutput'
id: '2fb581fc-6c9c-47d6-e479-9502ffa6c3e5', name: 'fills'
id: '820eb7dd-5b4a-4506-3ee1-6d33e04dd89f', name: 'worksOn'
id: '7b3c0877-0e98-4fc6-2715-5f31e4f30219', name: 'includes'
id: 'f3b3b3b3-3b3b-3b3b-3b3b-3b3b3b3b3b3b', name: 'has'

The object name is the descriptive name as text of the object and can be more than one word. Do not include the typeName in the name.
proposedType should be added to Information objects as  the shortversion or well known terminology of the concept in one word but it concatinated as camelcase but first char uppercase.

relationshps are between objects. Check the generated objects uuid as fromobjectRef and toobjectRef.

Don't create existing objects, but relationships can be created between existing objects and new objects.:
id: d9fc5351-02c3-41ed-bae3-c788f415bc6d, name: 'Medication'
id: a7c9df8b-4ac4-4a2e-84d8-d3752611b394, name: 'Therapy'
id: 10fd56cf-6d80-4979-9505-9343ac3c2665, name: 'Care Plan'
id: 35e57694-aed9-4e01-b5e4-be3310e4c3d4, name: 'Patient'
id: f48c8d72-4aa8-470e-a18a-23f6c0b5a7b8, name: 'Caregiver'
id: 55cb9031-ddf1-4662-9976-9c6e1539b59f, name: 'Administer Medication'
id: a3c95345-bae4-4e92-a132-8d248ac67b47, name: 'Conduct Therapy'
id: d064d832-3fb2-41b7-ac39-210f762799c2, name: 'Dementia Evaluation View'

Suggest at least 6 objects.

`;


  const systemPrompt: OpenAI.ChatCompletionMessageParam = {
    role: "system",
    content: `You are a helpful assistant and a concept modelling expert that can explore the domain concepts.
Concepts as Information objects
with related Roles, Tasks, Views about the domain specified by the user. 
Information should be a one word noun.
Task should be a verb.
Concepts should be Information objects (typeName: Information).
Roles should be process Role objects (typeName: Role).
Tasks should be Task objects (typeName: Task).
Views should be Information View objects (typeName: View).
${context}`
  };

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      systemPrompt,
      {
        role: "user",
        content: `${prompt}`,
      },
    ],
    response_format: zodResponseFormat(ObjectSchema, "objectSchema"),
    stream: true,
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