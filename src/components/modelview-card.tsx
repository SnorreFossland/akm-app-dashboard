import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Modelviews {
    modelview: Modelview[];
}

interface Modelview {
    name: string;
    description: string;
    objectviews: Objectviews[];
    relshipviews: Relshipviews [];
}

interface Objectviews {
    id: string;
    name: string;
    description: string;
    typeName: string;
    loc: string;
    objectRef: string;
}

interface Relshipviews {
    id: string;
    name: string;
    relshipRef: string;
    fromobjviewRef: string;
    toobjviewRef: string;
    points: number[];
}

export const ModelviewCard = ({ modelviews }: { modelviews: Modelviews }) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const [activeTab, setActiveTab] = useState('object-views');
    const [regen, setRegen] = useState(false);


    // if (!modelview) {
    //     return null;
    // }   

    console.log('35 modelview:', modelviews);

    const generateMermaidDiagram = (regen: boolean) => {
        let diagram = (regen) ? 'graph TD;\n' : 'graph TD;\n\n';
        // Add objects
        modelviews.modelview[0].objectviews.forEach((ov: Objectviews) => {
            diagram += `${ov.id}["${ov.name} \n (${ov.typeName})"];\n`;
        });
        // Add relationships
        modelviews.modelview[0].relshipviews.forEach((rv: Relshipviews) => {
            diagram += `${rv.fromobjviewRef} -->|${rv.name}| ${rv.toobjviewRef};\n`;
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
                    edgeLabelBackground: '#33557700',
                    secondaryColor: '#8888ff',
                    tertiaryColor: '#ddddff',
                    primaryTextColor: '#ffdddd',
                    secondaryTextColor: '#00ff00',
                    tertiaryTextColor: '#0000ff',
                    lineColor: '#dddddd',
                    background: '#ffffff', // light background
                    nodeBorderRadius: '15px', // rounded objects
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
        <div className="w-100 max-h-[calc(100vh-16rem)] overflow-hidden">
            <div className="w-100 m-auto">
                <Tabs className="bg-gray-600 mb-0 pb-1" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="m-1 mb-0 bg-transparent">
                        <TabsTrigger 
                            value="object-views" 
                            className='pb-2 mt-2'
                        >
                            Objectviews & Relshipviews
                        </TabsTrigger>
                        <TabsTrigger 
                            value="diagram" 
                            className='pb-2 mt-2'
                        >
                            Preview Diagram
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="object-views" className='p-1 my-0 py-0 rounded'>
                        <div className='my-0 py-0' style={{ backgroundColor: 'hsl(200, 50%, 16%)' }}>
                            <div className="mx-1 pt-2 w-full">
                                {modelviews?.modelview?.length > 0 ? (
                                    <>
                                        Modelview: {modelviews.modelview[0].name} Descr: {modelviews.modelview[0].description}
                                    </>
                                ) : (
                                    "No modelview available"
                                )}
                            </div>                           <div className="flex space-x-4">
                                <Card className="w-full">
                                    <CardHeader>
                                        <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Objects</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6k">
                                        <table className=" divide-y divide-gray-700 text-sm w-full">
                                            <thead className="bg-gray-800 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Type Name</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Loc</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td colSpan={3}>
                                                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                                                            {modelviews?.modelview[0]?.objectviews?.map((ov) => (
                                                                <tr key={ov.id}>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-gray-300">{ov.name}</td>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-gray-300">{ov.typeName}</td>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-gray-300">{ov.loc}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </CardContent>
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
                                                        {modelviews?.modelview[0]?.relshipviews?.map((rv) => (
                                                            <tr key={rv.id}>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rv.nameFrom}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rv.name}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rv.nameTo}</td>
                                                                {/* <td className="px-4 py-2 whitespace-nowrap text-gray-300">{modelviews[0].objectviews.find(ov => ov.id === rv.fromobjviewRef) && ov?.name}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rv.name}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-300">{modelviews[0].objectviews.find(ov => ov.id === rv.toobjviewRef) && ov?.name}</td> */}
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
                    <TabsContent value="diagram" className='p-1 my-0 py-0 rounded'>
                        <div className='my-0 py-0' style={{ backgroundColor: 'hsl(200, 50%, 16%)' }}>
                            <button
                                onClick={() => {
                                    generateMermaidDiagram(!regen);
                                    setRegen(!regen);
                                }}
                                className="m-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                            >
                                Regenerate Diagram
                            </button>
                            <Card className="w-full h-full my-1">
                                <div className='overflow-auto min-h-[48rem] h-full'>
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