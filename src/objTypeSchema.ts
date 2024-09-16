import { z } from "zod";

export const ObjTypeSchema = z.object({
  name: z.string().describe("Name of the object type"),
  description: z.string().optional().describe("Description of the object type"),
});