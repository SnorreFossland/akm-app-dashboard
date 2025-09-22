import React, { useState, useEffect, useRef, useCallback } from 'react';
const mermaidRef = useRef<any>(null);
const diagramRef = useRef<HTMLDivElement | null>(null);
// import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';

import { ObjectTable } from "@/components/model-builder/object-table";
import { RelshipTable } from "@/components/model-builder/relship-table";
import { Model, Modelview } from '@/features/model-universe/modelSlice';

const debug = false;

// export const ObjectCard = ({ model }: { model: Model }) => {
export const ModelviewCard = ({ modelview }: { modelview: Modelview }) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [mermaidDiagram, setMermaidDiagram] = useState('');
    const [renderedSvg, setRenderedSvg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('objects');
    const [zoom, setZoom] = useState(1);
    const [isZoomMode, setZoomMode] = useState(false);

    // console.log('24 model:', model);

    // Initialize Mermaid once
    useEffect(() => {
        let cancelled = false;
        if (typeof window === 'undefined') return;

        (async () => {
            try {
                const mm = await import('mermaid');
                // some bundlers put the module on default export
                mermaidRef.current = mm.default || mm;
                mermaidRef.current.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: {
                        primaryColor: '#97e499ff',
                        edgeLabelBackground: '#21313c15',
                        secondaryColor: '#8888ff',
                        tertiaryColor: '#dddddd',
                        primaryTextColor: '#ffffff',
                        secondaryTextColor: '#ccffcc',
                        tertiaryTextColor: '#0000ff',
                        lineColor: '#dddddd',
                        background: '#ffffff',
                        nodeBorderRadius: '5px',
                    },
                    securityLevel: 'loose',
                });
            } catch (e) {
                console.error('Failed to load mermaid dynamically:', e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // Memoize the diagram generation to prevent infinite loops
    const generateMermaidDiagram = useCallback(() => {
        if (!modelview || !modelview.objectviews || modelview.objectviews.length === 0) {
            setMermaidDiagram('');
            setRenderedSvg('');
            return;
        }

        try {
            let diagram = 'graph TD;\n';
            const validNodes = new Set();
            // Add objects as nodes with better sanitization
            modelview.objectviews.forEach((objectview: { name: string }, index: number) => {
                if (objectview && objectview.name && objectview.name.trim()) {
                    const nodeId = objectview.name
                        .replace(/[^a-zA-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') || `object_${index}`;
                    const nodeName = objectview.name.replace(/"/g, "'");
                    diagram += `    ${nodeId}["${nodeName}"];\n`;
                    validNodes.add(objectview.name);
                }
            });

            // Add explicit styling for all nodes
            modelview.objectviews.forEach((objectview: { name: string }, index: number) => {
                if (objectview && objectview.name && objectview.name.trim()) {
                    const nodeId = objectview.name
                        .replace(/[^a-zA-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') || `object_${index}`;

                    // Add CSS styling for each node
                    diagram += `    style ${nodeId} fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff;\n`;
                }
            });

            // Add relationships as edges only for valid nodes
            if (modelview.relshipviews && modelview.relshipviews.length > 0) {
                modelview.relshipviews.forEach((relshipview, index: number) => {
                    if (relshipview && relshipview.fromobjviewRef && relshipview.toobjviewRef && relshipview.name &&
                        validNodes.has(relshipview.fromobjviewRef) && validNodes.has(relshipview.toobjviewRef)) {

                        const fromId = relshipview.fromobjviewRef
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '') || `from_${index}`;

                        const toId = relshipview.toobjviewRef
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '') || `to_${index}`;

                        const relationName = relshipview.name.replace(/"/g, "'");
                        diagram += `    ${fromId} -->|"${relationName}"| ${toId};\n`;
                    }
                });
            }

            // console.log('Generated Mermaid diagram:', diagram);
            setMermaidDiagram(diagram);

        } catch (error) {
            console.error('Error generating Mermaid diagram:', error);
            setMermaidDiagram('');
            setRenderedSvg('');
        }
    }, [modelview]);

    // Generate diagram when model changes or when switching to diagram tab
    useEffect(() => {
        if (activeTab === 'diagram' || modelview) {
            generateMermaidDiagram();
        }
    }, [modelview, activeTab, generateMermaidDiagram]);

    // Render the diagram when mermaidDiagram changes
    useEffect(() => {
        const renderDiagram = async () => {
            if (mermaidDiagram && activeTab === 'diagram') {
                setIsLoading(true);
                try {
                    // Generate unique ID for this diagram
                    const diagramId = `mermaid-diagram-${Date.now()}`;

                    // Use dynamically loaded mermaid module from the ref
                    const mm = mermaidRef.current;
                    if (!mm) {
                        console.warn('Mermaid not yet loaded; delaying render');
                        setIsLoading(false);
                        return;
                    }

                    const { svg } = await mm.render(diagramId, mermaidDiagram);

                    // Store the rendered SVG
                    setRenderedSvg(svg);
                    console.log('Mermaid diagram rendered successfully');

                } catch (error) {
                    console.error('Error rendering Mermaid diagram:', error);
                    setRenderedSvg(`<div class="p-4 text-center text-red-400">Error rendering diagram: ${error}</div>`);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        renderDiagram();
    }, [mermaidDiagram, activeTab]);

    // Zoom and scroll handling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.shiftKey) {
                e.preventDefault();
                const scrollAmount = e.deltaY * 2;
                container.scrollLeft += scrollAmount;
                console.log('Horizontal scroll', scrollAmount);
            } else if (isZoomMode) {
                e.preventDefault();
                const zoomSensitivity = 0.1;
                if (e.deltaY < 0) {
                    setZoom((prev) => Math.min(prev + zoomSensitivity, 5));
                } else {
                    setZoom((prev) => Math.max(prev - zoomSensitivity, 0.5));
                }
            }
        };

        if (isZoomMode) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [isZoomMode]);

    const handleAuxClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 1) {
            setZoomMode((prev) => !prev);
            e.preventDefault();
        }
    };

    const renderMermaidDiagram = () => {
        if (isLoading) {
            return <div className="p-4 text-center text-gray-400">Loading diagram...</div>;
        }

        if (renderedSvg) {
            return (
                <div
                    className="min-w-[1200px] w-full"
                    style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: '0 0',
                        margin: '10px'
                    }}
                    onAuxClick={handleAuxClick}
                    dangerouslySetInnerHTML={{ __html: renderedSvg }}
                />
            );
        }

        return <div className="p-4 text-center text-gray-400">No diagram data available</div>;
    };

    return (
        <div className="w-full">
            <div className="w-full h-[calc(100vh-10rem)] overflow-hidden bg-gray-800 rounded-md">
                <Tabs defaultValue="objects" value={activeTab} onValueChange={setActiveTab} className="flex flex-col mt-1 h-full">
                    <TabsList className="bg-transparent">
                        <TabsTrigger
                            value="objects"
                            className="rounded-b-none mt-0 data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20"
                        >
                            Objectviews
                        </TabsTrigger>
                        <TabsTrigger
                            value="relationships"
                            className="rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20"
                        >
                            Relationshipviews
                        </TabsTrigger>
                        <TabsTrigger value="diagram" className="rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20">
                            Preview Diagram
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="objects" className="rounded  w-full mt-0 ">
                        <Card className="pt-1">
                            <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                {/* <CardContent className="max-h-[calc(100vh-9rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800"> */}
                                {modelview && <ObjectTable data={modelview.objectviews.map((objview: any) => ({
                                    ...objview
                                }))} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="relationships" className="rounded  w-full mt-0 ">
                        <Card className="pt-1">
                            <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                                {modelview && <RelshipTable data={(modelview.relshipviews || []).map((relview: any) => ({
                                    ...relview,
                                    nameFrom: relview.nameFrom ? relview.nameFrom : relview.fromrelviewRef,
                                    nameTo: relview.nameTo ? relview.nameTo : relview.torelviewRef
                                }))} />}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="diagram" className="rounded  w-full mt-0 ">
                        <Card className="w-full h-full">
                            <CardContent className="">
                                <div className="flex justify-between items-center m-1 py-1">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => generateMermaidDiagram()}
                                            className="px-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-500"
                                        >
                                            Regenerate Diagram
                                        </button>

                                        <button
                                            onClick={() => setZoomMode(prev => !prev)}
                                            className={`px-1 text-xs rounded hover:bg-gray-400 ${isZoomMode
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
                                <div
                                    ref={containerRef}
                                    className="h-[calc(100vh-13rem)] overflow-auto bg-background rounded border relative"
                                    style={{
                                        maxWidth: '100%',
                                        overflowX: 'auto',
                                    }}
                                >
                                    <div className="text-xs text-gray-400 ml-2">
                                        {isZoomMode ? 'Use wheel to zoom' : 'Hold Shift+wheel for horizontal scrolling'}
                                    </div>
                                    <div className="min-w-max p-2 w-full">
                                        {renderMermaidDiagram()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    );
};

// import React, { useState, useEffect, useRef } from 'react';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// type modelview = Modelview[];

// interface Modelview {
//     name: string;
//     description: string;
//     objectviews: Objectviews[];
//     relshipviews: Relshipviews[];
// }

// interface Objectviews {
//     id: string;
//     name: string;
//     description: string;
//     typeName: string;
//     loc: string;
//     objectRef: string;
// }

// interface Relshipviews {
//     id: string;
//     name: string;
//     relshipRef: string;
//     fromobjviewRef: string;
//     toobjviewRef: string;
//     points: number[];
// }
// const debug = false;
// export const ModelviewCard = ({ modelview }: { modelview: modelview }) => {
//     const diagramRef = useRef<HTMLDivElement>(null);
//     const [mermaidDiagram, setMermaidDiagram] = useState('');
//     const [activeTab, setActiveTab] = useState('object-views');
//     const [regen, setRegen] = useState(false);


//     // if (!modelview) {
//     //     return null;
//     // }   

//     // Log only when the prop actually changes (not on every render)
//     useEffect(() => {
//         if (debug) {
//             console.log('ModelviewCard modelview changed:', modelview);
//         }
//     }, [modelview]);

//     const generateMermaidDiagram = (regen: boolean) => {
//         let diagram = (regen) ? 'graph TD;\n' : 'graph TD;\n\n';
//         // Add objects
//         modelview[0].objectviews.forEach((ov: Objectviews) => {
//             diagram += `${ov.id}["${ov.name} \n (${ov.typeName})"];\n`;
//         });
//         // Add relationships
//         modelview[0].relshipviews.forEach((rv: Relshipviews) => {
//             diagram += `${rv.fromobjviewRef} -->|${rv.name}| ${rv.toobjviewRef};\n`;
//         });
//         setMermaidDiagram(diagram);
//         // diagramRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };

//     const mermaidRef = useRef<any>(null);

//     useEffect(() => {
//         let cancelled = false;
//         (async () => {
//             try {
//                 const m = await import('mermaid');
//                 const mm = (m as any).default ?? m;
//                 if (cancelled) return;
//                 mermaidRef.current = mm;
//                 mm.initialize({
//                     startOnLoad: true,
//                     theme: 'base',
//                     themeVariables: {
//                         primaryColor: '#667777',
//                         edgeLabelBackground: '#33557700',
//                         secondaryColor: '#8888ff',
//                         tertiaryColor: '#ddddff',
//                         primaryTextColor: '#ffdddd',
//                         secondaryTextColor: '#00ff00',
//                         tertiaryTextColor: '#0000ff',
//                         lineColor: '#dddddd',
//                         background: '#ffffff',
//                         nodeBorderRadius: '15px',
//                     },
//                 });
//                 if (diagramRef.current && mermaidDiagram) {
//                     mm.contentLoaded();
//                 }
//             } catch (e) {
//                 console.error('Failed to load mermaid:', e);
//             }
//         })();
//         return () => { cancelled = true; };
//     }, []);

//     useEffect(() => {
//         const mm = mermaidRef.current;
//         if (mm && mermaidDiagram && diagramRef.current) {
//             try {
//                 mm.contentLoaded();
//             } catch {}
//         }
//     }, [mermaidDiagram]);

//     const renderMermaidDiagram = () => {
//         if (mermaidDiagram) {
//             return <div ref={diagramRef} className="mermaid">{mermaidDiagram}</div>;
//         }
//         return null;
//     };

//     return (
//         <div className="w-100 max-h-[calc(100vh-7.5rem)] overflow-hidden">
//             <div className="w-100 m-auto">
//                 <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-gray-700 mb-0 pb-1">
//                     <TabsList className="m-1 mb-0 bg-transparent">
//                         <TabsTrigger value="object-views" className='pb-2 mt-2'>Objectviews & Relshipviews</TabsTrigger>
//                         <TabsTrigger value="diagram" className='pb-2 mt-2'>Preview Modelview </TabsTrigger>
//                     </TabsList>
//                     <TabsContent value="object-views" className='p-1 my-0 py-0 rounded'>
//                         <div className='my-0 py-0' style={{ backgroundColor: 'hsl(200, 50%, 16%)' }}>
//                             <div className="mx-1 pt-2 w-full">
//                                 {modelview && modelview[0] ? (
//                                     <>
//                                         Modelview: {modelview[0].name} Descr: {modelview[0].description}
//                                     </>
//                                 ) : (
//                                     "No modelview available"
//                                 )}
//                             </div>
//                             <div className="flex space-x-4">
//                                 <Card className="w-full">
//                                     <CardHeader>
//                                         <CardTitle className="bg-background px-2 m-0 text-1xl font-bold">Objectviews</CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="grid gap-6k">
//                                         <table className=" divide-y divide-gray-700 text-sm w-full">
//                                             <thead className="bg-background sticky top-0">
//                                                 <tr>
//                                                     <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider w-full">Name</th>
//                                                     <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">TypeName</th>
//                                                     <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Loc</th>
//                                                 </tr>
//                                             </thead>
//                                             {/* <tbody>
//                                                 <tr>
//                                                     <td colSpan={3}> */}
//                                             <tbody className="bg-gray-900 divide-y divide-gray-700">
//                                                 {modelview && modelview[0]?.objectviews?.map((ov) => (
//                                                     <tr key={ov.id}>
//                                                         <td className="px-4 py-2 whitespace-nowrap text-gray-300 w-full">{ov.name}</td>
//                                                         <td className="px-4 py-2 whitespace-nowrap text-gray-300 ">{ov.typeName}</td>
//                                                         <td className="px-4 py-2 whitespace-nowrap text-gray-300 ">{ov.loc}</td>
//                                                     </tr>
//                                                 ))}

//                                             </tbody>
//                                             {/* </td>
//                                                 </tr>
//                                             </tbody>  */}
//                                         </table>
//                                     </CardContent>
//                                 </Card>
//                                 <Card className="w-full max-h-[48rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
//                                     <CardHeader>
//                                         <CardTitle className="bg-background px-2 m-0 text-1xl font-bold">Relationshipviews</CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="grid gap-6k">
//                                         <div className="max-h-96 overflow-auto">
//                                             <div className="overflow-auto max-h-96">
//                                                 <table className="min-w-full divide-y divide-gray-700 text-sm">
//                                                     <thead className="bg-background sticky top-0">
//                                                         <tr>
//                                                             {/* <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">From</th> */}
//                                                             <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Relationship</th>
//                                                             {/* <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">To</th> */}
//                                                         </tr>
//                                                     </thead>
//                                                     <tbody className="bg-gray-900 divide-y divide-gray-700">
//                                                         {modelview && modelview[0] && modelview[0]?.relshipviews?.map((rv) => (
//                                                             <tr key={rv.id}>
//                                                                 {/* <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rv.fromobjviewRef}</td> */}
//                                                                 <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rv.name}</td>
//                                                                 {/* <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rv.toobjviewRef}</td> */}
//                                                                 {/* <td className="px-4 py-2 whitespace-nowrap text-gray-300">{modelview[0].objectviews.find(ov => ov.id === rv.fromobjviewRef) && ov?.name}</td>
//                                                                 <td className="px-4 py-2 whitespace-nowrap text-gray-300">{rv.name}</td>
//                                                                 <td className="px-4 py-2 whitespace-nowrap text-gray-300">{modelview[0].objectviews.find(ov => ov.id === rv.toobjviewRef) && ov?.name}</td> */}
//                                                             </tr>
//                                                         ))}
//                                                     </tbody>
//                                                 </table>
//                                             </div>
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             </div>
//                         </div>
//                     </TabsContent>
//                     <TabsContent value="diagram" className='p-1 my-0 py-0 rounded'>
//                         <div className='my-0 py-0' style={{ backgroundColor: 'hsl(200, 50%, 16%)' }}>
//                             <div className="flex justify-end pb-1 py-0 mx-2">
//                                 <button
//                                     onClick={() => {
//                                         generateMermaidDiagram(!regen);
//                                         setRegen(!regen);
//                                     }}
//                                     className="mt-1 px-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-700"
//                                 >
//                                     Regenerate Diagram
//                                 </button>
//                             </div>
//                             <Card className="w-full h-full my-1">
//                                 <div className='overflow-auto min-h-[48rem] h-full'>
//                                     {renderMermaidDiagram()}
//                                 </div>
//                                 {/* {mermaidDiagram && (
//                                 <div id="mermaid-code">
//                                     <pre className="bg-background text-white p-4 rounded">
//                                         {mermaidDiagram}
//                                     </pre>
//                                 </div>
//                             )} */}
//                             </Card>
//                         </div>
//                     </TabsContent>
//                 </Tabs>
//             </div>
//         </div>
//     );
// };
