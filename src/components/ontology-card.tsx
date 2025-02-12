import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Payment, columns } from "@/components/aiBuilders/concept-columns";
import { ConceptTable } from "@/components/aiBuilders/concept-table";
import { RelshipTable } from "@/components/aiBuilders/relship-table";
import ReactMarkdown from 'react-markdown';
import 'tailwindcss/tailwind.css'; // Ensure Tailwind CSS is imported
import '@fortawesome/fontawesome-free/css/all.min.css';

interface OntologyCardProps {
    ontologyData: {
        name: string;
        description: string;
        concepts: Concept[];
        relationships: Relationship[];
        presentation: string;
    } | null;
}
interface Concept {
    name: string;
    description: string;
}
interface Relationship {
    name: string;
    nameFrom: string;
    nameTo: string;
}

const debug = false;

export const OntologyCard = ({ ontologyData }: OntologyCardProps) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');

    const [activeTab, setActiveTab] = useState('concepts'); // concepts, diagram
    const [regen, setRegen] = useState(true);

    if (!debug) console.log('35 ontology-card', ontologyData);

    const generateMermaidDiagram = useCallback((regen: boolean) => {
        try {
            let diagram = (regen) ? 'graph LR;\n' : 'graph LR;\n\n';
            ontologyData?.concepts?.forEach((object) => {
                const nodeId = object.name.replace(/[\s()]+/g, '_');
                diagram += `${nodeId}["${object.name}"];\n`;
                // diagram += `${nodeId}["<i class='fab fa-youtube'></i> ${object.name}"];\n`;
                // diagram += `style ${nodeId} fill:#f9f,stroke:#333,stroke-width:2px;\n`; // Set custom color for the object
            });
            ontologyData?.relationships?.forEach((r) => {
                diagram += `${r.nameFrom.replace(/[\s()]+/g, '_')} -->|${r.name.replace(/[\s()]+/g, '_')}| ${r.nameTo.replace(/[\s()]+/g, '_')};\n`;
            });
            setMermaidDiagram(diagram);
        } catch (error) {
            console.error('Error generating Mermaid diagram:', error);
        }
    }, [ontologyData]);

    useEffect(() => {
        generateMermaidDiagram(regen);
    }, [ontologyData, generateMermaidDiagram, regen]);

    useEffect(() => {
        if (mermaidDiagram && diagramRef.current) {
            try {
                mermaid.initialize({
                    startOnLoad: true,
                    theme: 'dark',
                    themeVariables: {
                        primaryColor: '#224444',
                        edgeLabelBackground: '#22557715',
                        secondaryColor: '#8888ff',
                        tertiaryColor: '#ddddff',
                        primaryTextColor: '#ffdddd',
                        secondaryTextColor: '#00ff00',
                        tertiaryTextColor: '#0000ff',
                        lineColor: '#dddddd',
                        background: '#ffffff',
                        nodeBorderRadius: '25px',
                        rough: true, // Enable rough visualization
                    },
                    securityLevel: 'loose', // Allow raw HTML if needed
                });
                mermaid.contentLoaded();
            } catch (error) {
                console.error('Error initializing Mermaid:', error);
            }
        }
    }, [mermaidDiagram]);

    const renderMermaidDiagram = () => {
        if (mermaidDiagram) {
            return <div ref={diagramRef} className="mermaid">{mermaidDiagram}</div>;
        }
        return null;
    };

    return (
        <>
            <div className="p-1 w-100 rounded overflow-hidden">
                <div className="">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-gray-700 m-1">
                        <TabsList className="mx-1 mb-0 bg-gray-700">
                            <TabsTrigger value="summary" className='pb-2 mt-3'>Concepts Summary</TabsTrigger>
                            <TabsTrigger value="concepts" className='pb-2 mt-3'>Concept List</TabsTrigger>
                            <TabsTrigger value="diagram" className='pb-2 mt-3'>Concept Map</TabsTrigger>
                        </TabsList>
                        <TabsContent value="summary" className="flex p-1 m-0 rounded bg-background  ">
                            <Card className="w-full border-gray-700 h-[calc(100vh-12rem)]">
                                <CardHeader>
                                    <CardTitle className="bg-gray-800 px-2 m-0 font-bold">Short Summary </CardTitle>
                                    {/* <div className="mx-2">{ontologyData?.description}</div> */}
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="prose prose-sm bg-gray-700 p-2 divide-y divide-gray-600 max-h-[calc(100vh-16rem)] 
                                                overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"
                                        style={{ width: '100%' }}
                                    >
                                        <ReactMarkdown>
                                            {ontologyData?.presentation}
                                        </ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="concepts" className=" m-0 px-1 py-1 rounded bg-background">
                            <Card className="">
                                <CardHeader className="px-3 pt-3 pb-0">
                                    <CardTitle className="bg-gray-800 px-2 text-1xl rounded">Concepts</CardTitle>
                                </CardHeader>
                                <div className="">
                                    {ontologyData && <ConceptTable columns={columns} data={ontologyData.concepts} />}
                                </div>
                            </Card>
                            <Card className="mt-1">
                                <CardHeader className="px-3 pt-3 pb-0">
                                    <CardTitle className="bg-gray-800 px-2 text-1xl rounded">Relations</CardTitle>
                                </CardHeader>
                                <div className="">
                                    {ontologyData && <RelshipTable columns={columns} data={ontologyData.relationships} />}
                                </div>
                            </Card>
                            {/* <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="bg-gray-800 px-2 text-1xl font-bold">Concepts</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6k">


                                    <table className="divide-y divide-gray-700 text-sm w-full">
                                        <thead className="w-full bg-gray-800 sticky top-0">
                                            <tr className="w-full">
                                                <th className="px-4 py-2 text-left font-small text-gray-300 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-2 text-center font-small text-gray-300 uppercase tracking-wider">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan={3}>
                                                    <div className="bg-gray-800 divide-y divide-gray-700 w-full max-h-[calc(82vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                        <table className="min-w-full divide-y divide-gray-700 text-sm w-full">
                                                            <tbody className="bg-gray-900 divide-y divide-gray-700 min-w-full w-full">
                                                                {ontologyData?.concepts?.map((c, index) => (
                                                                    <tr key={c.name + index} className="w-full">
                                                                        <td className="px-4 py-2 text-left whitespace-nowrap text-gray-300" style={{ color: c.color }}>{c.name}</td>
                                                                        <td className="px-4 py-2 text-left text-gray-300 min-w-full" style={{ color: c.color }}>{c.description}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
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
                                <CardContent className="grid gap-2">
                                    <div className="bg-gray-800 divide-y divide-gray-700 w-full max-h-[calc(82vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                        <table className="min-w-full divide-y divide-gray-700 text-sm">
                                            <thead className="bg-gray-900 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">From</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Relationship</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">To</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-gray-800 divide-y divide-gray-700 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                {ontologyData?.relationships?.map((rel, index) => (
                                                    <tr key={rel.name + index}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rel.nameFrom}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300" style={{ color: rel.color }}>{rel.name}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rel.nameTo}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card> */}
                        </TabsContent>
                        <TabsContent value="diagram" className="m-0 px-1 rounded bg-background min-h-[57rem] scroll-auto">
                            <>
                                <div className="flex justify-start mx-2">
                                    <button
                                        onClick={() => {
                                            generateMermaidDiagram(!regen);
                                            setRegen(!regen);
                                        }}
                                        className="px-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        Regenerate Diagram
                                    </button>
                                </div>
                                <Card className="w-full h-full my-1">
                                    <div className='overflow-auto max-h-screen bg-gray-600 rounded border max-width-[calc(100vw-222rem)]'>
                                        <div className="overflow-auto max-h-full">
                                            {renderMermaidDiagram()}
                                        </div>
                                    </div>
                                </Card>
                            </>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
};