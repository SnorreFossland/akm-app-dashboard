import { z } from "zod";

export const DomainSchema = z.object({
    domainData: z.object({
        name: z.string().describe("Name of the Domain"),
        description: z.string().describe("Description of the Domain"),
        presentation: z.string().describe("Presentation of the ontology"),
        prompt: z.string().describe("Prompt for the domain"),
    })
});