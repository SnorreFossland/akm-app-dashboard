import { z, ZodSchema } from "zod";

export function zodResponseFormat<T>(schema: ZodSchema<T>, schemaName: string) {
    return {
        parse: (data: unknown) => {
            try {
                const parsedData = schema.parse(data);
                return {
                    success: true,
                    data: parsedData,
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Invalid ${schemaName} format: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    };
}