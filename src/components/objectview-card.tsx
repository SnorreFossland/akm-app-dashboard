import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectTable } from "@/components/model-builder/object-table";
import { RelshipTable } from "@/components/model-builder/relship-table";
import { Modelview } from '@/features/model-universe/modelSlice';

// A card to preview Modelview objectviews and relshipviews using tables and a simple diagram
export const ObjectviewCard = ({ modelview }: { modelview: Modelview }) => {
  const [activeTab, setActiveTab] = useState('objects');
  const [mermaidDiagram, setMermaidDiagram] = useState('');
  const [renderedSvg, setRenderedSvg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isZoomMode, setZoomMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
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
  }, []);

  const generateMermaidDiagram = useCallback(() => {
    if (!modelview || !modelview.objectviews || modelview.objectviews.length === 0) {
      setMermaidDiagram('');
      setRenderedSvg('');
      return;
    }

    try {
      let diagram = 'graph TD;\n';
      const validNodes = new Set<string>();

      modelview.objectviews.forEach((ov, index) => {
        if (ov && ov.name && ov.name.trim()) {
          const nodeId = ov.name
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') || `object_${index}`;
          const nodeName = ov.name.replace(/\"/g, "'");
          diagram += `    ${nodeId}[\"${nodeName}\"];\n`;
          validNodes.add(ov.name);
        }
      });

      modelview.objectviews.forEach((ov, index) => {
        if (ov && ov.name && ov.name.trim()) {
          const nodeId = ov.name
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') || `object_${index}`;
          diagram += `    style ${nodeId} fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff;\n`;
        }
      });

      if (modelview.relshipviews && modelview.relshipviews.length > 0) {
        modelview.relshipviews.forEach((rv, index) => {
          if (rv && rv.fromobjviewRef && rv.toobjviewRef && rv.name &&
            validNodes.has(rv.fromobjviewRef) && validNodes.has(rv.toobjviewRef)) {
            const fromId = rv.fromobjviewRef
              .replace(/[^a-zA-Z0-9]/g, '_')
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '') || `from_${index}`;

            const toId = rv.toobjviewRef
              .replace(/[^a-zA-Z0-9]/g, '_')
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '') || `to_${index}`;

            const relationName = rv.name.replace(/\"/g, "'");
            diagram += `    ${fromId} -->|\"${relationName}\"| ${toId};\n`;
          }
        });
      }

      setMermaidDiagram(diagram);
    } catch (e) {
      setMermaidDiagram('');
      setRenderedSvg('');
    }
  }, [modelview]);

  useEffect(() => {
    if (activeTab === 'diagram') {
      generateMermaidDiagram();
    }
  }, [activeTab, generateMermaidDiagram]);

  useEffect(() => {
    const render = async () => {
      if (!mermaidDiagram || activeTab !== 'diagram') return;
      setIsLoading(true);
      try {
        const id = 'objectview-diagram-' + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, mermaidDiagram);
        setRenderedSvg(svg);
      } catch (err: any) {
        setRenderedSvg(`<div class=\"p-4 text-center text-red-400\">Error rendering diagram: ${err?.message || String(err)}<\/div>`);
      } finally {
        setIsLoading(false);
      }
    };
    render();
  }, [mermaidDiagram, activeTab]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 2;
      } else if (isZoomMode) {
        e.preventDefault();
        const s = 0.1;
        setZoom((prev) => (e.deltaY < 0 ? Math.min(prev + s, 5) : Math.max(prev - s, 0.5)));
      }
    };
    if (isZoomMode) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isZoomMode]);

  const renderMermaid = () => {
    if (isLoading) return <div className="p-4 text-center text-gray-400">Loading diagram...</div>;
    if (renderedSvg) {
      return (
        <div
          className="min-w-[1200px] w-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', margin: '10px' }}
          dangerouslySetInnerHTML={{ __html: renderedSvg }}
        />
      );
    }
    return <div className="p-4 text-center text-gray-400">No diagram data available</div>;
  };

  return (
    <div className="w-full">
      <div className="w-full h-[calc(100vh-10rem)] overflow-hidden bg-gray-800 rounded-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col mt-1 h-full">
          <TabsList className="bg-transparent">
            <TabsTrigger value="objects" className="rounded-b-none mt-0 data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20">
              Objectview List
            </TabsTrigger>
            <TabsTrigger value="relationships" className="rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold  data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20">
              Relshipview List
            </TabsTrigger>
            <TabsTrigger value="diagram" className="rounded-b-none data-[state=active]:bg-card data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-gray-300 data-[state=inactive]:text-gray-100 py-2 px-4 border-gray-400 relative z-20">
              Preview Diagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="objects" className="rounded w-full mt-0">
            <Card className="pt-1">
              <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                {modelview && (
                  <ObjectTable
                    data={(modelview.objectviews || []).map((ov: any) => ({
                      id: ov.id,
                      name: ov.name,
                      description: ov.description || '',
                      color: '',
                      typeName: ov.typeName || '',
                      // extra fields used by ObjectTable
                      typeId: ov.objectRef || '',
                      proposedType: '',
                    }))}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relationships" className="rounded w-full mt-0">
            <Card className="pt-1">
              <CardContent className="max-h-[calc(100vh-14rem)] overflow-hidden">
                {modelview && (
                  <RelshipTable
                    data={(modelview.relshipviews || []).map((rv: any) => ({
                      id: rv.id,
                      name: rv.name,
                      description: '',
                      color: '',
                      nameFrom: rv.fromobjviewRef,
                      nameTo: rv.toobjviewRef,
                    }))}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagram" className="rounded w-full mt-0">
            <Card className="w-full h-full">
              <CardContent>
                <div className="flex justify-between items-center m-1 py-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => generateMermaidDiagram()} className="px-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-500">
                      Regenerate Diagram
                    </button>
                    <button onClick={() => setZoomMode((prev) => !prev)} className={`px-1 text-xs rounded hover:bg-gray-400 ${isZoomMode ? 'bg-green-500 text-white' : 'bg-gray-500 text-gray-200'}`}>
                      {isZoomMode ? 'Zoom Mode: ON' : 'Zoom Mode: OFF'}
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-xs">Zoom</span>
                    <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-32" />
                  </div>
                </div>
                <div ref={containerRef} className="h-[calc(100vh-13rem)] overflow-auto bg-background rounded border relative" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                  <div className="text-xs text-gray-400 ml-2">{isZoomMode ? 'Use wheel to zoom' : 'Hold Shift+wheel for horizontal scrolling'}</div>
                  <div className="min-w-max p-2 w-full">{renderMermaid()}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ObjectviewCard;

