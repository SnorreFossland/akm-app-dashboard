'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import matter from 'gray-matter';

interface MarkdownPreviewProps {
    mdPreview: string;
    variant?: 'default' | 'compact';
}

// Sanitize markdown content to prevent invalid HTML tags
function sanitizeMarkdown(content: string): string {
    if (!content) return '';
    const validTags = new Set([
        'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'del', 'div', 'dl', 'dt', 'em',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'ol', 'p',
        'pre', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th',
        'thead', 'tr', 'ul'
    ]);

    return content.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (m, tag) => {
        return validTags.has(tag.toLowerCase())
            ? m
            : m.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
}

// New helper: inject an SVG-scoped style and apply conservative attribute fixes so all diagram text/strokes show white
function applyWhiteTextToSVG(svg: SVGSVGElement | null) {
    // ...defensive no-op if missing
    if (!svg) return;
    try {
        // Avoid injecting multiple times
        if (svg.querySelector('style[data-injected-mermaid-text-color]')) return;

        // Create an SVG style node (namespace aware)
        const styleNode = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleNode.setAttribute('data-injected-mermaid-text-color', '1');

        // Keep rules minimal but broad — use !important to override inline styles when needed
        styleNode.textContent = `
			/* Force all SVG text to white for readability */
			text, tspan, .label, .edgeLabel, .node text, .node tspan, .label * {
				fill: #ffffff !important;
				color: #ffffff !important;
			}
			/* Slightly lighten edge strokes for contrast */
			.edgePath, path, line, polyline, polygon, rect, circle {
				stroke: rgba(255,255,255,0.90) !important;
			}
			/* Make node fills darker/lighter as needed (non-invasive) */
			.node rect, .node polygon, .node circle {
				fill-opacity: 0.06 !important;
			}
		`;

        // Append style to the SVG so it will generally appear later in the cascade,
        // helping override earlier mermaid-inserted rules. Also rely on MutationObserver to reapply if mermaid updates.
        svg.appendChild(styleNode);

        // Extra compatibility: set fill attribute on any existing text/tspan elements
        const textEls = svg.querySelectorAll<SVGElement>('text, tspan');
        textEls.forEach((el) => {
            try {
                el.setAttribute('fill', '#FFFFFF');
                (el as any).style.fill = '#FFFFFF';
            } catch { /* ignore */ }
        });

        // Also make HTML inside foreignObject readable
        const foreignObjects = svg.querySelectorAll<HTMLElement>('foreignObject *');
        foreignObjects.forEach((el) => {
            try {
                (el as HTMLElement).style.color = '#FFFFFF';
                (el as HTMLElement).style.fill = '#FFFFFF';
            } catch { /* ignore */ }
        });
    } catch (err) {
        // Defensive logging but do not throw
        // eslint-disable-next-line no-console
        console.warn('[MarkdownPreview] applyWhiteTextToSVG failed', err);
    }
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ mdPreview, variant = 'default' }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { data: meta, content: body } = matter(mdPreview || "");

    // existing re-init on markdown change
    useLayoutEffect(() => {
        mermaid.initialize({ startOnLoad: false });
        mermaid.init(undefined, '.mermaid');
    }, [mdPreview]);

    // re-init diagrams when window regains focus
    useEffect(() => {
        const handleWindowFocus = () => {
            mermaid.init(undefined, '.mermaid');
            // Re-apply white text after mermaid may have re-rendered on focus
            window.setTimeout(() => {
                const container = containerRef.current;
                if (!container) return;
                const svgs = Array.from(container.querySelectorAll<SVGSVGElement>('.mermaid svg'));
                svgs.forEach(s => applyWhiteTextToSVG(s));
            }, 50);
        };
        window.addEventListener('focus', handleWindowFocus);
        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, []);

    // Inject a small, scoped stylesheet to reduce spacing around <hr> and tables
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (container.querySelector('style[data-md-hr]')) return;

        const s = document.createElement('style');
        s.setAttribute('data-md-hr', '1');
        s.textContent = `
      /* Reduce vertical spacing for <hr> produced by Markdown '---' */
      .markdown-preview.prose hr,
      .markdown-preview hr {
        margin-top: 0.3rem !important;
        margin-bottom: 0.25rem !important;
        height: 1px !important;
        border: none !important;
        border-top: 1px solid rgba(255,255,255,0.08) !important;
        opacity: 0.9;
      }
      /* Reduce extra spacing from adjacent elements (paragraphs, lists, headers) */
      .markdown-preview.prose * + hr,
      .markdown-preview * + hr {
        margin-top: 0.4rem !important;
      }
      .markdown-preview.prose hr + *,
      .markdown-preview hr + * {
        margin-top: 0.3rem !important;
      }

      /* Ensure headings have clear separation from preceding content */
      .markdown-preview h1,
      .markdown-preview h2,
      .markdown-preview h3,
      .markdown-preview h4,
      .markdown-preview h5,
      .markdown-preview h6 {
        /* Increased top margin for clearer separation */
        margin-top: 1rem !important;
        margin-bottom: 1rem !important;
        scroll-margin-top: 1rem !important;
      }
      /* Add a little more top space when a heading immediately follows a paragraph/list/table */
      .markdown-preview p + h1,
      .markdown-preview p + h2,
      .markdown-preview p + h3,
      .markdown-preview p + h4,
      .markdown-preview p + h5,
      .markdown-preview p + h6,
      .markdown-preview ul + h1,
      .markdown-preview ol + h1,
      .markdown-preview table + h1 {
        margin-top: 1.05rem !important;
      }

      /* Hide completely empty paragraphs created by consecutive blank lines */
      .markdown-preview.prose p:empty,
      .markdown-preview p:empty {
        display: none !important;
        margin: 0 !important;
        padding: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }

      /* Compact tables: reduce top/bottom margins and cell padding */
      .markdown-preview.prose table,
      .markdown-preview table {
        margin-top: 0.25rem !important;
        margin-bottom: 0.25rem !important;
        border-collapse: collapse !important;
        border-spacing: 0 !important;
        width: 100% !important;
        font-size: 0.95em !important;
        line-height: 1.25 !important;
      }
      .markdown-preview.prose table th,
      .markdown-preview.prose table td,
      .markdown-preview table th,
      .markdown-preview table td {
        padding: 0.35rem 0.5rem !important;
        vertical-align: top !important;
        line-height: 1.2 !important;
        border-bottom: 1px solid rgba(255,255,255,0.06) !important;
      }
      /* Reduce spacing before tables when preceded by headings or paragraphs */
      .markdown-preview p + table,
      .markdown-preview h1 + table,
      .markdown-preview h2 + table,
      .markdown-preview h3 + table,
      .markdown-preview h4 + table,
      .markdown-preview h5 + table,
      .markdown-preview h6 + table {
        margin-top: 0.25rem !important;
      }

      /* Compact caption */
      .markdown-preview caption {
        caption-side: top;
        margin-bottom: 0.25rem;
        font-size: 0.9em;
        color: rgba(255,255,255,0.85);
      }

      /* Slightly reduce spacing for tables inside blockquotes */
      .markdown-preview blockquote table {
        margin-top: 0.25rem !important;
        margin-bottom: 0.25rem !important;
      }
    `;
        // prepend so it is applied before other container styles
        container.prepend(s);
        return () => {
            s.remove();
        };
    }, []);

    if (!mdPreview) {
        return <div className="text-gray-400 p-2 text-xs leading-tight">No content to display</div>;
    }



    // Clean up extra newlines before tables and remove trailing spaces
    // const cleanedMdPreview = mdPreview.replace(/(\r\n|\n|\r){2,}/g, '\n\n');

    const baseClasses =
        'markdown markdown-preview prose prose-sm dark:prose-invert custom-markdown bg-transparent text-primary rounded-md overflow-auto whitespace-normal break-words';

    const variantClasses =
        variant === 'compact'
            ? [
                'condensed-prose',
                'prose-base leading-[1.35] tracking-normal',
                'p-2 max-w-full',
                // paragraphs
                '[&_p]:mt-[0.4rem] [&_p]:mb-[0.4rem] [&_p:empty]:hidden',
                // headings
                '[&_h1]:text-2xl [&_h1]:mt-2 [&_h1]:mb-1',
                '[&_h2]:text-xl  [&_h2]:mt-2 [&_h2]:mb-1',
                '[&_h3]:text-lg  [&_h3]:mt-3 [&_h3]:mb-1',
                // add space when a heading follows common blocks
                '[&_p+h1]:mt-3 [&_p+h2]:mt-3 [&_p+h3]:mt-4',
                '[&_ul+h1]:mt-3 [&_ul+h2]:mt-3 [&_ul+h3]:mt-4',
                '[&_ol+h1]:mt-3 [&_ol+h2]:mt-3 [&_ol+h3]:mt-4',
                '[&_table+h1]:mt-3 [&_table+h2]:mt-3 [&_table+h3]:mt-4',


                // tables
                '[&_table]:my-[0.2rem] [&_table]:mt-0',
                '[&_thead_th]:pt-0 [&_thead_th]:pb-[0.35rem]',
                '[&_th]:px-3.5 [&_td]:px-3.5 [&_td]:py-[0.35rem]',
                // wrapping
                '[&_th]:break-words [&_td]:break-words',
                // code
                '[&_code]:text-[14px] [&_code]:leading-[1.3]',
            ].join(' ')
            : 'condensed-prose p-4 max-w-[600px] mx-auto leading-tight';


    // collapse stray blank lines, esp. before tables
    const cleanedMdPreview = mdPreview
        .replace(/(\r\n|\n|\r){3,}/g, '\n\n')
        .replace(/(?:^|\n)\s*\n(?=\|.*\|)/g, '\n')
        .replace(/^---[\s\S]*?---/, '');;


    const sanitizedContent = sanitizeMarkdown(cleanedMdPreview);


    return (
        <div className={`${baseClasses} ${variantClasses}`} ref={containerRef}>
            {meta?.title || meta?.author || meta?.date ? (
                <div className="mb-3 text-sm text-gray-600">
                    {meta.title && <div><strong>{meta.title}</strong></div>}
                    {(meta.author || meta.date) && (
                        <div>
                            {meta.author && meta.author}
                            {meta.author && meta.date && " — "}
                            {meta.date && meta.date}
                        </div>
                    )}
                </div>
            ) : null}
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        if (match && match[1] === 'mermaid') {
                            return <div className="mermaid my-3">{String(children).replace(/\n$/, '')}</div>;
                        }
                        return !inline && match ? (
                            <SyntaxHighlighter
                                {...props}
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={`${className || ''} break-words`} {...props}>
                                {children}
                            </code>
                        );
                    },

                    // Unified heading overrides with consistent smaller typography
                    h1: ({ children, ...props }: any) => (
                        <h1 {...props} className="text-2xl font-semibold mt-4 mb-2">{children}</h1>
                    ),
                    h2: ({ children, ...props }: any) => (
                        <h2 {...props} className="text-xl font-semibold mt-3 mb-1.5">{children}</h2>
                    ),
                    h3: ({ children, ...props }: any) => (
                        <h3 {...props} className="text-lg font-medium mt-2.5 mb-1">{children}</h3>
                    ),
                    h4: ({ children, ...props }: any) => (
                        <h4 {...props} className="text-base font-medium mt-2 mb-1">{children}</h4>
                    ),
                    h5: ({ children, ...props }: any) => (
                        <h5 {...props} className="text-sm font-medium mt-1.5 mb-0.5">{children}</h5>
                    ),
                    h6: ({ children, ...props }: any) => (
                        <h6 {...props} className="text-sm font-normal mt-1 mb-0.5 text-gray-700">{children}</h6>
                    ),
                }}
            >
                {sanitizedContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownPreview;
