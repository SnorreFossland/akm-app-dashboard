import React, { useEffect, useRef} from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';


import { ObjectSchema } from '@/objectSchema';

export function ObjectCard({ domain }: { domain?: z.infer<typeof ObjectSchema> }) {
const jsonStringRef = useRef<string | null>(null);
const phDataRef = useRef<any | null>(null);

useEffect(() => {
    jsonStringRef.current = sessionStorage.getItem('memoryState');
    if (jsonStringRef.current) {
        phDataRef.current = JSON.parse(jsonStringRef.current);
    }
}, []);

    if (!domain || !domain.objects || !domain.relationships) return null;

// console.log('22', domain, phDataRef);

    const jsonOutput = {
        name: domain.name,
        description: domain.description,
        objects: domain.objects.map((object) => ({
            id: object.id,
            name: object.name,
            description: object.description,
            proposedType: object.proposedType,
            typeRef: object.typeRef,
            typeName: object.typeName,
        })),
        relationships: domain.relationships.map((relationship) => ({
            fromobjectRef: relationship.fromobjectRef,
            nameFrom: relationship.nameFrom,
            id: relationship.id,
            name: relationship.name,
            toobjectRef: relationship.toobjectRef,
            nameTo: relationship.nameTo,
            typeRef: relationship.typeRef,
            typeName: relationship.typeName,        
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
            <div className="flex space-x-4 ">
            <Card className="">
                <CardHeader>
                    <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Objects</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6k">
                    <div className="max-h-96 overflow-auto">
                        <ul className="list-disc list-inside space-y-1">
                            {domain.objects.map((object) => (
                                <li key={object.id}>
                                    id: &quot;{object.id}&quot;, name: &quot;{object.name}&quot;, typeName: &quot;{object.typeName}&quot;
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>
            <Card className="flex-5">
                <CardHeader>
                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Relationships</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 ">
                    <div className="max-h-96 overflow-auto">
                        <ul className="list-inside space-y-2">
                            {domain.relationships.map((relationship) => (
                                <li key={relationship.id}>
                                    {relationship.nameFrom} | {relationship.name} | {relationship.nameTo}
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>
                    </div>
            <Card className="w-full">
                {/* <CardHeader>
                    <CardTitle className="text-2xl font-bold">{domain.name}</CardTitle>
                </CardHeader> */}
                <CardContent className="grid gap-5 ">
                    <div className="max-h-96 overflow-auto">
                        <h3 className="text-lg font-semibold my-2">JSON Output:</h3>
                        <hr className="mb-4 bg-gray-800 h-1" />
                        <div className="max-h-96 overflow-auto bg-black px-4 rounded-lg">
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

                