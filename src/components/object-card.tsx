import { ObjectSchema } from '@/objectSchema';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

export function ObjectCard({ domain }: { domain?: z.infer<typeof ObjectSchema> }) {
    if (!domain || !domain.objects || !domain.relationships) return null;

    const jsonOutput = {
        name: domain.name,
        objects: domain.objects.map((object) => ({
            name: object.name,
            description: object.description,
            typeName: object.typeName,
        })),
        relationships: domain.relationships.map((relationship) => ({
            nameFrom: relationship.nameFrom,
            name: relationship.name,
            nameTo: relationship.nameTo,
        })),
    };

    const markdownOutput = `
\`\`\`json
${JSON.stringify(jsonOutput, null, 2)}
\`\`\`
    `;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">{domain.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
                <ReactMarkdown>{markdownOutput}</ReactMarkdown>
            </CardContent>
        </Card>
    );
}

{/* {domain.objects && domain.objects.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Objects</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {domain.objects.map((object) => (
                                <li key={object.name}>
                                    name: {object.name} | description: {object.description} |
                                    typeName: {object.typeName}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {domain.relationships && domain.relationships.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Relationships</h3>
                        <ul className="list-inside space-y-2">
                            {domain.relationships.map((relationship) => (
                                <li key={relationship.name}>
                                    nameFrom: {relationship.nameFrom} | name: {relationship.name} |
                                    nameTo: {relationship.nameTo}
                                </li>
                            ))}
                        </ul>
                    </div>
                )} */}