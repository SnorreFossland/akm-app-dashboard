import { z } from "zod";

export const ObjectSchema = z.object({
    // is not model level schema, so no id, name, description for now
    // id: z.string().describe("UUID - Unique identifier of the Model"),
    name: z.string().describe("Name of the Model"),
    description: z.string().describe("Description of the Model"),
    objects: z
        .array(
            z.object({
                id: z.string().describe("UUID - Unique identifier of the object"),
                name: z.string().describe("Name of the object"),
                description: z.string().describe("Description of the object"),
                typeRef: z.string().describe("UUID - Unique identifier of the Meta type"),
                typeName: z.string().describe("Name of the Meta type"),
                proposedType: z.string().describe("Proposed type of the Information object"),
                createdAt: z.string().describe("ISO timestamp when the object was created"),
                modifiedAt: z.string().describe("ISO timestamp when the object was last modified"),
            })
        )
        .describe("List of objects"),
    relships: z
        .array(
            z.object({
                id: z.string().describe("UUID - Unique identifier of the relationship"),
                name: z.string().describe("relationship name"),
                typeRef: z.string().describe("UUID - Unique identifier of the Meta type"),
                fromobjectRef: z.string().describe("UUID - unique identifier of the first object"),
                nameFrom: z.string().describe("Name of the first object"),
                toobjectRef: z.string().describe("UUID - Unique identifier of the second object"),
                nameTo: z.string().describe("Name of the second object"),
                createdAt: z.string().describe("ISO timestamp when the relationship was created"),
                modifiedAt: z.string().describe("ISO timestamp when the relationship was last modified"),
            }).describe("relationship between objects")
        ).describe("list of relationships"),
});