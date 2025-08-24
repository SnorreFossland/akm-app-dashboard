// Utility to extract domain name and description from markdown-like content.
export function extractDomainNameAndDescription(content: string) {
    const lines = content.split('\n');
    let firstLine = '';
    let secondLine = '';

    // Try to capture the content between "Domain Name" and "Domain Description" (supports same-line or block-style)
    const nameBetweenRegex = /Domain\s*Name\s*[:\-]?\s*(?:\n\s*)?([\s\S]*?)\s*(?=\n\s*(?:Domain\s*Description\b|$))/i;
    const nameMatch = content.match(nameBetweenRegex);
    if (nameMatch && nameMatch[1]) {
        firstLine = nameMatch[1].replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    } else {
        // Fallback: find a line containing "Domain Name" and strip the label, or use the first non-empty line
        const nameLine = lines.find(line => /Domain\s*Name/i.test(line)) || lines.find(l => l.trim() !== '') || '';
        firstLine = nameLine.replace(/Domain\s*Name[:\-\s]*/i, '').replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    }

    // Try to capture a domain description block after "Domain Description"
    const descRegex = /Domain\s*Description\s*[:\-]?\s*(?:\n\s*)?([\s\S]*?)\s*(?=\n\s*(?:Domain\s*Presentation\b|$))/i;
    const descMatch = content.match(descRegex);
    if (descMatch && descMatch[1]) {
        secondLine = descMatch[1].replace(/^#+\s*/, '').trim();
    } else {
        const descLine = lines.find(line => /Domain\s*Description/i.test(line)) || lines[1] || '';
        secondLine = descLine.replace(/Domain\s*Description[:\-\s]*/i, '').replace(/^#+\s*/, '').trim();
    }

    // Fallback to first line of content if extraction failed
    const finalFirstLine = firstLine || content.split('\n')[0] || 'Document';
    const finalSecondLine = secondLine || 'AIChat Document';

    return { name: finalFirstLine, description: finalSecondLine };
}

export default extractDomainNameAndDescription;
