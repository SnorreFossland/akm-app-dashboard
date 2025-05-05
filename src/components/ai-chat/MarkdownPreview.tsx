import React, { useEffect, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

interface MarkdownPreviewProps {
    mdPreview: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ mdPreview }) => {
    // existing re-init on markdown change
    useLayoutEffect(() => {
        mermaid.initialize({ startOnLoad: false })
        mermaid.init(undefined, '.mermaid')
    }, [mdPreview])

    // <-- new: re-init diagrams when window regains focus
    useEffect(() => {
        const handleWindowFocus = () => {
            mermaid.init(undefined, '.mermaid')
        }
        window.addEventListener('focus', handleWindowFocus)
        return () => {
            window.removeEventListener('focus', handleWindowFocus)
        }
    }, [])

    if (!mdPreview) {
        return <div className="text-gray-400 p-4">No content to display</div>;
    }

    return (
        <>
            {/* Add global styles for code blocks to ensure they don't expand containers */}

            <div className="prose prose-invert condensed-prose custom-markdown markdown-preview bg-primary-foreground text-primary p-4 rounded-md overflow-auto max-w-[800px] mx-auto whitespace-pre-wrap break-words break-all leading-tight">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}  
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        code: ({ node, inline, className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            // Check if this is a mermaid code block
                            if (match && match[1] === 'mermaid') {
                                return (
                                    <div className="mermaid my-4 break-all">
                                        {String(children).replace(/\n$/, '')}
                                    </div>
                                );
                            }
                            // Handle other code blocks with proper formatting
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    {...props}
                                    style={atomDark}
                                    language={match[1]}
                                    PreTag="div"
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className={`${className || ''} break-all`} {...props}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {mdPreview}
                </ReactMarkdown>
            </div>
        </>
    );
};

export default MarkdownPreview;