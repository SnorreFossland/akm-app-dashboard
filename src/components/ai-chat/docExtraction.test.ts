import extractDomainNameAndDescription from './docExtraction';

describe('extractDomainNameAndDescription', () => {
    test('extracts block-style content between headings', () => {
        const content = `# Domain Name\nMy Domain Title\n\n# Domain Description\nThis is the description of the domain.`;
        const { name, description } = extractDomainNameAndDescription(content);
        expect(name).toBe('My Domain Title');
        expect(description).toBe('This is the description of the domain.');
    });

    test('extracts same-line labeled values', () => {
        const content = `Domain Name: The Same Line Title\nDomain Description: Short desc here.`;
        const { name, description } = extractDomainNameAndDescription(content);
        expect(name).toBe('The Same Line Title');
        expect(description).toBe('Short desc here.');
    });

    test('falls back to first non-empty line when no labels present', () => {
        const content = `Fallback Title\nSome other content`;
        const { name, description } = extractDomainNameAndDescription(content);
        expect(name).toBe('Fallback Title');
        expect(description).toBe('AIChat Document');
    });
});
