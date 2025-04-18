import React, { useEffect, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
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

    return (
        <div className="prose prose-invert max-w-none custom-markdown markdown-preview bg-background text-foreground p-4 rounded-md overflow-auto max-h-[80vh]">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]} // Enables GitHub-flavored Markdown
                rehypePlugins={[rehypeHighlight]} // Enables syntax highlighting
                components={{
                    code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        // Check if this is a mermaid code block
                        if (match && match[1] === 'mermaid') {
                            return (
                                <div className="mermaid my-4">
                                    {String(children).replace(/\n$/, '')}
                                </div>
                            );
                        }

                        return (
                            <code
                                className={className || ''}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {mdPreview}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownPreview;