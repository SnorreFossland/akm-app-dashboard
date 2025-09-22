import { z } from "zod";

export const OntologySchema = z.object({
    ontologyData: z.object({
        name: z.string().describe("Name of the Domain"),
        description: z.string().describe("Description of the Domain"),
        presentation: z.string().describe("Presentation of the ontology"),
        concepts: z
            .array(
                z.object({
                    // id: z.string().describe("Id of the object"), // Todo: Add id to the object using camelCase of name
                    name: z.string().describe("Name of the object"),
                    description: z.string().describe("Description of the object"),
                    type: z.string().optional().describe("Type of the object, e.g., Person, Organization, Location"),
                    color: z.string().optional().describe("Color associated with the object"),
                })
            )
            .describe("List of terms"),
        relationships: z
            .array(
                z.object({
                    // id: z.string().describe("Id of the relationship"), // Todo: Add id to the object using camelCase of fromName + relname + toname
                    name: z.string().describe("relationship name"),
                    description: z.string().describe("Description of the relationship"),
                    nameFrom: z.string().describe("Name of the first object"),
                    nameTo: z.string().describe("Name of the second object"),
                    type: z.string().optional().describe("Type of relationship, e.g., association, aggregation, composition, inheritance"),
                }).describe("relationship between objects")
            ).describe("list of relations"),
    }),
});