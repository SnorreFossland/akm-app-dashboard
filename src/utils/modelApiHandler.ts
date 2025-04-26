/**
 * Generic API handler for AI model providers
 */

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ModelApiConfig {
    apiKey: string | undefined;
    apiKeyName: string;
    endpoint: string;
    headers: Record<string, string>;
    body: any;
    timeout?: number;
    responseHandler: (data: any) => string;
}

/**
 * Generic API handler for calling various AI model providers
 */
export async function callModelAPI(config: ModelApiConfig): Promise<string> {
    const { apiKey, apiKeyName, endpoint, headers, body, timeout = 20000, responseHandler } = config;

    if (!apiKey) {
        throw new Error(`${apiKeyName} is not set in environment variables`);
    }

    // Use an AbortController to set a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            // Check content type for error response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(`${apiKeyName} API error: ${JSON.stringify(error)}`);
            } else {
                // Handle text error
                const errorText = await response.text();
                throw new Error(`${apiKeyName} API error (${response.status}): ${errorText}`);
            }
        }

        const data = await response.json();
        return responseHandler(data);
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw error;
    }
}