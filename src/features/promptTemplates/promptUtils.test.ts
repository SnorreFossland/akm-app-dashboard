import { selectPromptTemplates } from '@/lib/promptUtils';
import { PROMPT_TEMPLATES } from '@/components/ai-chat/promptTemplates';

describe('selectPromptTemplates', () => {
    it('returns templates matching document type and domain category (exact match)', () => {
        // TODO: create minimal sample templates and assert exact-match ordering
    });

    it('falls back to generic templates when no specific match is found', () => {
        // TODO: assert fallback behavior
    });

    it('scores templates by priority and usage', () => {
        // TODO: assert scoring ordering
    });
});