// Utility to extract domain name and description from markdown-like content.
export function extractDomainNameAndDescription(content: string) {
    const lines = content.split('\n');
    let firstLine = '';
    let secondLine = '';

    const sanitizeSingleLine = (value: string) => {
        if (!value) return '';
        return value
            .split(/\r?\n/)
            .map((segment) => segment.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim())
            .find((segment) => segment.length > 0) || '';
    };

    // Try to capture the content between "Domain Name" and "Domain Description" (supports same-line or block-style)
    const nameBetweenRegex = /Domain\s*Name\s*[:\-]?\s*(?:\n\s*)?([\s\S]*?)\s*(?=\n\s*(?:Domain\s*Description\b|$))/i;
    const nameMatch = content.match(nameBetweenRegex);
    if (nameMatch && nameMatch[1]) {
        firstLine = sanitizeSingleLine(nameMatch[1]);
    } else {
        // Fallback: find a line containing "Domain Name" and strip the label, or use the first non-empty line
        const nameLine = lines.find(line => /Domain\s*Name/i.test(line)) || lines.find(l => l.trim() !== '') || '';
        firstLine = sanitizeSingleLine(nameLine.replace(/Domain\s*Name[:\-\s]*/i, ''));
    }

    // Try to capture a domain description block after "Domain Description"
    const descRegex = /Domain\s*Description\s*[:\-]?\s*(?:\n\s*)?([\s\S]*?)\s*(?=\n\s*(?:Domain\s*Presentation\b|$))/i;
    const descMatch = content.match(descRegex);
    if (descMatch && descMatch[1]) {
        secondLine = sanitizeSingleLine(descMatch[1]);
    } else {
        const descLine = lines.find(line => /Domain\s*Description/i.test(line)) || lines[1] || '';
        secondLine = sanitizeSingleLine(descLine.replace(/Domain\s*Description[:\-\s]*/i, ''));
    }

    // Fallback to first line of content if extraction failed
    const finalFirstLine = firstLine || sanitizeSingleLine(content.split('\n')[0]) || 'Document';
    const finalSecondLine = secondLine || 'AIChat Document';

    return { name: finalFirstLine, description: finalSecondLine };
}

export default extractDomainNameAndDescription;
