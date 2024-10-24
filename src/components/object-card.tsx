import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Domain {
    name: string;
    objects: { id: string; name: string; typeName: string; proposedType: string }[];
    relationships: { fromobjectRef: string; nameFrom: string; id: string; name: string; toobjectRef: string; nameTo: string; typeRef: string }[];
}

export const ObjectCard = ({ domain }: { domain: Domain }) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    // const [mermaidCode, setMermaidCode] = useState('');
    // const [showObjectsCard, setShowObjectsCard] = useState(true);
    // const [showDiagram, setShowDiagram] = useState(false);
    const [activeTab, setActiveTab] = useState('objects');
    const [regen, setRegen] = useState(false);

    console.log('21 object-card domain:', domain);

    const generateMermaidDiagram = (regen: boolean) => {
        let diagram = (regen) ? 'graph TD;\n' : 'graph TD;\n\n';
        // Add objects
        domain.objects.forEach((object) => {
            diagram += `${object.id}["${object.name} \n (${object.typeName})"];\n\n`;
        });
        // Add relationships
        domain.relationships.forEach((relationship) => {
            diagram += `${relationship.fromobjectRef} -->|${relationship.name}| ${relationship.toobjectRef};\n\n`;
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
                    primaryColor: '#667777', // box fill color
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
        <div className="w-100 max-h-[calc(100vh-18rem)] overflow-hidden">
            <div className="w-100 m-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                        <TabsTrigger value="objects">Objects & Relationships</TabsTrigger>
                        <TabsTrigger value="diagram">Preview Diagram</TabsTrigger></TabsList>
                        {/* <TabsTrigger value="objects" className={activeTab === 'objects' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Objects & Relationships</TabsTrigger>
                        <TabsTrigger value="diagram" className={activeTab === 'diagram' ? 'active-tab bg-red-500 text-black' : 'inactive-tab bg-gray-800 text-white'}>Preview Diagram</TabsTrigger></TabsList> */}
                <TabsContent value="objects">
                    <div className="flex justify-between items-center">
                        {/* <h6 className="text-white">AKM - IRTV Objects and Relationships</h6> */}
                        {/* <button
                            onClick={() => setShowObjectsCard(!showObjectsCard)}
                            className="relative top-0 right-0 px-2 rounded bg-gray-500 text-white hover:text-white ml-auto"
                        >
                            {showObjectsCard ? '-' : '+'}
                        </button> */}
                    </div>
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
                                                <tbody>
                                                    <tr>
                                                        <td colSpan={3}>
                                                            <div className="bg-gray-800 divide-y divide-gray-700 w-full max-h-[calc(82vh-18rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                                <tbody className="max-h-[88rem] bg-gray-900 divide-y divide-gray-700">
                                                                    {domain?.objects.map((object) => (
                                                                        <tr key={object.id}>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.name}</td>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.typeName}</td>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-gray-300">{object.proposedType}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
    
                                </CardContent>
                            </Card>
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
                </TabsContent>
                <TabsContent value="diagram">
                    <div>
                        <button
                            onClick={() => {
                                generateMermaidDiagram(!regen);
                                setRegen(!regen);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                        >
                            Regenerate Diagram
                        </button>
                        <Card className="w-full h-full my-1">
                            <div className='overflow-auto min-h-[48rem]'>
                                {renderMermaidDiagram()}
                            </div>
                            {/* {mermaidDiagram && (
                                <div id="mermaid-code">
                                    <pre className="bg-gray-800 text-white p-4 rounded">
                                        {mermaidDiagram}
                                    </pre>
                   
                                    </div>
                            )} */}
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
            </div>
        </div>
    );
};