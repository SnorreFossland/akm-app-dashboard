import { z } from "zod";

export const ObjectSchema = z.object({
    name: z.string().describe("Name of the Domain"),
    objects: z
        .array(
            z.object({
                name: z.string().describe("Name of the object"),
                description: z.string().describe("Description of the object"),
                typeName: z.string().describe("Name of the Meta type"),
            })
        )
        .describe("List of objects"),
    relationships: z
        .array(
            z.object({
                nameFrom: z.string().describe("Name of the first object"),
                nameTo: z.string().describe("Name of the second object"),
                name: z.string().describe("relationship name"),
            }).describe("relationship between objects")
        ).describe("list of relationships"),
});