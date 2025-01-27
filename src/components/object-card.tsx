import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';

export interface Model {
    name: string;
    description: string;
    objects: { id: string; name: string; typeName: string; proposedType: string }[];
    relships: { fromobjectRef: string; nameFrom: string; id: string; name: string; toobjectRef: string; nameTo: string; typeRef: string }[];
}

const debug = false;

export const ObjectCard = ({ model }: { model: Model }) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    // const [mermaidCode, setMermaidCode] = useState('');
    // const [showObjectsCard, setShowObjectsCard] = useState(true);
    // const [showDiagram, setShowDiagram] = useState(false);
    const [activeTab, setActiveTab] = useState('objects');
    const [regen, setRegen] = useState(false);
    console.log('24 model:', model);

    // const objColor = (obj: string) => {
    //     switch (obj) {
    //         case 'actor':
    //             return 'bg-blue-500';
    //         case 'object':
    //             return 'bg-green-500';
    //         case 'action':
    //             return 'bg-yellow-500';
    //         case 'event':
    //             return 'bg-red-500';
    //         case 'place':
    //             return 'bg-purple-500';
    //         case 'concept':
    //             return 'bg-indigo-500';
    //         case 'property':
    //             return 'bg-pink-500';
    //         default:
    //             return 'bg-gray-500';
    //     }
    // }

    if (!debug) console.log('21 object-card domain:', model);

    const generateMermaidDiagram = (regen: boolean) => {
        let diagram = (regen) ? 'graph TD;\n' : 'graph TD;\n\n';
        // Add objects
        model.objects.forEach((object) => {
            const objColor = (obj: any) => {
                switch (obj.typeName) {
                    case 'role':
                        return 'fill: bg-blue-500, stroke: #333, stroke-width: 2px';
                    case 'task': 'fill: bg-green-500, stroke: #333, stroke-width: 2px';
                    case 'view': 'fill: bg-yellow-500, stroke: #333, stroke-width: 2px';


                }
            }

            diagram += `${object.id}["${object.name} \n (${object.typeName})"];\n\n`;
            // diagram += `${nodeId}["<i class='fab fa-youtube'></i> ${object.name}"];\n`;
            // diagram += `style ${object.id} ${objColor}\n`; // Set custom color for the object
        });
        // Add relationships
        model.relships.forEach((relship) => {
            diagram += `${relship.fromobjectRef} -->|${relship.name}| ${relship.toobjectRef};\n\n`;
        });
        setMermaidDiagram(diagram);
        // diagramRef.current?.scrollIntoView({ behavior: 'smooth' });
    };


    useEffect(() => {
        if (mermaidDiagram && diagramRef.current) {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'base',
                themeVariables: {
                    primaryColor: '#224444',
                    edgeLabelBackground: '#33557700', //'rgba(0, 0, 0, 0)',
                    secondaryColor: '#8888ff',
                    tertiaryColor: '#dddddd',
                    primaryTextColor: '#ffdddd',
                    secondaryTextColor: '#00ff00',
                    tertiaryTextColor: '#0000ff',
                    lineColor: '#dddddd', // line relationship color
                    background: 'red', // light background
                    nodeBorderRadius: '5px', // rounded objects
                    // background: '#ffffff', // light background
                    // nodeBorderRadius: '15px', // rounded objects
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
        <div className="w-100 max-h-[calc(100vh-7.5rem)] overflow-hidden">
            <div className="w-100 m-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-gray-700 mb-0 pb-1">
                    <TabsList className="m-1 mb-0 bg-transparent">
                        <TabsTrigger value="objects" className='pb-2 mt-2'>Object List</TabsTrigger>
                        <TabsTrigger value="relationships" className='pb-2 mt-2'>Relationship List</TabsTrigger>
                        <TabsTrigger value="diagram" className='pb-2 mt-2'>Preview Diagram</TabsTrigger></TabsList>
                    {/* <TabsTrigger value="objects" className={activeTab === 'objects' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Objects & Relationships</TabsTrigger>
                        <TabsTrigger value="diagram" className={activeTab === 'diagram' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Preview Diagram</TabsTrigger></TabsList> */}
                    <TabsContent value="objects" className="m-0 px-1 py-2 rounded bg-background">
                        <div>
                            {/* <h4 className="text-2xl font-bold ms-4">Prompt : {domain?.name}</h4> */}
                            <div className="flex space-x-4">
                                <Card className="w-full">
                                    <CardHeader>
                                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Objects</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6k">
                                        <table className="min-w-full divide-y divide-gray-700 text-sm">
                                            <thead className="bg-gray-800 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Type Name</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Proposed Type</th>
                                                </tr>
                                            </thead>
                                            <tbody className="max-h-[88rem] bg-gray-900 divide-y divide-gray-700">
                                                {model?.objects?.map((object) => (
                                                    <tr key={object.id}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.name}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.typeName}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.proposedType}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="relationships" className="m-0 px-1 py-2 rounded bg-background">
                        <div>
                            <div className="flex space-x-4">
                                <Card className="w-full">
                                    <CardHeader>
                                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Relationships</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6k">
                                        <div className="max-h-96 overflow-auto">
                                            <div className="overflow-auto h-90vh">
                                                <table className="min-w-full divide-y divide-gray-700 text-sm">
                                                    <thead className="bg-gray-800 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">From</th>
                                                            <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Relationship</th>
                                                            <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">To</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-gray-800 divide-y divide-gray-700 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                        {model?.relships?.map((relship) => (
                                                            <tr key={relship.id}>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relship.nameFrom}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relship.name}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{relship.nameTo}</td>
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
                    </TabsContent>
                    <TabsContent value="diagram" className="m-0 px-1 py-2 rounded bg-background  overflow-auto">
                        <div>
                            <div className="flex justify-start pb-1 pt-0 mx-2">
                                <button
                                    onClick={() => {
                                        generateMermaidDiagram(!regen);
                                        setRegen(!regen);
                                    }}
                                    className="mt-1 px-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-700"
                                >
                                    Regenerate Diagram
                                </button>
                            </div>
                            <Card className="w-full ">
                                <div className="h-screen  bg-gray-600 rounded border">
                                    {renderMermaidDiagram()}
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};