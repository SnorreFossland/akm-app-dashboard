"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Concept = { name: string; description?: string };
type Relationship = { name: string; nameFrom: string; nameTo: string; description?: string };

export function OntologyGraph({
  ontology,
  baseline,
  className = '',
  onSelectConcept,
  onSelectRelationship,
  selectedConcept,
  selectedRelationship,
  selectedConcepts,
  selectedRelationships,
  filterMode = 'all',
  enableZoomPan = false,
  initialScale = 1,
  autoFitOnResize = false,
  enableLasso = false,
  fitTrigger,
}: {
  ontology: { concepts: Concept[]; relationships: Relationship[] } | null;
  baseline?: { concepts: Concept[]; relationships: Relationship[] } | null;
  className?: string;
  onSelectConcept?: (conceptName: string) => void;
  onSelectRelationship?: (rel: { name: string; nameFrom: string; nameTo: string }) => void;
  selectedConcept?: string | null;
  selectedRelationship?: { name: string; nameFrom: string; nameTo: string } | null;
  selectedConcepts?: string[] | null;
  selectedRelationships?: Array<{ name: string; nameFrom: string; nameTo: string }> | null;
  filterMode?: 'all' | 'newOnly' | 'changedOnly';
  enableZoomPan?: boolean;
  initialScale?: number;
  autoFitOnResize?: boolean;
  enableLasso?: boolean;
  // When this value changes, graph will auto-fit after render
  fitTrigger?: number;
}) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [mmLoaded, setMmLoaded] = useState<any>(null);
  const instanceIdRef = useRef<string>(`ogc_${Math.random().toString(36).slice(2, 8)}`);
  
  // Keep a mapping from node id -> original concept name for this instance
  const nodeIdToNameRef = useRef<Record<string, string>>({});
  const relIndexToRelRef = useRef<Array<{ name: string; nameFrom: string; nameTo: string }>>([]);
  // Internal selection to support visual highlighting, can be controlled by parent via props
  const [internalSelectedConcept, setInternalSelectedConcept] = useState<string | null>(null);
  const [internalSelectedRelIndex, setInternalSelectedRelIndex] = useState<number | null>(null);

  // Zoom state (client-only)
  const [scale, setScale] = useState<number>(initialScale || 1);
  const userAdjustedRef = useRef<boolean>(false);
  const kbModeRef = useRef<'concept' | 'relationship'>('concept');
  const conceptOrderRef = useRef<string[]>([]);
  const relOrderRef = useRef<Array<{ name: string; nameFrom: string; nameTo: string }>>([]);
  const [lasso, setLasso] = useState<{ active: boolean; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const lassoRef = useRef<{ active: boolean; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const lassoRAFRef = useRef<number | null>(null);

  const mermaidDiagram = useMemo(() => {
    if (!ontology) return '';
    const allNodes = new Set<string>();

    const baseConcepts = new Set<string>((baseline?.concepts || []).map(c => (c?.name || '').trim().toLowerCase()));
    const baseRels = new Set<string>((baseline?.relationships || []).map(r => `${(r?.name||'').trim().toLowerCase()}|${(r?.nameFrom||'').trim().toLowerCase()}|${(r?.nameTo||'').trim().toLowerCase()}`));
    const baseConceptDesc = new Map<string, string>((baseline?.concepts || []).map(c => [
      (c?.name || '').trim().toLowerCase(),
      (c?.description || '').trim()
    ]));
    const baseRelDesc = new Map<string, string>((baseline?.relationships || []).map(r => [
      `${(r?.name||'').trim().toLowerCase()}|${(r?.nameFrom||'').trim().toLowerCase()}|${(r?.nameTo||'').trim().toLowerCase()}`,
      (r?.description || '').trim()
    ]));

    // Determine filtering
    const showNewOnly = filterMode === 'newOnly';
    const showChangedOnly = filterMode === 'changedOnly';

    // Collect concepts and relationships according to filter
    const concepts = (ontology.concepts || []);
    const relationships = (ontology.relationships || []);

    // For newOnly: gather only new concepts + endpoints of new relationships
    let relsToRender = relationships;
    let conceptNamesToRender = new Set<string>();
    if (showNewOnly) {
      const newConceptNames = new Set<string>();
      concepts.forEach(c => {
        if (!c?.name) return;
        const isNew = !baseConcepts.has((c.name || '').trim().toLowerCase());
        if (isNew) newConceptNames.add(c.name);
      });
      relsToRender = relationships.filter(r => {
        const key = `${(r?.name||'').trim().toLowerCase()}|${(r?.nameFrom||'').trim().toLowerCase()}|${(r?.nameTo||'').trim().toLowerCase()}`;
        return !baseRels.has(key);
      });
      // Nodes to render are all new concepts + endpoints of new relationships
      newConceptNames.forEach(n => conceptNamesToRender.add(n));
      relsToRender.forEach(r => {
        if (r?.nameFrom) conceptNamesToRender.add(r.nameFrom);
        if (r?.nameTo) conceptNamesToRender.add(r.nameTo);
      });
    } else if (showChangedOnly) {
      // Concepts with same name but changed description
      const changedConceptNames = new Set<string>();
      concepts.forEach(c => {
        if (!c?.name) return;
        const key = (c.name || '').trim().toLowerCase();
        const base = baseConceptDesc.get(key) ?? '';
        const cur = (c.description || '').trim();
        if (baseConcepts.has(key) && base !== cur) {
          changedConceptNames.add(c.name);
        }
      });

      // Relationships that exist in baseline (same triple) but have changed description
      relsToRender = relationships.filter(r => {
        const k = `${(r?.name||'').trim().toLowerCase()}|${(r?.nameFrom||'').trim().toLowerCase()}|${(r?.nameTo||'').trim().toLowerCase()}`;
        if (!baseRels.has(k)) return false; // not changed, it's new; exclude here
        const baseD = baseRelDesc.get(k) ?? '';
        const curD = (r?.description || '').trim();
        return baseD !== curD;
      });

      // Nodes to render: changed concepts + endpoints of changed relationships
      changedConceptNames.forEach(n => conceptNamesToRender.add(n));
      relsToRender.forEach(r => {
        if (r?.nameFrom) conceptNamesToRender.add(r.nameFrom);
        if (r?.nameTo) conceptNamesToRender.add(r.nameTo);
      });
    } else {
      // all
      concepts.forEach(c => c?.name && conceptNamesToRender.add(c.name));
      relsToRender.forEach(r => {
        if (r?.nameFrom) conceptNamesToRender.add(r.nameFrom);
        if (r?.nameTo) conceptNamesToRender.add(r.nameTo);
      });
    }

    conceptNamesToRender.forEach(n => allNodes.add(n));
    if (allNodes.size === 0) return '';

    nodeIdToNameRef.current = {};
    relIndexToRelRef.current = [];
    conceptOrderRef.current = [];
    relOrderRef.current = [];

    let dsl = '%%{init: { "flowchart": { "useMaxWidth": false, "nodeSpacing": 20, "rankSpacing": 140, "ranker": "tight-tree" } }}%%\nflowchart TB\n';
    // Define a subtle style for clickable nodes; new already defined below
    dsl += '    classDef selectable stroke:#60a5fa,stroke-width:1px,opacity:1;\n';
    dsl += '    classDef selected fill:#1f2937,stroke:#f59e0b,stroke-width:3px,color:#fde68a;\n';
    dsl += '    classDef changed fill:#0f172a,stroke:#60a5fa,color:#bfdbfe,stroke-width:2px;\n';

    const cbName = `ogc_cb_${instanceIdRef.current}`;

    const curSelectedConcept = (selectedConcept ?? internalSelectedConcept ?? '').trim().toLowerCase();
    const multiSelectedConcepts = new Set<string>((selectedConcepts || [])
      .map(n => (n || '').trim().toLowerCase())
      .filter(Boolean)
    );

    allNodes.forEach((n) => {
      if (!n?.trim()) return;
      const id = n.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      nodeIdToNameRef.current[id] = n;
      const label = n.replace(/\"/g, "'");
      dsl += `    ${id}[\"${label}\"];\n`;
      dsl += `    class ${id} selectable;\n`;
      conceptOrderRef.current.push(n);
      // Attach a click callback (handled via window[cbName])
      dsl += `    click ${id} ${cbName} \"View details\";\n`;
      if (!baseConcepts.has(n.trim().toLowerCase())) {
        dsl += `    class ${id} new;\n`;
      } else if (showChangedOnly) {
        const key = n.trim().toLowerCase();
        const baseD = baseConceptDesc.get(key) ?? '';
        // We don't have current description here; changedOnly concept set populated above
        // If it is in conceptNamesToRender but also in baseline, mark as changed
        if (conceptNamesToRender.has(n)) {
          dsl += `    class ${id} changed;\n`;
        }
      }
      const lname = n.trim().toLowerCase();
      if (curSelectedConcept && lname === curSelectedConcept) {
        dsl += `    class ${id} selected;\n`;
      }
      if (multiSelectedConcepts.has(lname)) {
        dsl += `    class ${id} selected;\n`;
      }
    });

    let edgeIndex = 0;
    let selectedRelIdx: number | null = null;
    const selectedRelIdxs: number[] = [];
    const curSelectedRel = selectedRelationship ?? null;
    const multiSelectedRels = new Set<string>((selectedRelationships || [])
      .map(r => `${(r?.name||'').trim().toLowerCase()}|${(r?.nameFrom||'').trim().toLowerCase()}|${(r?.nameTo||'').trim().toLowerCase()}`)
    );
    relsToRender.forEach((rel) => {
      if (!rel?.name || !rel?.nameFrom || !rel?.nameTo) return;
      const fromId = rel.nameFrom.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || `from_${edgeIndex}`;
      const toId = rel.nameTo.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || `to_${edgeIndex}`;
      const label = rel.name.replace(/\"/g, "'");
      dsl += `    ${fromId} -->|\"${label}\"| ${toId};\n`;
      relIndexToRelRef.current.push({ name: rel.name, nameFrom: rel.nameFrom, nameTo: rel.nameTo });
      relOrderRef.current.push({ name: rel.name, nameFrom: rel.nameFrom, nameTo: rel.nameTo });
      const key = `${rel.name.trim().toLowerCase()}|${rel.nameFrom.trim().toLowerCase()}|${rel.nameTo.trim().toLowerCase()}`;
      if (!baseRels.has(key)) {
        // New relationship
        dsl += `    linkStyle ${edgeIndex} stroke:#22c55e,stroke-width:2px,opacity:0.9;\n`;
      } else if (showChangedOnly) {
        // Changed relationship (description difference)
        const baseD = baseRelDesc.get(key) ?? '';
        const curD = (rel?.description || '').trim();
        if (baseD !== curD) {
          dsl += `    linkStyle ${edgeIndex} stroke:#60a5fa,stroke-width:2px,opacity:1;\n`;
        }
      }
      // Handle selected relationship (by triple match) or internal selected index
      if (
        curSelectedRel &&
        (rel.name || '').trim().toLowerCase() === (curSelectedRel.name || '').trim().toLowerCase() &&
        (rel.nameFrom || '').trim().toLowerCase() === (curSelectedRel.nameFrom || '').trim().toLowerCase() &&
        (rel.nameTo || '').trim().toLowerCase() === (curSelectedRel.nameTo || '').trim().toLowerCase()
      ) {
        selectedRelIdx = edgeIndex;
      }
      const tripleKey = `${(rel?.name||'').trim().toLowerCase()}|${(rel?.nameFrom||'').trim().toLowerCase()}|${(rel?.nameTo||'').trim().toLowerCase()}`;
      if (multiSelectedRels.has(tripleKey)) {
        selectedRelIdxs.push(edgeIndex);
      }
      edgeIndex += 1;
    });

    dsl += `    classDef new fill:#064e3b,stroke:#22c55e,color:#e2e8f0,stroke-width:2px;\n`;
    // If an internal selected relationship index exists, style it
    const internalIdx = internalSelectedRelIndex;
    const finalSelIdx = (selectedRelIdx != null ? selectedRelIdx : internalIdx);
    if (finalSelIdx != null) {
      dsl += `    linkStyle ${finalSelIdx} stroke:#f59e0b,stroke-width:3px,opacity:1;\n`;
    }
    if (selectedRelIdxs.length) {
      selectedRelIdxs.forEach(i => {
        dsl += `    linkStyle ${i} stroke:#f59e0b,stroke-width:3px,opacity:1;\n`;
      });
    }
    return dsl;
  }, [
    ontology,
    baseline,
    selectedConcept,
    selectedRelationship,
    // Include multi-select arrays so highlights update when they change
    selectedConcepts,
    selectedRelationships,
    internalSelectedConcept,
    internalSelectedRelIndex,
    filterMode,
  ]);

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

    const cbName = `ogc_cb_${instanceIdRef.current}`;
    (window as any)[cbName] = (nodeId: string) => {
      const conceptName = nodeIdToNameRef.current[nodeId] || nodeId;
      setInternalSelectedRelIndex(null);
      setInternalSelectedConcept(conceptName);
      if (onSelectConcept) onSelectConcept(conceptName);
    };

    let disposed = false;
    let edgePaths: NodeListOf<Element> | undefined;
    (async () => {
      try {
        const id = `merm-${instanceIdRef.current}-${Date.now()}`;
        const out = await mmLoaded.render(id, mermaidDiagram);
        if (disposed || !diagramRef.current) return;
        diagramRef.current.innerHTML = out.svg || '';
        // Auto-fit once after initial render so content isn't clipped left
        try {
          if (autoFitOnResize && !userAdjustedRef.current) {
            // defer to ensure DOM paints before measuring
            setTimeout(() => fitToContent(), 0);
          }
        } catch {}
      } catch (e) {
        console.error('Mermaid render failed', e);
        if (diagramRef.current) diagramRef.current.textContent = '';
      }

      // After render, attach edge listeners
      try {
        const container = diagramRef.current;
        edgePaths = container?.querySelectorAll?.('.edgePaths path') || undefined;
        if (edgePaths && edgePaths.length) {
          edgePaths.forEach((pathEl, idx) => {
            try {
              (pathEl as SVGPathElement).style.cursor = 'pointer';
              const rel = relIndexToRelRef.current[idx];
              const handler = () => {
                setInternalSelectedConcept(null);
                setInternalSelectedRelIndex(idx);
                if (onSelectRelationship && rel) onSelectRelationship(rel);
              };
              (pathEl as any).__ogcHandler = handler;
              pathEl.addEventListener('click', handler);
            } catch {}
          });
        }
      } catch {}
    })();

    return () => {
      disposed = true;
      try {
        if (edgePaths && edgePaths.length) {
          edgePaths.forEach((pathEl) => {
            const handler = (pathEl as any).__ogcHandler;
            if (handler) pathEl.removeEventListener('click', handler);
            delete (pathEl as any).__ogcHandler;
          });
        }
      } catch {}
      try { delete (window as any)[cbName]; } catch {}
    };
  }, [mmLoaded, mermaidDiagram, onSelectConcept, onSelectRelationship]);

  // When fitTrigger changes, auto-fit (after next paint) to keep initial open centered
  useEffect(() => {
    if (!enableZoomPan) return;
    // defer twice: next frame then microtask to ensure SVG is in place
    const id = requestAnimationFrame(() => setTimeout(() => {
      try { fitToContent(); } catch {}
    }, 0));
    return () => cancelAnimationFrame(id);
  }, [fitTrigger, enableZoomPan]);

  // Drag-to-pan: hold Space + left mouse, or use middle mouse button
  useEffect(() => {
    if (!enableZoomPan) return;
    const svgHost = diagramRef.current;
    if (!svgHost) return;

    function findScrollParent(el: HTMLElement | null): HTMLElement | null {
      let node: HTMLElement | null = el?.parentElement || null;
      while (node) {
        try {
          const cs = getComputedStyle(node);
          const hasScroll = /(auto|scroll)/.test(cs.overflowY || cs.overflow);
          if (hasScroll && node.scrollHeight > node.clientHeight) return node;
        } catch {}
        node = node.parentElement;
      }
      return null;
    }

    const scrollEl = findScrollParent(svgHost);
    if (!scrollEl) return;

    let isPanning = false;
    let startX = 0, startY = 0;
    let startScrollLeft = 0, startScrollTop = 0;

    const onMouseDown = (e: MouseEvent) => {
      const isMiddle = e.button === 1;
      const isSpaceLeft = (e.button === 0) && (e.metaKey || e.ctrlKey || e.shiftKey || (window as any).__ogcHoldSpace);
      if (!isMiddle && !isSpaceLeft) return;
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      startScrollLeft = scrollEl.scrollLeft;
      startScrollTop = scrollEl.scrollTop;
      scrollEl.classList.add('cursor-grabbing');
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      scrollEl.scrollLeft = startScrollLeft - dx;
      scrollEl.scrollTop = startScrollTop - dy;
    };

    const onMouseUp = () => {
      isPanning = false;
      scrollEl.classList.remove('cursor-grabbing');
    };

    svgHost.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') (window as any).__ogcHoldSpace = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') (window as any).__ogcHoldSpace = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      svgHost.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      (window as any).__ogcHoldSpace = false;
    };
  }, [enableZoomPan, diagramRef.current]);

  // Lasso selection: hold Alt + left mouse and drag to select
  useEffect(() => {
    if (!enableLasso) return;
    const host = diagramRef.current;
    if (!host) return;

    let active = false;
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || !e.altKey) return;
      active = true;
      const next = { active: true, x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY };
      lassoRef.current = next;
      setLasso(next);
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!active) return;
      const prev = lassoRef.current;
      if (!prev) return;
      const next = { ...prev, x1: e.clientX, y1: e.clientY };
      lassoRef.current = next;
      if (lassoRAFRef.current != null) return;
      lassoRAFRef.current = requestAnimationFrame(() => {
        setLasso(lassoRef.current);
        lassoRAFRef.current = null;
      });
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!active) return;
      active = false;
      const rect = lassoRef.current;
      lassoRef.current = null;
      setLasso(null);
      if (!rect) return;
      const xMin = Math.min(rect.x0, rect.x1);
      const xMax = Math.max(rect.x0, rect.x1);
      const yMin = Math.min(rect.y0, rect.y1);
      const yMax = Math.max(rect.y0, rect.y1);

      // Helper to test intersection with a DOMRect
      const intersects = (r: DOMRect) => !(r.right < xMin || r.left > xMax || r.bottom < yMin || r.top > yMax);

      try {
        const svgRoot = host.querySelector('svg') as SVGSVGElement | null;
        if (!svgRoot) return;
        // Concepts: iterate known ids
        const pickedConcepts: string[] = [];
        Object.entries(nodeIdToNameRef.current).forEach(([id, name]) => {
          const el = svgRoot.getElementById ? svgRoot.getElementById(id) : document.getElementById(id);
          const target = el as unknown as HTMLElement | null;
          if (!target) return;
          const r = target.getBoundingClientRect();
          if (intersects(r)) pickedConcepts.push(name);
        });

        // Relationships: use path bounding boxes by index order
        const pickedRels: Array<{ name: string; nameFrom: string; nameTo: string }> = [];
        const paths = host.querySelectorAll('.edgePaths path');
        paths.forEach((p, idx) => {
          const path = p as SVGPathElement;
          const r = path.getBoundingClientRect();
          let midHit = false;
          try {
            const total = (path as any).getTotalLength ? (path as any).getTotalLength() : 0;
            if (total > 0 && (path as any).getPointAtLength) {
              const mp = (path as any).getPointAtLength(total / 2);
              // Approximate: use bbox center when transforms prevent accurate mapping
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              if (cx >= xMin && cx <= xMax && cy >= yMin && cy <= yMax) midHit = true;
            }
          } catch {}
          if (intersects(r) || midHit) {
            const rel = relIndexToRelRef.current[idx];
            if (rel) pickedRels.push(rel);
          }
        });
        // Also consider edge labels
        const labels = host.querySelectorAll('.edgeLabels .edgeLabel');
        labels.forEach((lbl, idx) => {
          const rr = (lbl as HTMLElement).getBoundingClientRect();
          if (intersects(rr)) {
            const rel = relIndexToRelRef.current[idx];
            if (rel) pickedRels.push(rel);
          }
        });

        // Dispatch selections via callbacks (caller handles multi vs single)
        const uniq = <T,>(arr: T[], keyFn: (t: T) => string) => {
          const seen = new Set<string>();
          const out: T[] = [];
          for (const item of arr) { const k = keyFn(item); if (!seen.has(k)) { seen.add(k); out.push(item); } }
          return out;
        };
        uniq(pickedConcepts, s => (s || '').trim().toLowerCase()).forEach(n => onSelectConcept?.(n));
        uniq(pickedRels, r => `${(r?.name||'').trim().toLowerCase()}|${(r?.nameFrom||'').trim().toLowerCase()}|${(r?.nameTo||'').trim().toLowerCase()}`)
          .forEach(r => onSelectRelationship?.(r));
      } catch (err) {
        console.error('Lasso selection failed', err);
      }
    };

    host.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      host.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (lassoRAFRef.current != null) cancelAnimationFrame(lassoRAFRef.current);
      lassoRAFRef.current = null;
    };
  }, [enableLasso, onSelectConcept, onSelectRelationship]);

  // Fit-to-content button handler helper
  const fitToContent = () => {
    try {
      const svg = diagramRef.current?.querySelector?.('svg') as SVGSVGElement | null;
      if (!svg) return;
      const scrollParent = (function find(el: HTMLElement | null): HTMLElement | null {
        let node: HTMLElement | null = el?.parentElement || null;
        while (node) {
          const cs = getComputedStyle(node);
          const hasScroll = /(auto|scroll)/.test(cs.overflowY || cs.overflow);
          if (hasScroll && node.clientWidth > 0) return node;
          node = node.parentElement;
        }
        return null;
      })(diagramRef.current as any);
      if (!scrollParent) return;

      const margin = 24;
      const cw = Math.max(1, scrollParent.clientWidth - margin);
      const ch = Math.max(1, scrollParent.clientHeight - margin);

      // Work from the rendered size in CSS pixels (includes current scale)
      const rect = svg.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0)) return;

      // Derive the unscaled (base) size using current scale factor
      const currentScale = scale || 1;
      const baseW = rect.width / currentScale;
      const baseH = rect.height / currentScale;
      if (!(baseW > 0 && baseH > 0)) return;

      const scaleW = cw / baseW;
      const scaleH = ch / baseH;
      // Width-first fit: favor filling available width and allow vertical scroll
      // Do not go below 1 to avoid a tiny graph; cap to 3 to avoid extreme zoom-in
      const target = Math.max(1, Math.min(3, scaleW));
      setScale(target);
      try {
        setTimeout(() => {
          const sp = scrollParent as HTMLElement | null;
          if (!sp) return;
          const rect2 = svg.getBoundingClientRect();
          const currentBaseW = rect2.width / (scale || 1);
          const contentW = currentBaseW * target;
          const desired = Math.max(0, (contentW - sp.clientWidth) / 2);
          sp.scrollLeft = desired;
          sp.scrollTop = 0;
        }, 0);
      } catch {}
    } catch {}
  };

  // Zoom via mouse wheel when enableZoomPan and ctrl/cmd key pressed
  useEffect(() => {
    if (!enableZoomPan) return;
    const container = diagramRef.current?.parentElement || null;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return; // require modifier
      e.preventDefault();
      const delta = e.deltaY;
      setScale(prev => {
        userAdjustedRef.current = true;
        const next = prev * (delta > 0 ? 0.9 : 1.1);
        return Math.min(3, Math.max(0.5, next));
      });
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel as any);
  }, [enableZoomPan]);

  // Auto-fit on container resize if enabled and user hasn't manually adjusted zoom
  useEffect(() => {
    if (!enableZoomPan || !autoFitOnResize) return;
    const container = (function findScrollParent(el: HTMLElement | null): HTMLElement | null {
      let node: HTMLElement | null = el?.parentElement || null;
      while (node) {
        try {
          const cs = getComputedStyle(node);
          const hasScroll = /(auto|scroll)/.test(cs.overflowY || cs.overflow);
          if (hasScroll && node.clientWidth > 0) return node;
        } catch {}
        node = node.parentElement;
      }
      return null;
    })(diagramRef.current as any);
    if (!container) return;
    const ro = new ResizeObserver(() => {
      if (!userAdjustedRef.current) {
        fitToContent();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [enableZoomPan, autoFitOnResize]);

  if (!ontology) return <div className={className}>No ontology</div>;

  return (
    <div className={`${className}` }>
      {enableZoomPan && (
        <div className="sticky top-0 z-10 flex gap-1 justify-end bg-background/90 backdrop-blur px-2 py-1 border-b border-gray-700">
          <button className="px-1 text-xs bg-gray-700 text-gray-200 rounded" title="Zoom out" onClick={() => { userAdjustedRef.current = true; setScale(s => Math.max(0.5, s * 0.9)); }}>-</button>
          <button className="px-1 text-xs bg-gray-700 text-gray-200 rounded" title="Zoom in" onClick={() => { userAdjustedRef.current = true; setScale(s => Math.min(3, s * 1.1)); }}>+</button>
          <button className="px-1 text-xs bg-gray-700 text-gray-200 rounded" title="Fit to view" onClick={fitToContent}>Fit</button>
          <button className="px-1 text-xs bg-gray-700 text-gray-200 rounded" title="Reset zoom" onClick={() => { userAdjustedRef.current = false; fitToContent(); }}>Reset</button>
          <button
            className="px-1 text-xs bg-gray-700 text-gray-200 rounded"
            title="Download SVG"
            onClick={() => {
              try {
                const svg = diagramRef.current?.querySelector?.('svg') as SVGSVGElement | null;
                if (!svg) return;
                const clone = svg.cloneNode(true) as SVGSVGElement;
                if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                const serializer = new XMLSerializer();
                const svgText = serializer.serializeToString(clone);
                const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ontology-graph-${instanceIdRef.current}.svg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (e) { console.error('SVG download failed', e); }
            }}
          >
            SVG
          </button>
          <button
            className="px-1 text-xs bg-gray-700 text-gray-200 rounded"
            title="Download PNG"
            onClick={async () => {
              try {
                const svg = diagramRef.current?.querySelector?.('svg') as SVGSVGElement | null;
                if (!svg) return;
                const clone = svg.cloneNode(true) as SVGSVGElement;
                if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                const serializer = new XMLSerializer();
                const svgText = serializer.serializeToString(clone);
                const vb = svg.viewBox?.baseVal;
                let w = vb?.width || (svg as any).width?.baseVal?.value || svg.getBoundingClientRect().width || 1200;
                let h = vb?.height || (svg as any).height?.baseVal?.value || svg.getBoundingClientRect().height || 800;
                w = Math.max(1, Math.floor(w));
                h = Math.max(1, Math.floor(h));
                const img = new Image();
                const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                await new Promise<void>((resolve, reject) => {
                  img.onload = () => { resolve(); };
                  img.onerror = (err) => reject(err);
                  img.src = url;
                });
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('No canvas context');
                ctx.fillStyle = '#0b1220';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(url);
                canvas.toBlob((pngBlob) => {
                  if (!pngBlob) return;
                  const dlUrl = URL.createObjectURL(pngBlob);
                  const a = document.createElement('a');
                  a.href = dlUrl;
                  a.download = `ontology-graph-${instanceIdRef.current}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(dlUrl);
                }, 'image/png');
              } catch (e) { console.error('PNG download failed', e); }
            }}
          >
            PNG
          </button>
        </div>
      )}
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          const concepts = conceptOrderRef.current;
          const rels = relOrderRef.current;
          if (!concepts.length && !rels.length) return;
          if (e.key === 'Tab') {
            kbModeRef.current = kbModeRef.current === 'concept' ? 'relationship' : 'concept';
            e.preventDefault();
            return;
          }
          const mode = kbModeRef.current;
          if (mode === 'concept' && concepts.length) {
            let idx = internalSelectedConcept ? concepts.findIndex(n => n.trim().toLowerCase() === internalSelectedConcept.trim().toLowerCase()) : -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') idx = (idx + 1 + concepts.length) % concepts.length;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') idx = (idx - 1 + concepts.length) % concepts.length;
            else if (e.key === 'Home') idx = 0; else if (e.key === 'End') idx = concepts.length - 1; else return;
            const name = concepts[idx];
            setInternalSelectedRelIndex(null);
            setInternalSelectedConcept(name);
            onSelectConcept?.(name);
            e.preventDefault();
          } else if (mode === 'relationship' && rels.length) {
            let idx = (internalSelectedRelIndex ?? -1);
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') idx = (idx + 1 + rels.length) % rels.length;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') idx = (idx - 1 + rels.length) % rels.length;
            else if (e.key === 'Home') idx = 0; else if (e.key === 'End') idx = rels.length - 1; else return;
            setInternalSelectedConcept(null);
            setInternalSelectedRelIndex(idx);
            const rel = rels[idx];
            if (rel) onSelectRelationship?.(rel);
            e.preventDefault();
          }
        }}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center', outline: 'none' }}
      >
        <div className="mx-auto" style={{ maxWidth: 640 }}>
          <div ref={diagramRef} className="mermaid min-w-[480px] relative" />
        </div>
        {enableLasso && lasso?.active && (
          <div
            className="pointer-events-none absolute border border-blue-400/80 bg-blue-500/10"
            style={{
              left: `${(Math.min(lasso.x0, lasso.x1) - (diagramRef.current?.getBoundingClientRect().left || 0)) / (scale || 1)}px`,
              top: `${(Math.min(lasso.y0, lasso.y1) - (diagramRef.current?.getBoundingClientRect().top || 0)) / (scale || 1)}px`,
              width: `${Math.abs(lasso.x1 - lasso.x0) / (scale || 1)}px`,
              height: `${Math.abs(lasso.y1 - lasso.y0) / (scale || 1)}px`,
            }}
          />
        )}
      </div>
    </div>
  );
}
