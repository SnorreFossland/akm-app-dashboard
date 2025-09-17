"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Concept = { name: string; description?: string };
type Relationship = { name: string; nameFrom: string; nameTo: string; description?: string };

export function OntologyGraph({
  ontology,
  baseline,
  className = ''
}: {
  ontology: { concepts: Concept[]; relationships: Relationship[] } | null;
  baseline?: { concepts: Concept[]; relationships: Relationship[] } | null;
  className?: string;
}) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [mmLoaded, setMmLoaded] = useState<any>(null);

  const mermaidDiagram = useMemo(() => {
    if (!ontology) return '';
    const allNodes = new Set<string>();
    (ontology.concepts || []).forEach((c) => c?.name && allNodes.add(c.name));
    (ontology.relationships || []).forEach((r) => {
      if (r?.nameFrom) allNodes.add(r.nameFrom);
      if (r?.nameTo) allNodes.add(r.nameTo);
    });
    if (allNodes.size === 0) return '';

    const baseConcepts = new Set<string>((baseline?.concepts || []).map(c => (c?.name || '').trim().toLowerCase()));
    const baseRels = new Set<string>((baseline?.relationships || []).map(r => `${(r?.name||'').trim().toLowerCase()}|${(r?.nameFrom||'').trim().toLowerCase()}|${(r?.nameTo||'').trim().toLowerCase()}`));

    let dsl = 'graph TD;\n';
    allNodes.forEach((n) => {
      if (!n?.trim()) return;
      const id = n.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const label = n.replace(/\"/g, "'");
      dsl += `    ${id}[\"${label}\"];\n`;
      if (!baseConcepts.has(n.trim().toLowerCase())) {
        dsl += `    class ${id} new;\n`;
      }
    });

    let edgeIndex = 0;
    (ontology.relationships || []).forEach((rel) => {
      if (!rel?.name || !rel?.nameFrom || !rel?.nameTo) return;
      const fromId = rel.nameFrom.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || `from_${edgeIndex}`;
      const toId = rel.nameTo.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || `to_${edgeIndex}`;
      const label = rel.name.replace(/\"/g, "'");
      dsl += `    ${fromId} -->|\"${label}\"| ${toId};\n`;
      const key = `${rel.name.trim().toLowerCase()}|${rel.nameFrom.trim().toLowerCase()}|${rel.nameTo.trim().toLowerCase()}`;
      if (!baseRels.has(key)) {
        dsl += `    linkStyle ${edgeIndex} stroke:#22c55e,stroke-width:2px,opacity:0.9;\n`;
      }
      edgeIndex += 1;
    });

    dsl += `    classDef new fill:#064e3b,stroke:#22c55e,color:#e2e8f0,stroke-width:2px;\n`;
    return dsl;
  }, [ontology, baseline]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const m = await import('mermaid');
        const mm = (m as any).default ?? m;
        if (canceled) return;
        mm.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
        setMmLoaded(mm);
      } catch (e) {
        console.error('Mermaid load failed', e);
      }
    })();
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    if (!mmLoaded || !mermaidDiagram || !diagramRef.current) return;
    try {
      diagramRef.current.innerHTML = mermaidDiagram;
      mmLoaded.contentLoaded();
    } catch (e) {
      console.error('Mermaid render failed', e);
    }
  }, [mmLoaded, mermaidDiagram]);

  if (!ontology) return <div className={className}>No ontology</div>;

  return (
    <div className={className}>
      <div ref={diagramRef} className="mermaid min-w-[800px]" />
    </div>
  );
}

