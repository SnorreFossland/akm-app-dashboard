import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Term {
    name: string;
    description: string;
}
interface Relationship {
    name: string;
    nameFrom: string;
    nameTo: string;
}
interface OntologyCardProps {
    terms: {
        objects: Term[];
        relationships: Relationship[];
    };
}

export const OntologyCard = ({ terms }: OntologyCardProps) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');

    const [activeTab, setActiveTab] = useState('terms');
    const [regen, setRegen] = useState(false);

    const generateMermaidDiagram = useCallback((regen: boolean) => {
        let diagram = (regen) ? 'graph TD;\n' : 'graph TD;\n\n';
        terms?.objects.forEach((object) => {
            diagram += `${object.name.replace(/\s+/g, '_')}["${object.name}"];\n`;
        });
        terms?.relationships.forEach((r) => {
            diagram += `${r.nameFrom.replace(/\s+/g, '_')} -->|${r.name.replace(/\s+/g, '_')}| ${r.nameTo.replace(/\s+/g, '_')};\n`;
        });
        setMermaidDiagram(diagram);
    }, [terms]);

    useEffect(() => {
        if (mermaidDiagram && diagramRef.current) {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'base',
                themeVariables: {
                    primaryColor: '#667777',
                    edgeLabelBackground: '#22557715',
                    secondaryColor: '#8888ff',
                    tertiaryColor: '#ddddff',
                    primaryTextColor: '#ffdddd',
                    secondaryTextColor: '#00ff00',
                    tertiaryTextColor: '#0000ff',
                    lineColor: '#dddddd',
                    background: '#ffffff',
                    nodeBorderRadius: '25px',
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
        <>
            <div className="w-100 max-h-[calc(100vh-16rem)] overflow-hidden">
                <div className="">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="terms">Terms & Relations</TabsTrigger>
                            <TabsTrigger value="diagram">Diagram</TabsTrigger>
                        </TabsList>
                        <TabsContent value="terms" className="flex flex-row space-x-1 max-h-[calc(100vh-16rem)]">
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Terms</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6k">
                                    <table className="divide-y divide-gray-700 text-sm w-full">
                                        <thead className="w-full bg-gray-800 sticky top-0">
                                            <tr className="w-full">
                                                <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-2 text-center font-medium text-gray-300 uppercase tracking-wider">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan={3}>
                                                    <div className="bg-gray-800 divide-y divide-gray-700 w-full max-h-[calc(82vh-18rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                                        <table className="min-w-full divide-y divide-gray-700 text-sm w-full">
                                                            <tbody className="bg-gray-900 divide-y divide-gray-700 min-w-full w-full">
                                                                {terms?.objects?.map((term, index) => (
                                                                    <tr key={term.name + index} className="w-full">
                                                                        <td className="px-4 py-2 text-left whitespace-nowrap text-gray-300">{term.name}</td>
                                                                        <td className="px-4 py-2 text-left text-gray-300 min-w-full">{term.description}</td>
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
                                    <CardTitle className="bg-gray-800 px-2 m-0 text-1xl font-bold">Relations</CardTitle>
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
                                                {terms?.relationships?.map((rel, index) => (
                                                    <tr key={rel.name + index}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rel.nameFrom}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rel.name}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rel.nameTo}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
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
                                    <div className='overflow-auto min-h-[48rem] h-full'>
                                        {renderMermaidDiagram()}
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
};