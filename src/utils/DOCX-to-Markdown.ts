import * as mammoth from 'mammoth';
import TurndownService from 'turndown';

interface ConversionOptions {
  skipImages?: boolean;
}

export async function convertDocxToMarkdown(file: File, options: ConversionOptions = {}): Promise<string> {
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Create options for mammoth
    const mammothOptions: any = { // Using 'any' to avoid TypeScript errors
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh"
      ]
    };

    // Skip images if option is set
    if (options.skipImages) {
      mammothOptions.convertImage = () => {
        return Promise.resolve({ value: "" });
      };
    }

    // First try extracting raw text as a fallback option
    let plainText = '';
    try {
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      plainText = rawTextResult.value; // Save as fallback
    } catch (e) {
      console.warn("Failed to extract raw text, continuing with HTML conversion", e);
    }

    try {
      // Try converting to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, mammothOptions);

      // Configure turndown with proper handling for all elements
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*'
      });

      // Add rules for problematic elements
      turndownService.addRule('fixBrokenElements', {
        filter: (node) => {
          // This will catch any elements that might be problematic
          return node.nodeName !== 'DIV' &&
            node.nodeName !== 'SPAN' &&
            node.nodeName !== 'P' &&
            node.nodeName !== 'H1' &&
            node.nodeName !== 'H2' &&
            node.nodeName !== 'H3' &&
            node.nodeName !== 'H4' &&
            node.nodeName !== 'UL' &&
            node.nodeName !== 'OL' &&
            node.nodeName !== 'LI' &&
            node.nodeName !== 'STRONG' &&
            node.nodeName !== 'EM' &&
            node.nodeName !== 'A' &&
            node.nodeName !== 'BR' &&
            node.nodeName !== 'HR' &&
            node.nodeName !== 'TABLE' &&
            node.nodeName !== 'THEAD' &&
            node.nodeName !== 'TBODY' &&
            node.nodeName !== 'TR' &&
            node.nodeName !== 'TH' &&
            node.nodeName !== 'TD' &&
            node.nodeName !== 'PRE' &&
            node.nodeName !== 'CODE';
        },
        replacement: (content) => content
      });

      // Return the markdown result
      return turndownService.turndown(result.value);
    } catch (htmlError) {
      console.error("HTML conversion failed, falling back to plain text", htmlError);
      // If HTML conversion fails, return the plain text we extracted earlier
      return plainText;
    }
  } catch (error) {
    console.error('Error converting DOCX to Markdown:', error);
    throw new Error(`Failed to convert DOCX file: ${error instanceof Error ? error.message : String(error)}`);
  }
}