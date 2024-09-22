import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
  const { prompt, existingContext } = await req.json();
  console.log("Received prompt:", prompt);
  console.log("Received existingContext:", existingContext);

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
id: '7e9386c9-75bc-4239-c040-d328f1c91e1b', name: 'Property',

Relshiptypes:
id: 'f46856b9-3041-41bd-239b-3db729390a73', name: 'performs' from Role to Task
id: '0f3b6357-d2ea-4ef3-927e-4f00f0f12b93', name: 'hasInput' from View to Information
id: 'ef25d26e-2324-4633-2d9a-1e9f2ca82ea4', name: 'hasOutput' from View to Information
id: '2fb581fc-6c9c-47d6-e479-9502ffa6c3e5', name: 'fills' Person to Role
id: '820eb7dd-5b4a-4506-3ee1-6d33e04dd89f', name: 'worksOn' Task to Information
id: '7b3c0877-0e98-4fc6-2715-5f31e4f30219', name: 'includes' Container to Information
id: 'f3b3b3b3-3b3b-3b3b-3b3b-3b3b3b3b3b3b', name: 'has' from Information to Information

The object name is the descriptive name as text of the object and can be more than one word. Do not include the typeName in the name.
proposedType should be added to Information objects as the short version or well-known terminology of the concept in one word but concatenated as camelcase but first char uppercase.

relationships are between objects. Check the generated objects uuid as fromobjectRef and toobjectRef.
Roles perform Tasks.
Views have Inputs and Outputs.
Persons fill Roles.
Tasks work on Information.
Containers include Information.
Information has Properties.
`;

  const newPrompt = `
Existing objects:

${existingContext}

Don't create existing objects, but relationships can be created to or from existing objects and new objects.:

New objects:
Suggest at least 6 new objects and their relationships.
New objects may have relationship to or from existing objects.
If existing objects description field is empty, add your best suggestion of a description.
Use existing id for existing objects and generate new id for new objects.
Concepts should be created as Information objects with related Roles, Tasks, Views.
Information should be a one word noun.
Task is named as verb.
Concepts should be Information objects (typeName: Information).
Roles should be process Role objects (typeName: Role).
Tasks should be Task objects (typeName: Task).
Views should be Information View objects (typeName: View).
`;

  const systemPrompt: OpenAI.ChatCompletionMessageParam = {
    role: "system",
    content: `You are a helpful assistant and a concept modelling expert that can explore the domain concepts
    You are answer as an topic expert at the domain given by the user.
${context}`
  };

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      systemPrompt,
      {
        role: "user",
        content: `${newPrompt}`,
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