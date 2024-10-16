import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Domain {
    name: string;
    objects: { id: string; name: string; typeName: string; proposedType: string }[];
    relationships: { fromobjectRef: string; nameFrom: string; id: string; name: string; toobjectRef: string; nameTo: string; typeRef: string }[];
}

export const ObjectCard = ({ domain }: { domain: Domain }) => {
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const [showObjectsCard, setShowObjectsCard] = useState(true);
    const [showDiagram, setShowDiagram] = useState(false);
    const diagramRef = useRef<HTMLDivElement>(null);

    console.log('17 domain:', domain);

    const generateMermaidDiagram = () => {
        let diagram = 'graph TD;\n';

        // Add objects
        domain.objects.forEach((object) => {
            diagram += `${object.id}["${object.name} \n (${object.typeName})"];\n`;
        });

        // Add relationships
        domain.relationships.forEach((relationship) => {
            diagram += `${relationship.fromobjectRef} -->|${relationship.name}| ${relationship.toobjectRef};\n`;
        });

        setMermaidDiagram(diagram);
    };

    useEffect(() => {
        if (mermaidDiagram && diagramRef.current) {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'base',
                themeVariables: {
                    primaryColor: '#667777', // box fill color
                    edgeLabelBackground: 'transparent', //
                    secondaryColor: '#8888ff',
                    tertiaryColor: '#ddddff',
                    primaryTextColor: '#ffdddd',
                    secondaryTextColor: '#00ff00',
                    tertiaryTextColor: '#0000ff',
                    lineColor: '#dddddd',
                },
            });
            mermaid.contentLoaded();
        }
    }, [mermaidDiagram]);

    const renderMermaidDiagram = () => {
        if (mermaidDiagram) {
            return <div ref={diagramRef} className="mermaid">{mermaidDiagram}</div>;
        }
        return null;
    };

    return (
        <div className="w-100 m-auto">
            <div className="w-100 m-auto">
                <div className="flex justify-between items-center">
                    {/* <h6 className="text-white">AKM - IRTV Objects and Relationships</h6> */}
                    <button
                        onClick={() => setShowObjectsCard(!showObjectsCard)}
                        className="relative top-0 right-0 px-2 rounded bg-gray-500 text-white hover:text-white"
                    >
                        {showObjectsCard ? '-' : '+'}
                    </button>
                </div>
                {showObjectsCard && !showDiagram && (
                    <div>
                        {/* <h4 className="text-2xl font-bold ms-4">Prompt : {domain?.name}</h4> */}
                        <div className="flex space-x-4">
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="bg-gray-700 px-2 m-0 text-1xl font-bold">Objects</CardTitle>
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
                                                    {domain?.objects.map((object) => (
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
                            <Card className="w-full max-h-[48rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                <CardHeader>
                                    <CardTitle className="bg-gray-700 px-2 m-0 text-1xl font-bold">Relationships</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6k">
                                    <div className="max-h-96 overflow-auto">
                                        <div className="overflow-auto max-h-96">
                                            <table className="min-w-full divide-y divide-gray-700 text-sm">
                                                <thead className="bg-gray-800 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">From</th>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Relationship</th>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">To</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-gray-900 divide-y divide-gray-700">
                                                    {domain?.relationships.map((relationship) => (
                                                        <tr key={relationship.id}>
                                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relationship.nameFrom}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relationship.name}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relationship.nameTo}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
                <div>
                    <Card className="w-full h-full my-1">
                        <button
                            onClick={generateMermaidDiagram}
                            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                        >
                            Generate Mermaid Diagram
                        </button>
                        {/* <button
                            onClick={() => setShowDiagram(!showDiagram)}
                            className="bg-blue-500 text-white px-4 py-2 rounded mt-4 ml-2"
                        >
                            Toggle Diagram View
                        </button> */}
                        {mermaidDiagram && !showDiagram && (
                            <div className='overflow-auto min-h-[48rem] h-full'>
                                {renderMermaidDiagram()}
                            </div>
                        )}
                        {/* {showDiagram && (
                            <div id="mermaid-code">
                                <pre className="bg-gray-800 text-white p-4 rounded">
                                    {mermaidDiagram}
                                </pre>
                            </div>
                        )} */}
                    </Card>
                </div>
            </div>
        </div>
    );
};