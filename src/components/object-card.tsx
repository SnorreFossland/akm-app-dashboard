import React, { useEffect, useRef, useState} from 'react';
import { z } from 'zod';
import mermaid from 'mermaid';
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

    const [mermaidDiagram, setMermaidDiagram] = useState('');

    const generateMermaidDiagram = () => {
        let diagram = 'graph TD;\n';

        // Add objects
        domain.objects.forEach((object) => {
            diagram += `${object.id}["${object.name}"];\n`;
        });

        // Add relationships
        domain.relationships.forEach((relationship) => {
            diagram += `${relationship.fromobjectRef} -->|${relationship.name}| ${relationship.toobjectRef};\n`;
        });

        setMermaidDiagram(diagram);
    };

    useEffect(() => {
        if (mermaidDiagram) {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'base',
                themeVariables: {
                    primaryColor: '#ffffff',
                    edgeLabelBackground: '#dddddd',
                    secondaryColor: '#ffffff',
                    tertiaryColor: '#ffffff',
                    primaryTextColor: '#aaaaaa',
                    secondaryTextColor: '#00ff00',
                    tertiaryTextColor: '#0000ff',
                    lineColor: '#ffffff',
                },
            });
            mermaid.contentLoaded();
        }
    }, [mermaidDiagram]);

    const renderMermaidDiagram = () => {
        if (mermaidDiagram) {
            mermaid.initialize({ startOnLoad: true });
            mermaid.contentLoaded();
            return <div className="mermaid">{mermaidDiagram}</div>;
        }
        return null;
    };


    const jsonOutput = {
        name: domain.name,
        description: domain.description,
        objects: domain.objects.map((object) => ({
            id: object.id,
            name: object.name,
            description: object.description,
            proposedType: object.proposedType,
            typeRef: object.typeRef,
            typeName: object.typeName
        })),
        relationships: domain.relationships.map((relationship) => ({
            fromobjectRef: relationship.fromobjectRef,
            nameFrom: relationship.nameFrom,
            id: relationship.id,
            name: relationship.name,
            toobjectRef: relationship.toobjectRef,
            nameTo: relationship.nameTo,
            typeRef: relationship.typeRef,   
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
            <div className="flex space-x-4">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Objects</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6k">
                        <div className="max-h-96 overflow-auto">
                            <div className="overflow-auto max-h-96">
                                <table className="min-w-full divide-y divide-gray-700 text-sm">
                                    <thead className="bg-gray-800 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Type Name</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Proposed Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                                        {domain.objects.map((object) => (
                                            <tr key={object.id}>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.name}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.typeName}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.proposedType}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className=" w-full max-h-[48rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                    <CardHeader>
                            <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Relationships</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 ">
                        <div className="max-h-96 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-700 text-sm">
                                <thead className="bg-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">From</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Relationship</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">To</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-900 divide-y divide-gray-700">
                                    {domain.relationships.map((relationship) => (
                                        <tr key={relationship.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relationship.nameFrom}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relationship.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relationship.nameTo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card className="w-full my-1">
                {/* <CardHeader>
                    <CardTitle className="text-2xl font-bold">{domain.name}</CardTitle>
                </CardHeader> */}
                <CardContent className="grid gap-5 ">
                    <div className="max-h-96 overflow-auto">
                        <h3 className="text-lg font-semibold my-2">JSON Output:</h3>
                        <button
                            className="absolute top-0 right-0 mt-2 mr-2 text-gray-300 hover:text-white"
                            onClick={() => {
                                const content = document.getElementById('json-content');
                                if (content) {
                                    content.classList.toggle('hidden');
                                }
                            }}
                        >
                            +
                        </button>
                        <hr className="mb-4 bg-gray-800 h-1" />
                        <div className="relative">
                            <div id="json-content" className="hidden">
                                <ReactMarkdown>{markdownOutput}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <button
                onClick={generateMermaidDiagram}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
                Generate Mermaid Diagram
            </button>
            {renderMermaidDiagram()}
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

                