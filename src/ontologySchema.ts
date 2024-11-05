import { z } from "zod";

export const OntologySchema = z.object({
    ontologyData: z.object({
        name: z.string().describe("Name of the Domain"),
        description: z.string().describe("Description of the Domain"),
        presentation: z.string().describe("Presentation of the ontology"),
        concepts: z
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
    }),
});