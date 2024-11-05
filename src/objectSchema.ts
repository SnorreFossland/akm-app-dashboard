import { z } from "zod";

export const ObjectSchema = z.object({
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
            })
        )
        .describe("List of objects"),
    relationships: z
        .array(
            z.object({
                id: z.string().describe("UUID - Unique identifier of the relationship"),
                name: z.string().describe("relationship name"),
                typeRef: z.string().describe("UUID - Unique identifier of the Meta type"),
                fromobjectRef: z.string().describe("UUID - unique identifier of the first object"),
                nameFrom: z.string().describe("Name of the first object"),
                toobjectRef: z.string().describe("UUID - Unique identifier of the second object"),
                nameTo: z.string().describe("Name of the second object"),
            }).describe("relationship between objects")
        ).describe("list of relationships"),
});