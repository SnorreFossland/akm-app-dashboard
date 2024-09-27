import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ObjectSchema } from "@/objectSchema";

import { metamodel } from '@/metamodel/metamodel';

const modelName = "gpt-4o-2024-08-06";

export async function POST(req: Request) {
    const { prompt, existingContext } = await req.json();
    console.log("Received prompt:", prompt);
    console.log("Received existingContext:", existingContext);

    const client = new OpenAI();

    const metamodel = `
    Metamodel:

    The metamodel consists objecttypes and relationshiptypes and
    refer to the objecttypes and relshiptypes given below:

    Objecttypes:
    - id: '058cbb1b-018e-4959-2a33-a27889543209', name: 'Information'
    - id: 'bbb60f1c-b5a3-41dc-dff6-2b594f54a2dd', name: 'Role'
    - id: '29d76eb4-29b7-4cf7-ed16-a1d172738bad', name: 'Task'
    - id: '6e465c81-59f2-46f8-4c1d-ec5c2e30b358', name: 'View'
    - id: '7e9386c9-75bc-4239-c040-d328f1c91e1b', name: 'Property',

    Relshiptypes:
    - id: '5607bf3b-23d3-4141-f95b-06ff806f86f2', name: 'performs' direction from Role to Task
    - id: 'a56028f6-b0c2-43fb-8af4-02f3f80b2de0', name: 'hasInput' direction from View to Information
    - id: '1e0f61b2-e636-458c-3306-d281d66f7826', name: 'hasOutput' direction from View to Information
    - id: '2fb581fc-6c9c-47d6-e479-9502ffa6c3e5', name: 'fills' direction from Person to Role
    - id: '4f673acd-ca6c-4309-0235-d1d7767c826d', name: 'worksOn' direction from Task to Information
    - id: '7b3c0877-0e98-4fc6-2715-5f31e4f30219', name: 'includes' direction from Container to any object
    - id: '9bc101cd-4bdf-4965-a063-02112a2e8b2a', name: 'includes' direction from Information to Information or Property
    - id: '668978e6-d9ba-4596-1329-6a63d24686e5', name: 'applies' direction from Task to View

    Relationships are between objects using the of the objects id as fromobjtypeRef and toobjtypeRef.

    Examples of created objects and relationships:
    - Example of an Information object: { id: '123', name: 'Customer', proposedType: 'Customer', typeName: 'Information' }
    - Example of a Task object: { id: '456', name: 'ProcessOrder', typeName: 'Task' }
    - Example of a Role object: { id: '789', name: 'OrderProcessor', typeName: 'Role' }
    - Example of a View object: { id: 'abc', name: 'OrderView', typeName: 'View' }
    - Example of a Property object: { id: 'def', name: 'OrderNumber', typeName: 'Property' }
    - Example of a Relationship: { fromobjtypeRef: '123', name: 'hasOutput', fromobjtypeRef: '456' } where 'hasOutput' is a relationship from an View object to a Property object.
    - Example of a Relationship: { fromobjtypeRef: 'abc', name: 'hasInput', fromobjtypeRef: '123' } where 'hasInput' is a relationship from a View object to an Information object.
    - Example of a Relationship: { fromobjtypeRef: '789', name: 'performs', fromobjtypeRef: '456' } where 'performs' is a relationship from a Role object to a Task object.
    - Example of a Relationship: { fromobjtypeRef: '456', name: 'worksOn', fromobjtypeRef: '123' } where 'worksOn' is a relationship from a Task object to an Information object.
    - Example of a Relationship: { fromobjtypeRef: 'abc', name: 'includes', fromobjtypeRef: 'def' } where 'include' is a relationship from a Information object to a Property object.
    - Example of a Relationship: { fromobjtypeRef: 'abc', name: 'applies', fromobjtypeRef: 'def' } where 'applies' is a relationship from a Task object to a View object.
`;

    const context = `
    Context:
 
    - Detail the domain information concepts as Information objects with related Roles, Tasks, Views about the domain specified by the user.

    New objects:
    Suggest at least 10 new objects and their relationships.
    New objects may have relationship to or from existing objects.
    Make sure all objects have at least one relationship.
    - First evaluate the domain and create the information concepts and terms used within the domain.
    - Then create Information objects that represent the concepts/terms.
    - Then create Tasks that works on the Information objects is named as verb..
    - Then create Roles that performs the Tasks.
    - Then create Views that have Inputs and Outputs to the Information objects, the relationship has direction from View to Information.
    - hasInput and hasOutput relationships are from View to Information.
    - Concepts are created as Information objects (typeName: Information) and have the proposedType filled in as a representing the Information name in one word noun.
    - Roles process Role objects (typeName: Role).
    - Tasks should be Task objects (typeName: Task).
    - Views should be View objects (typeName: View) and must have a applies relationship from a Task.

    Create a description of the domain that gives an summary of the content, exclude the word "domain" in the description.
  `;

    const promptWithContext = `
    Domain to explore and maybe suggested types to include: ${prompt}

    ${context}

    Existing objects:

    ${existingContext}

    Don't create existing objects, but relationships can be created to or from existing objects and new objects.
    If existing objects description field is empty, add your best suggestion of a description.
    Use existing id for existing objects and generate new id for new objects.
    Create missing relships also between existing objects.
    Make sure Views are related to Information and from Tasks.
    Make sure Tasks have a relship from Roles and to Views.
    Make sure all objects have relationships.
`;

    const systemPrompt: OpenAI.ChatCompletionMessageParam = {
        role: "system",
        content: `You are a helpful assistant and a concept modelling expert that can explore the given domain concepts.
    The domain is related to ${prompt}.

    Your Role:
    - You are an expert in concept modeling and domain exploration.
    - Your task is to create new objects and relationships based on the existing objects and relationships provided.
    - The resulting model is based on the metamodel and the domain concepts. 

    ${metamodel}

    Context:
    - The domain includes or extends the following existing objects and relationships.
    - You are asked to create new objects and relationships based on the existing objects and relationships.

    Formatting:
    - Use the provided object types and relationship types to create new objects and relationships as structured data.
    - Use existing id's for existing objects and generate new uuid's for new objects.

    Constraints:
    - Do not create existing objects, but relationships can be created to or from existing objects and new objects.
    - If existing objects' description fields are empty, add your best suggestion of a description.
    - Use existing id's for existing objects and generate new uuid's for new objects.

    Your Task:
    - Suggest at least 10 new objects and their relationships based on the existing objects and relationships and the domain (prompt) provided.
    Create a description of the domain that gives a summary of the content, excluding the word "domain".
    The description will be used to summarize the domain and its content and overall description of the model.
    - Make sure all objects have at least one relationship.
    - Use the provided object types and relationship types defined in the Metamodel to create new objects and relationships as structured data.

    Examples:
    - Example of a UUID: '123e4567-e89b-12d3-a456-426614174000'
    - Example of an object: { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Customer', proposedType: 'Customer', typeName: 'Information' }
`
    };

    const response = await client.chat.completions.create({
        model: modelName,
        messages: [
            systemPrompt,
            {
                role: "user",
                content: `${promptWithContext}`,
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