import { z } from "zod";

export const OntologySchema = z.object({
    name: z.string().describe("Name of the Domain"),
    description: z.string().describe("Description of the Domain"),
    objects: z
        .array(
            z.object({
                name: z.string().describe("Name of the object"),
                description: z.string().describe("Description of the object"),
            })
        )
        .describe("List of terms"),
    relationships: z
        .array(
            z.object({
                name: z.string().describe("relationship name"),
                nameFrom: z.string().describe("Name of the first object"),
                nameTo: z.string().describe("Name of the second object"),
            }).describe("relationship between objects")
        ).describe("list of relations"),
});
