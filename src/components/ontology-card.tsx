import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns } from "@/components/concept-builder/concept-columns";
import { ConceptTable } from "@/components/concept-builder/concept-table";
import { RelshipTable } from "@/components/concept-builder/relship-table";
import { ColumnDef } from "@tanstack/react-table";
import ReactMarkdown from 'react-markdown';
import 'tailwindcss/tailwind.css'; // Ensure Tailwind CSS is imported
// import '@fortawesome/fontawesome-free/css/all.min.css';
// import '@fortawesome/fontawesome-free/js/all.js';
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
    description: string;
    color?: string;
}

const debug = false;

export const OntologyCard = ({ ontologyData }: OntologyCardProps) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState('concepts'); // concepts, diagram
    const [regen, setRegen] = useState(true);

    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);

    if (debug) console.log('35 ontology-card', ontologyData);

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
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.shiftKey) {
                // Horizontal scroll with Shift key
                e.preventDefault();

                // Increase sensitivity for more noticeable movement
                const scrollAmount = e.deltaY * 2;

                // Direct scrollLeft modification (more reliable)
                container.scrollLeft += scrollAmount;

                console.log('Horizontal scroll', scrollAmount);
            } else if (isZoomMode) {
                // Zoom mode
                e.preventDefault();

                const zoomSensitivity = 0.1;
                if (e.deltaY < 0) {
                    setZoom((prev) => Math.min(prev + zoomSensitivity, 5));
                } else {
                    setZoom((prev) => Math.max(prev - zoomSensitivity, 0.5));
                }
            }
            // If neither condition is met, let the natural scrolling occur
        };

        // Add wheel event listener
        if (isZoomMode) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [isZoomMode, setZoom]);

    // Remove the external handleContainerWheel function since we now define it inside useEffect

    useEffect(() => {
        if (activeTab === 'diagram') {
            generateMermaidDiagram(true);
            setRegen(!regen);
            // Optional: reset zoom, or any other state changes
        }
    }, [activeTab, generateMermaidDiagram, regen]);

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
                        rough: false, // Enable rough visualization
                    },
                    securityLevel: 'loose', // Allow raw HTML if needed
                });
                mermaid.contentLoaded();
            } catch (error) {
                console.error('Error initializing Mermaid:', error);
            }
        }
    }, [mermaidDiagram]);

    const handleAuxClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 1) {
            setZoomMode((prev) => !prev);
            e.preventDefault();
        }
    };

    const renderMermaidDiagram = () => {
        if (mermaidDiagram) {
            return (
                <div
                    ref={diagramRef}
                    className="mermaid min-w-[1200px]" // Force a wider minimum width
                    style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: '0 0',
                        margin: '10px'
                    }}
                    onAuxClick={handleAuxClick}
                >
                    {mermaidDiagram}
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <div className="p-1 w-100 rounded overflow-hidden">
                <div className="bg-gray-700 px-1">
                    <h3 className="flex pl-1 font-bold  bg-gray-700 text-gray-00 inline-block">Domain name: <span className="mx-1 px-1 inline-block bg-background"> {ontologyData?.name}</span></h3>
                    <details>
                        <summary className="mx-1 text-gray-400 w-full cursor-pointe">Description...</summary>
                        <div className="mx-1 p-1 inline-block"> {ontologyData?.description}</div>
                    </details>
                </div>
                <div className="">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-gray-700 m-1">
                        <TabsList className="mx-1 mb-0 bg-gray-700">
                            <TabsTrigger value="summary" className='pb-2 mt-3'>Ontology Summary</TabsTrigger>
                            <TabsTrigger value="concepts" className='pb-2 mt-3'>Concept List</TabsTrigger>
                            <TabsTrigger value="relationships" className='pb-2 mt-3'>Relationship List</TabsTrigger>
                            <TabsTrigger value="diagram" className='pb-2 mt-3'>Ontology Map</TabsTrigger>
                        </TabsList>
                        <TabsContent value="summary" className="flex p-1 m-0 rounded bg-background  ">
                            <Card className="p-1 w-full border-gray-700 h-[calc(100vh-25rem)]">
                                {/* <CardHeader> */}
                                {/* <CardTitle className="bg-background px-2 m-0 font-bold">Short Summary </CardTitle> */}
                                {/* <div className="mx-2">{ontologyData?.description}</div> */}
                                {/* </CardHeader> */}
                                <CardContent>
                                    <div
                                        className="prose prose-sm bg-background p-2 divide-y divide-gray-600 max-h-[calc(100vh-26rem)] 
                                                overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"
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
                                    <CardTitle className="bg-background px-2 text-1xl rounded">Concepts</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-26rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                    {ontologyData && <ConceptTable data={ontologyData.concepts} />}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="relationships" className=" m-0 px-1 py-1 rounded bg-background">
                            <Card className="mt-1">
                                <CardHeader className="px-3 pt-3 pb-0">
                                    <CardTitle className="bg-background px-2 text-1xl rounded">Relations</CardTitle>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-26rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
                                    {ontologyData && <RelshipTable data={ontologyData.relationships} />}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="diagram" className="m-0 px-1 rounded bg-background h-[calc(100vh-22rem)] overflow-hidden">
                            <>
                                <div className="flex justify-between items-center mx-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                generateMermaidDiagram(!regen);
                                            }}
                                            className="px-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-700"
                                        >
                                            Show Mermaid Code
                                        </button>

                                        <button
                                            onClick={() => setZoomMode(prev => !prev)}
                                            className={`px-2 py-1 text-xs rounded ${isZoomMode
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-gray-200'}`}
                                        >
                                            {isZoomMode ? 'Zoom Mode: ON' : 'Zoom Mode: OFF'}
                                        </button>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-2 text-xs">Zoom</span>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2"
                                            step="0.1"
                                            value={zoom}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-32"
                                        />
                                    </div>
                                </div>
                                <Card className="w-full my-1">
                                    <div
                                        ref={containerRef}
                                        className="h-[calc(100vh-24rem)] overflow-auto bg-gray-600 rounded border relative"
                                        style={{
                                            maxWidth: '100%',
                                            overflowX: 'auto',  // Explicitly set horizontal overflow
                                        }}
                                    >
                                        <div className="text-xs text-gray-400 ml-2">
                                            {isZoomMode ? 'Use wheel to zoom' : 'Hold Shift+wheel for horizontal scrolling'}
                                        </div>
                                        <div className="min-w-max p-2">
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