import React, { useState, useEffect } from 'react';
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

  const generateMermaidDiagram = () => {
    let diagram = 'graph TD;\n';

    // Add objects
    domain?.objects.forEach((object) => {
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
                    primaryColor: '#888888',
                    edgeLabelBackground: '#dddddd',
                    secondaryColor: '#ffffdd',
                    tertiaryColor: '#ddffff',
                    primaryTextColor: '#ffffff',
                    secondaryTextColor: '#00ff00',
                    tertiaryTextColor: '#0000ff',
                    lineColor: '#eeeeee',
                },
            });
            mermaid.contentLoaded();
        }
    }, [mermaidDiagram]);

  const renderMermaidDiagram = () => {
    if (mermaidDiagram) {
      return <div className="mermaid">{mermaidDiagram}</div>;
    }
    return null;
  };

//   if (!domain || !domain.objects || !domain.relationships) {
//     return <div>No Terms...</div>;
//   }

  return (
    <div className="w-100 m-auto">
        <div className="w-100 m-auto">
            <div className="flex justify-between items-center">
                <h5 className="text-white">Irtv Objects and Relationships</h5>
                <button
                onClick={() => setShowObjectsCard(!showObjectsCard)}
                className="relative top-0 right-0 px-2 rounded bg-gray-500 text-white hover:text-white"
                >
                {showObjectsCard ? '-' : '+'}
                </button>
            </div>
            {showObjectsCard && (
                <div className="flex space-x-4">
                    <Card className="w-full">
                    <CardTitle className="text-2xl font-bold ms-4">Prompt : {domain?.name}</CardTitle>
                    <CardHeader>
                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Objects</CardTitle>
                    </CardHeader>
                    {showObjectsCard && (
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
                    )}
                    </Card>
                    <Card className="w-full max-h-[48rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                    <CardHeader>
                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Relationships</CardTitle>
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
            )}
            <div>
                <Card className="w-full my-1">
                    <button
                        onClick={() => {
                            generateMermaidDiagram();
                            const diagram = document.getElementById('mermaid-diagram');
                            const code = document.getElementById('mermaid-code');
                            if (diagram && code) {
                                if (diagram.classList.contains('hidden')) {
                                    diagram.classList.remove('hidden');
                                    code.classList.add('hidden');
                                } else {
                                    diagram.classList.add('hidden');
                                    code.classList.remove('hidden');
                                }
                            }
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded mt-4 ml-2"
                    >
                        Toggle Preview Diagram
                    </button>
                    <div id="mermaid-diagram" className="hidden">
                        {renderMermaidDiagram()}
                    </div>
                    <div id="mermaid-code">
                        <pre className="bg-gray-800 text-white p-4 rounded">
                            {` ${mermaidDiagram} `}
                        </pre>
                    </div>
                </Card>
            </div>
        </div>  
    </div>
  );
};