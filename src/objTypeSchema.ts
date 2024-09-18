import { z } from "zod";

export const ObjTypeSchema = z.object({
  // id: z.string().uuid().describe("Unique identifier of the object type"),
  name: z.string().describe("Name of the object type"),
  description: z.string().optional().describe("Description of the object type"),
  // typeRef: z.string().describe("Reference to the object type"),
  typeName: z.string().describe("Name of the object type"),
});