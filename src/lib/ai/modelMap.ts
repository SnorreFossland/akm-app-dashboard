// Centralized model id mapping for gateway and genmodel calls

const KNOWN_MODELS = new Set([
  'gpt-5-mini',
  'gpt-5',
  'deepseek-chat',
  'mistral',
  'dummy',
]);

// Map common aliases to supported ids
const ALIASES: Record<string, string> = {
  'gpt-4o': 'gpt-5-mini',
  'gpt-4o-mini': 'gpt-5-mini',
  'gpt4o': 'gpt-5-mini',
  'openai:gpt-4o': 'gpt-5-mini',
  'openai:gpt-4o-mini': 'gpt-5-mini',
};

export function mapModelId(id: string | undefined | null): string {
  const raw = (id || '').trim();
  if (!raw) return 'gpt-5-mini';
  const lowered = raw.toLowerCase();
  if (ALIASES[lowered]) return ALIASES[lowered];
  if (KNOWN_MODELS.has(lowered)) return lowered;
  // Fallback to a safe default
  return 'gpt-5-mini';
}

