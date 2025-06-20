import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';

import { ObjectTable } from "@/components/model-builder/object-table";
import { RelshipTable } from "@/components/model-builder/relship-table";
import { Model } from '@/features/model-universe/modelSlice';


// export interface Model {
//     id: string;
//     name: string;
//     description: string;
//     metamodelRef: string,
//     objects: {
//         id: string,
//         name: string,
//         description: string,
//         proposedType: string,
//         typeRef: string,
//         typeName: string,
//         category: string,
//     }[],
//     relships: {
//         id: string,
//         name: string,
//         typeRef: string,
//         fromobjectRef: string,
//         nameFrom: string,
//         toobjectRef: string,
//         nameTo: string,
//     }[],
//     modelviews: {
//         id: string,
//         name: string,
//         description: string,
//         modelRef: string,
//         modified: boolean,
//         markedAsDeleted: boolean,
//         objectviews: {
//             id: string,
//             name: string,
//             type: string,
//             loc: string,
//             size: string,
//             memberscale: number,
//             objectRef: string,
//             modified: boolean,
//             markedAsDeleted: boolean,
//             isSelect: boolean,
//             isGroup: boolean,
//             isExpanded: boolean,
//             image: string,
//             icon: string,
//             fillColor: string,
//             strokeColor: string,
//             strokeWidth: string,
//             strokeColor2: string,
//             textColor: string,
//             textColor2: string,
//             viewkind: string,
//         }[],
//         relshipviews: {
//             id: string,
//             name: string,
//             relshipRef: string,
//             fromobjviewRef: string,
//             toobjviewRef: string,
//             points: number[],
//         }[],
//     }[],
// }

const debug = false;

export const ObjectCard = ({ model }: { model: Model }) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    // const [mermaidCode, setMermaidCode] = useState('');
    // const [showObjectsCard, setShowObjectsCard] = useState(true);
    // const [showDiagram, setShowDiagram] = useState(false);
    const [activeTab, setActiveTab] = useState('objects');
    const [regen, setRegen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);
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
    // Memoize the diagram generation to prevent infinite loops
    const generateMermaidDiagram = useCallback(() => {
        if (!model) {
            setMermaidDiagram('');
            return;
        }

        try {
            let diagram = 'graph TD;\n';
            const validNodes = new Set();


            model.objects.forEach((object, index) => {
                if (object && object.name && object.name.trim()) {
                    // Create a more robust node ID
                    const nodeId = object.name
                        .replace(/[^a-zA-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') || `concept_${index}`;

                    const nodeName = object.name.replace(/"/g, "'"); // Escape quotes
                    diagram += `    ${nodeId}["${nodeName}"];\n`;
                    validNodes.add(object.name);
                }
            });

            // Add relationships as edges only for valid nodes
            if (model.relships && model.relships.length > 0) {
                model.relships.forEach((rel, index) => {
                    if (rel && rel.nameFrom && rel.nameTo && rel.name &&
                        validNodes.has(rel.nameFrom) && validNodes.has(rel.nameTo)) {

                        const fromId = rel.nameFrom
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '') || `from_${index}`;

                        const toId = rel.nameTo
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '') || `to_${index}`;

                        const relationName = rel.name.replace(/"/g, "'"); // Escape quotes
                        diagram += `    ${fromId} -->|"${relationName}"| ${toId};\n`;
                    }
                });
            }

            console.log('Generated Mermaid diagram:', diagram);
            setMermaidDiagram(diagram);

        } catch (error) {
            console.error('Error generating Mermaid diagram:', error);
            setMermaidDiagram('');
        }
    }, [model]);


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
                    className="mermaid min-w-[1200px]"
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
        return <div className="p-4 text-center text-gray-400">No diagram data available</div>;
    };

    return (
        <div className="w-full">
            <div className="w-full h-[calc(100vh-10rem)] overflow-hidden bg-gray-800 rounded-md">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-gray-700 mb-0 w-full text-xs">
                    <TabsList className="m-1 mb-0 bg-transparent rounded-t-md flex space-x-1 border-b-0 border-gray-600">
                        <TabsTrigger value="objects" className='pb-2 mt-2 rounded-t-md'>Object List</TabsTrigger>
                        <TabsTrigger value="relationships" className='pb-2 mt-2 rounded-t-md'>Relationship List</TabsTrigger>
                        <TabsTrigger value="diagram" className='pb-2 mt-2'>Preview Diagram</TabsTrigger>
                    </TabsList>

                    <TabsContent value="objects" className="rounded bg-background w-full">
                        <Card className="mx-1 mt-2">
                            {/* <CardHeader className="px-3 pt-3 pb-0">
                                <CardTitle className="bg-background px-2 text-1xl rounded">Concepts</CardTitle>
                            </CardHeader> */}
                            <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                            {/* <CardContent className="max-h-[calc(100vh-9rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"> */}
                                {model && <ObjectTable data={model.objects} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="relationships" className="m-0 px-1 py-1 rounded bg-background h-[calc(100vh-22rem)]">
                        <Card className="mt-1">
                            {/* <CardHeader className="px-3 pt-3 pb-0">
                                <CardTitle className="bg-background px-2 text-1xl rounded">Relations</CardTitle>
                            </CardHeader> */}
                            <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                {model && <RelshipTable data={model.relships.map(rel => ({ ...rel, description: '' }))} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="diagram" className="m-0 px-1 rounded bg-background h-[calc(100vh-14rem)] overflow-auto">
                        <div>
                            <div className="flex justify-between items-center mx-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => generateMermaidDiagram()}
                                        className="px-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        Regenerate Diagram
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
                                    className="h-[calc(100vh-18rem)] overflow-auto bg-gray-600 rounded border relative"
                                    style={{
                                        maxWidth: '100%',
                                        overflowX: 'auto',
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
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};