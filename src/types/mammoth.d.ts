declare module 'mammoth' {
    export interface ConvertOptions {
        styleMap?: string[];
        includeDefaultStyleMap?: boolean;
        includeEmbeddedStyleMap?: boolean;
        ignoreEmptyParagraphs?: boolean;
        idPrefix?: string;
        convertImage?: (image: any) => Promise<{ value: string }>;
    }

    export interface ConversionResult {
        value: string;
        messages: { type: string; message: string }[];
    }

    export function convertToHtml(
        input: { path?: string; buffer?: Buffer; arrayBuffer?: ArrayBuffer },
        options?: ConvertOptions
    ): Promise<ConversionResult>;

    export function extractRawText(
        input: { path?: string; buffer?: Buffer; arrayBuffer?: ArrayBuffer },
        options?: ConvertOptions
    ): Promise<ConversionResult>;
}