import { z } from "zod";

export const ModelviewSchema = z.object({
    id: z.string().describe("UUID - Unique identifier of the modelview"),
    name: z.string().describe("Name of the modelview"),
    description: z.string().describe("Description of the modelview"),
    objectviews: z.array(
        z.object({
            id: z.string().describe("UUID - Unique identifier of the objectview"),
            name: z.string().describe("Name of the objectview"),
            description: z.string().describe("Description of the objectview"),
            typeName: z.string().describe("Type of the objectview"),
            loc: z.string().describe("Location of the objectview"),
            objectRef: z.string().describe("Reference to the object"),
        }).describe("Objectview schema")
    ).describe("List of objectviews"),
    relshipviews: z.array(
        z.object({
            id: z.string().describe("UUID - Unique identifier of the relationship"),
            name: z.string().describe("Name of the relationship"),
            fromobjviewRef: z.string().describe("UUID - Unique identifier of the first objectview"),
            toobjviewRef: z.string().describe("UUID - Unique identifier of the second objectview"),
            points: z.array(z.number()).describe("List of points"),
        }).describe("Relshipviews schema")
    ).describe("List of relationships"),
});

// size: z.string().describe("Size of the objectview"),
// memberscale: z.number().describe("Scale of members in the objectview"),

// modified: z.boolean().describe("Indicates if the object is modified"),
// markedAsDeleted: z.boolean().describe("Indicates if the object is marked as deleted"),
// isSelect: z.boolean().describe("Indicates if the object is selected"),
// isGroup: z.boolean().describe("Indicates if the object is a group"),
// isExpanded: z.boolean().describe("Indicates if the object is expanded"),
// image: z.string().describe("Image associated with the objectview"),
// icon: z.string().describe("Icon associated with the objectview"),
// fillColor: z.string().describe("Fill color of the objectview"),
// strokeColor: z.string().describe("Stroke color of the objectview"),
// strokeWidth: z.string().describe("Stroke width of the objectview"),
// strokeColor2: z.string().describe("Secondary stroke color of the objectview"),
// textColor: z.string().describe("Text color of the objectview"),
// textColor2: z.string().describe("Secondary text color of the objectview"),