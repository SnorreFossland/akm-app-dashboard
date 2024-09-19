import { z } from "zod";

export const ObjectSchema = z.object({
    name: z.string().describe("Name of the Domain"),
    objects: z
        .array(
            z.object({
                id: z.string().describe("Unique identifier of the object"),
                name: z.string().describe("Name of the object"),
                description: z.string().describe("Description of the object"),
                proposedType: z.string().describe("Proposed type of the object"),
                typeRef: z.string().describe("Unique identifier of the Meta type"),
                typeName: z.string().describe("Name of the Meta type"),
            })
        )
        .describe("List of objects"),
    relationships: z
        .array(
            z.object({
                fromobjectRef: z.string().describe("Unique identifier of the first object"),
                nameFrom: z.string().describe("Name of the first object"),
                toobjectRef: z.string().describe("Unique identifier of the second object"),
                nameTo: z.string().describe("Name of the second object"),
                id: z.string().describe("Unique identifier of the relationship"),
                name: z.string().describe("relationship name"),
            }).describe("relationship between objects")
        ).describe("list of relationships"),
});