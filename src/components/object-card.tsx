import { ObjectSchema } from '@/objectSchema';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { v4 as uuid4 } from 'uuid';

export function ObjectCard({ domain }: { domain?: z.infer<typeof ObjectSchema> }) {
    if (!domain || !domain.objects || !domain.relationships) return null;

    const jsonOutput = {
        name: domain.name,
        objects: domain.objects.map((object) => ({
            id: uuid4(),
            name: object.name,
            description: object.description,
            proposedType: object.proposedType,
            typeRef: object.typeRef,
            typeName: object.typeName,
        })),
        relationships: domain.relationships.map((relationship) => ({
            fromobjectRef: relationship.fromobjectRef,
            nameFrom: relationship.nameFrom,
            id: uuid4(),
            name: relationship.name,
            toobjectRef: relationship.toobjectRef,
            nameTo: relationship.nameTo,
        })),
    };

    const markdownOutput = `
\`\`\`json
${JSON.stringify(jsonOutput, null, 2)}
\`\`\`
    `;

    return (
        <>
            <CardTitle className="text-2xl font-bold ms-4">Prompt : {domain.name}</CardTitle>
            <div className="flex space-x-4 mx-2">
            <Card className="w-full mx-2">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Objects</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 ">
                    <div className="max-h-96 overflow-auto">
                        <ul className="list-disc list-inside space-y-1">
                            {domain.objects.map((object) => (
                                <li key={object.name}>
                                   id: {object.id}, name: '{object.name}'
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>
            <Card className="w-full mx-2">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Relationships</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 ">
                    <div className="max-h-96 overflow-auto">
                        <ul className="list-inside space-y-2">
                            {domain.relationships.map((relationship) => (
                                <li key={relationship.name}>
                                    {relationship.nameFrom} | {relationship.name} | {relationship.nameTo}
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>
                    </div>
            <Card className="w-full mx-2">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">{domain.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 ">
                    <div className="max-h-96 overflow-auto">
                        <h3 className="text-lg font-semibold mb-2">JSON Output:</h3>
                        <hr className="my-4 bg-gray-800 h-1" />
                            <div className="max-h-96 overflow-auto bg-black p-4 rounded-lg">
                            <ReactMarkdown>{markdownOutput}</ReactMarkdown>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
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

                