'use client';
import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { PROMPT_TEMPLATES, PromptTemplate } from './promptTemplates';
import TextareaAutosize from 'react-textarea-autosize';
import { saveMarkdownDocument } from '@/redux/features/markdownSlice';
interface TemplatesPanelProps {
    onApplyTemplate: (content: string) => void;
    selectedModel: string; // Add selectedModel to props
    editableContent: string;
    setEditableContent: (v: string) => void;
    domainContent: string;
    setDomainContent: (v: string) => void;
    onAddMD: () => void
    mdContent: string
}
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function TemplatesPanel({
    onApplyTemplate,
    selectedModel,
    editableContent,
    setEditableContent,
    domainContent,
    setDomainContent,
    onAddMD,
    mdContent,
}: TemplatesPanelProps) {
    const dispatch = useDispatch();
    const documents = useSelector((state: RootState) => state.markdown.documents);
    const [activeTab, setActiveTab] = useState<'templates' | 'document'>('templates')
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All'); // State for selected category
    const [isRefining, setIsRefining] = useState(false); // Loading state for refining
    const [isRefiningDomain, setIsRefiningDomain] = useState(false); // Loading state for refining domain
    const [hasRefined, setHasRefined] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([]);
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    // Add state to track placeholders'
    const [placeholders, setPlaceholders] = useState<{ start: number, end: number, text: string }[]>([]);
    const [importedFile, setImportedFile] = useState<string>('');
    const [importedFileName, setImportedFileName] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editableTextareaRef = useRef<HTMLTextAreaElement>(null);
    const initialDomainContent = useRef(domainContent);
    const [urlInput, setUrlInput] = useState('');
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [urlError, setUrlError] = useState('');
    const [docName, setDocName] = useState('');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [docFilter, setDocFilter] = useState('');
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);
    const [isDomainTemplateOpen, setIsDomainTemplateOpen] = useState(false);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<{ start: number, end: number, text: string }[]>([]);

    const [isTopicVisible, setIsTopicVisible] = useState(true);

    const buttonPrimary = "bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded-md text-xs";
    const buttonSecondary = "border-2 border border-gray-500 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-1 rounded-md text-xs";
    const buttonAccent = "bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 rounded-md text-xs";
    const buttonDestructive = "bg-destructive text-destructive-foreground hover:bg-destructive/90 px-2 py-1 rounded-md text-xs";
    const buttonOutline = "border-2 border border-gray-500 bg-background hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded-md text-xs";
    const buttonGhost = "hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded-md text-xs";


    // find the global index of the Domain/Topic Scoping template
    const domainIndex = PROMPT_TEMPLATES.findIndex(t => t.title === 'Domain Definition');



    const isMounted = useRef(true);

    // Generate categories list dynamically from templates
    const CATEGORIES = ["All", ...Array.from(
        new Set(PROMPT_TEMPLATES.map(template => template.category))
    ).sort()];
    const filteredTemplates = selectedCategory === 'All'
        ? PROMPT_TEMPLATES
        : PROMPT_TEMPLATES.filter(template => template.category === selectedCategory);


    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);
    // Find all placeholders when content changes, but exclude those within mermaid diagrams
    useEffect(() => {
        // Process domain content first
        if (domainContent) {
            // First identify all mermaid diagram blocks
            const mermaidBlockRegex = /```mermaid[\s\S]*?```/g;
            const mermaidBlocks: { start: number, end: number }[] = [];
            let mermaidMatch;

            while ((mermaidMatch = mermaidBlockRegex.exec(domainContent)) !== null) {
                mermaidBlocks.push({
                    start: mermaidMatch.index,
                    end: mermaidMatch.index + mermaidMatch[0].length
                });
            }

            // Then find placeholders but exclude those in mermaid blocks
            const regex = /\[(.*?)\]/g;
            const domainPlaceholders = [];
            let match: RegExpExecArray | null;

            while ((match = regex.exec(domainContent)) !== null) {
                // Check if this placeholder is inside any mermaid block
                const isInMermaidBlock = mermaidBlocks.some(
                    block => match!.index >= block.start && match!.index < block.end
                );

                // Only add placeholders that are not in mermaid blocks
                if (!isInMermaidBlock) {
                    domainPlaceholders.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[0]
                    });
                }
            }
            
            // Update domain placeholders 
            setTemplatePlaceholders(domainPlaceholders);
        }

        // Process editable content (template content)
        if (editableContent) {
            // Similar placeholder detection logic for editable content
            const mermaidBlockRegex = /```mermaid[\s\S]*?```/g;
            const mermaidBlocks: { start: number, end: number }[] = [];
            let mermaidMatch;

            while ((mermaidMatch = mermaidBlockRegex.exec(editableContent)) !== null) {
                mermaidBlocks.push({
                    start: mermaidMatch.index,
                    end: mermaidMatch.index + mermaidMatch[0].length
                });
            }

            const regex = /\[(.*?)\]/g;
            const placeholders = [];
            let match: RegExpExecArray | null;

            while ((match = regex.exec(editableContent)) !== null) {
                const isInMermaidBlock = mermaidBlocks.some(
                    block => match!.index >= block.start && match!.index < block.end
                );

                if (!isInMermaidBlock) {
                    placeholders.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[0]
                    });
                }
            }
            
            // Update template placeholders
            setPlaceholders(placeholders);
        }

    }, [editableContent, domainContent, importedFile]);

    const handleUrlImport = async () => {
        setUrlError('');
        if (!urlInput.trim()) return;
        setIsFetchingUrl(true);
        try {
            const res = await fetch(urlInput);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            // update importedFile & importedFileName
            setImportedFile(text);
            const name = urlInput.split('/').pop() || urlInput;
            setImportedFileName(name);
            setUrlInput('');
        } catch (err: any) {
            console.error('URL fetch error:', err);
            setUrlError(err.message || 'Failed to fetch URL');
        } finally {
            setIsFetchingUrl(false);
        }
    };

    const handleDomainTemplate = (index: number) => {
        const template = PROMPT_TEMPLATES[index];
        if (!template) return;

        // Populate editor with the selected template content
        setDomainContent(
            `${template.title}: ${template.content}\n`
        );
        setSelectedTemplate(index);
        setHasRefined(false);

        // jump to first placeholder if any
        setTimeout(() => {
            if (placeholders.length > 0) {
                selectPlaceholder(0);
            }
        }, 50);
    };

    const handleSaveToRedux = () => {
        if (!domainContent.trim()) {
            alert('Please provide a Domain description before saving.');
            return;
        } else if (
            !confirm('Are you sure you want to save this domain?')
        ) {
            return;
        }

        // Extract & clean first line
        const firstLine = domainContent.split('\n')[0].replace(/^[#\-*>`_]+\s*/, '');
        const cleanName = firstLine.replace(/[#*]/g, '').trim();
        // const cleanName = firstLine.replace(/[^a-zA-Z0-9 ]/g, '').trim();

        // Build the document name and use a local variable
        const fullDocName = cleanName;
        setDocName(fullDocName);

        console.log('Saving to Redux:', {
            id: Date.now().toString(),
            name: fullDocName,
            content: domainContent
        });

        dispatch(saveMarkdownDocument({
            id: Date.now().toString(),
            name: fullDocName,
            content: domainContent,
            createdAt: new Date().toISOString()
        }));

        alert('Domain saved to library');
    };
    // Add function to handle file import
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (limit to 1MB)
        if (file.size > 1024 * 1024) {
            alert('File size must be less than 1MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setImportedFile(content);
            setImportedFileName(file.name);
        };
        reader.readAsText(file);
    };

    // Function to remove imported file
    const removeImportedFile = () => {
        setImportedFile('');
        setImportedFileName('');
    };
    // Function to select a placeholder
    const selectPlaceholder = (index: number) => {
        if (!textareaRef.current || index >= placeholders.length) return;

        const placeholder = placeholders[index];
        const textarea = textareaRef.current;

        // Focus and select the placeholder text
        textarea.focus();
        textarea.setSelectionRange(placeholder.start, placeholder.end);

        // Calculate the position of the selection
        const text = textarea.value;
        const lines = text.substr(0, placeholder.start).split('\n');
        const lineHeight = 20; // Approximate line height in pixels
        const linePosition = lines.length * lineHeight;

        // Set scroll position to ensure placeholder is visible in the middle of the textarea
        const textareaHeight = textarea.clientHeight;
        textarea.scrollTop = Math.max(0, linePosition - (textareaHeight / 2));
    };
    const selectTemplatePlaceholder = (index: number) => {
        if (!editableTextareaRef.current || index >= templatePlaceholders.length) return;

        const placeholder = templatePlaceholders[index];
        const textarea = editableTextareaRef.current;

        // Focus and select the placeholder text
        textarea.focus();
        textarea.setSelectionRange(placeholder.start, placeholder.end);

        // Calculate the position of the selection
        const text = textarea.value;
        const lines = text.substr(0, placeholder.start).split('\n');
        const lineHeight = 20; // Approximate line height in pixels
        const linePosition = lines.length * lineHeight;

        // Set scroll position to ensure placeholder is visible in the middle of the textarea
        const textareaHeight = textarea.clientHeight;
        textarea.scrollTop = Math.max(0, linePosition - (textareaHeight / 2));
    };

    // Function to handle tab key to jump between placeholders
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const now = Date.now();
            // Use a custom property on the event target to track the last Enter key time
            const textarea = e.currentTarget as HTMLTextAreaElement & { lastEnterTime?: number };
            if (textarea.lastEnterTime && now - textarea.lastEnterTime < 2000) {
                // If two returns occur within 2 seconds, submit the form
                textarea.lastEnterTime = 0;
            } else {
                textarea.lastEnterTime = now;
            }
        }

        // Add tab key navigation for placeholders
        if (e.key === 'Tab' && placeholders.length > 0) {
            e.preventDefault(); // Prevent default tab behavior

            // Get current cursor position
            const cursorPos = (e.currentTarget as HTMLTextAreaElement).selectionStart;

            // Find the next placeholder after cursor position
            let nextPlaceholder = placeholders.find(p => p.start > cursorPos);

            // If no next placeholder, loop back to the first one
            if (!nextPlaceholder && placeholders.length > 0) {
                nextPlaceholder = placeholders[0];
            }

            // Select the placeholder if found
            if (nextPlaceholder) {
                selectPlaceholder(placeholders.indexOf(nextPlaceholder));
            }
        }
    };

    const handleTemplateSelect = (template: PromptTemplate) => {
        setSelectedTemplateKey(template.title); // or template.id if available
        setEditableContent(`${template.content}`);
        setIsTemplatesOpen(false);
    };

    const handleRefineDomainPrompt = async () => {
        setIsRefiningDomain(true); // Set loading state
        const systemPrompt: Message = {
            role: 'assistant',
            content: `You are an expert consultant specializing in generating prompts. Leverage your extensive knowledge to help comprehensively define and scope the domain clearly and precisely.
    You are a prompt refinement expert. Your task is to take the user's input prompt and transform it into the most effective and complete prompt possible for an AI system. 
    Your output must strictly be a refined prompt, not a response or result of the prompt.

    # Instructions:

    1. Analyze the user's input prompt to understand the context, objectives, and requirements.
    2. Identify any missing details or placeholders and replace them with relevant suggestions or examples.
    3. Ensure the refined prompt is clear, concise, and actionable.
    4. Include specific instructions or guidelines for the AI to follow.
    5. Include a name, description, and a summary of the core topic of the prompt.
    6. Use Markdown formatting for the output.

    # Reasoning Steps:
    1. Identify the key elements of the content.
    2. Break down the content into manageable sections.
    3. Use the placeholders to guide the refinement process.
    4. Ensure the final output is coherent and follows a logical flow.
    5. Include specific instructions or guidelines for the AI to follow.

    # Output Format:
    Please format your response clearly using Markdown syntax for readability, employing headings, bullet points, emphasis, and numbered lists as appropriate.

    # Example:
    **User Input:** "Help me enhance this prompt. 
    # Domain Identification: Bike Rental Service 
    # Objective: Create a detailed domain definition for a bike rental service in a tourist area. 
    # Instructions: 
    1. Identify the key elements of the bike rental service domain.
    2. Break down the domain into manageable sections.
    3. Ensure the final output is coherent and follows a logical flow.
    4. Include specific instructions or guidelines for the AI to follow.
    **Refined Prompt:** "Write a detailed domain definition for a bike rental service in a tourist area.
    Include the following sections:
    # Domain Identification: 
    ## Name: Bike Rental Service
    ## Description: A service that provides bicycles for rent to tourists and locals in a specific area.
    ## Summary: A bike rental service that offers a variety of bicycles for rent, catering to tourists and locals in a popular tourist area.
    # Domain Scope:
    ## In-Scope: Bike rental service, repair service, rental app, customer demographics, pricing strategy, marketing strategies.
    ## Out-of-Scope: Bike sales, bike manufacturing, bike accessories.
    # Overview of the bike rental service
    ## Key features and services offered
    ## Core concepts and terminology
    ## Target market and customer demographics
    ## Pricing strategy and revenue model
    ## Marketing and promotional strategies
    ## Potential challenges and solutions
    ## Future growth opportunities and trends

    Include subject, description and examples and references to credible sources.
    Now, refine the user input domain prompt into an exceptional domain prompt:
    `
        };
        // build messages array and append file context if provided
        const userMessage: Message = {
            role: 'user',
            content: domainContent
        };
        const messages: Message[] = [systemPrompt, userMessage];
        if (importedFile) {
            messages.push({
                role: 'user',
                content: `## CONTEXT FROM FILE: ${importedFileName}\n\`\`\`\n${importedFile}\n\`\`\``
            });
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    model: selectedModel,
                    temperature: 0.7,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error && errorData.error.code === 'model_not_found') {
                    alert('The selected AI model is not available. Please choose a different model.');
                }
                throw new Error(errorData.error || 'Network response was not ok');
            }

            const data = await response.json();

            console.log("Response from server:", data.message);

            if (data && data.message) {
                if (isMounted.current) {
                    setDomainContent(data.message);
                    setHasRefined(true);
                }
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Error generating prompt:", error);
        } finally {
            if (isMounted.current) {
                setIsRefiningDomain(false); // Reset loading state
            }
        }
    };

    const handleInsertTemplate = () => {
        console.log('391 Inserting content:', editableContent);
        const firstSentence = editableContent.trim().split(/(?<=[.?!])\s/)[0];
        const restTemplate = editableContent.trim().split(/(?<=[.?!])\s/).slice(1).join(' ');
        const finalContent = `# Objective: ${firstSentence} 
# Role:
    Leverage your extensive knowledge to help comprehensively define and scope the domain in question clearly and precisely.

# Instructions:
    1. Analyze the provided content to understand the context, objectives, and requirements.
    2. Identify any missing details or placeholders and replace them with relevant suggestions or examples.
    3. Ensure the refined prompt is clear, concise, and actionable.

# Reasoning Steps:
    1. Identify the key elements of the context.
    2. Break down the content into manageable sections
    3. Ensure the final output is coherent and follows a logical flow.
    4. Include specific instructions or guidelines for the AI to follow.

# Output Format:
${restTemplate}
Please format your response clearly using Markdown syntax for readability, employing headings, bullet points, emphasis, and numbered lists as appropriate.

# Context
${domainContent}

# Constraints
1. Ensure clarity, conciseness, and logical flow.
2. Wrap any code in \`\`\`language …\`\`\` blocks.  
3. Only include diagrams (e.g., Mermaid) if specified in the task.

# Final Instructions
If you include code snippets, use triple backticks and specify the language.  
Do not wrap your entire response in backticks.



`
        onApplyTemplate(finalContent);
    };

    //IMPORTANT: In Mermaid Gantt charts, do not use colons in task names. The only colon should be between the task and its date/dependency.



    const handleRefinePrompt = async () => {
        setIsRefining(true); // Set loading state
        const systemPrompt: Message = {
            role: 'assistant',
            content: `You are a prompt refinement expert. Your task is to take the user's input and transform it into the most effective and complete prompt possible for an AI system. 
The generated prompt must be about what the user wants to achieve, create or write, and it should be clear, concise, and actionable.
Your output must strictly be a refined prompt, not a response or result to the user's input.

# Instructions:

1. Analyze the user's input to understand the context, objectives, and requirements.
2. Identify any missing details or placeholders and replace them with relevant suggestions or examples.
3. Ensure the refined prompt is clear, concise, and actionable.
4. include specific instructions or guidelines for the AI to follow.
5. Include a name and description of the core topic of the prompt.
6. Use Markdown formatting for the output.
7. User Mermaid syntax for any diagrams or visual representations.

# Example:
**User Input:** "Help me write a blog post about AI."
**Refined Prompt:** "Write a detailed blog post about the advancements in artificial intelligence, focusing on recent breakthroughs, applications in various industries, and potential future trends. 
Include subject, description and examples and references to credible sources."

Now, refine the following user input into an exceptional prompt:
`
        };
        // build messages array and append file context if provided
        const userMessage: Message = {
            role: 'user',
            content: editableContent
        };
        const messages: Message[] = [systemPrompt, userMessage];
        if (importedFile) {
            messages.push({
                role: 'user',
                content: `## CONTEXT FROM FILE: ${importedFileName}\n\`\`\`\n${importedFile}\n\`\`\``
            });
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    model: selectedModel,
                    temperature: 0.7,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error && errorData.error.code === 'model_not_found') {
                    alert('The selected AI model is not available. Please choose a different model.');
                }
                throw new Error(errorData.error || 'Network response was not ok');
            }

            const data = await response.json();

            console.log("Response from server:", data.message);

            if (data && data.message) {
                if (isMounted.current) {
                    setEditableContent(data.message);
                    setHasRefined(true);
                }
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Error generating prompt:", error);
        } finally {
            if (isMounted.current) {
                setIsRefining(false); // Reset loading state
            }
        }
    };

    return (
        <div className="flex flex-col gap-2 overflow-y-auto bg-secondary text-gray-100 shadow-lg h-[calc(100vh-9rem)]"> 
            <div className={`h-full border border-gray-400 p-3 rounded-md`}>
                <div className="flex justify-between items-center mb-2 ">
                    <h2 className="text-secondary-foreground text-lg font-bold">1. What topic would you like to make a prompt about ? </h2>
                    <button
                        onClick={() => setIsTopicVisible(prev => !prev)}
                        className={`${buttonOutline} text-sm text-foreground bg-background hover:bg-secondary/80`}
                    >
                        {isTopicVisible ? '▲' : '▼'}
                    </button>
                </div>
                {isTopicVisible && (
                    <div className="flex flex-col gap-2 rounded-md">

                        {/* Add placeholder jump buttons */}
                        {templatePlaceholders.length > 0 && (
                            <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                                <span className="text-sm text-gray-400">Click the button to jump to the placeholder ... </span>
                                {templatePlaceholders.map((placeholder, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectPlaceholder(idx)}
                                        className={buttonAccent}
                                    >
                                        {placeholder.text.length > 100
                                            ? `${placeholder.text.substring(0, 99)}...`
                                            : placeholder.text}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Domain Content Section */}
                        <TextareaAutosize
                            ref={textareaRef}
                            value={domainContent}
                            onChange={(e) => setDomainContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            minRows={4}
                            maxRows={20}
                            className="w-full p-2 border border-gray-700 rounded-md bg-background text-gray-100 bg-popover text-secondary-foreground text-base"
                            placeholder="You can type or paste your topic here... or click the + button to add a template or file from library"
                            id="editable-domain-textarea"
                        />
                        <div className="relative flex items-center gap-2">
                            <div className="relative bottom-0 left-0 z-50">
                                <div className="relative flex items-center gap-2">
                                    <button
                                        onClick={() => setIsPlusMenuOpen((open) => !open)}
                                        className=" hover:bg-gray-700 text-foreground rounded w-8 h-8 flex items-center justify-center shadow-lg text-3xl"
                                        aria-label="Open menu"
                                    >
                                        +
                                    </button>
                                    {isPlusMenuOpen && (
                                        <div className="absolute bottom-full left-0 bg-secondary border border-gray-600 rounded shadow-lg flex flex-col min-w-[100px]">
                                            <button
                                                className="px-2 py-2 text-gray-400 text-left hover:bg-blue-600 hover:text-foreground rounded-t flex items-center gap-2"
                                                onClick={() => {
                                                    handleDomainTemplate(domainIndex);
                                                    setIsPlusMenuOpen(false);
                                                }}
                                            >
                                                {/* Template Icon */}
                                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" className="text-blue-200" />
                                                    <path d="M8 8h8M8 12h8M8 16h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                                Template
                                            </button>
                                            <button
                                                className="px-2 py-2 text-left text-gray-400 hover:bg-blue-600 hover:text-white rounded-b flex items-center gap-2"
                                                onClick={() => {
                                                    setIsLibraryOpen(true);
                                                    setIsPlusMenuOpen(false);
                                                }}
                                            >
                                                {/* Library Icon */}
                                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <rect x="6" y="4" width="12" height="16" rx="2" fill="currentColor" className="text-green-200" />
                                                    <path d="M9 8h6M9 12h6M9 16h2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                                Library
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 justify-between text-foreground items-start ">
                                {domainContent !== initialDomainContent.current && (
                                    <>
                                        <button
                                            title="Click to refine the domain prompt"
                                            onClick={handleRefineDomainPrompt}
                                            className={`p-1 rounded text-foreground  ${isRefining ? 'opacity-50 cursor-not-allowed' : 'bg-outline  hover:bg-gray-700'}`}
                                            disabled={isRefining}
                                        >
                                            {isRefiningDomain ? (
                                                <div className="flex items-center">
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                    </svg>
                                                    <span>Generating...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className=" h-5 w-5 text-white" fill="orange" viewBox="0 0 20 20">
                                                        <rect x="4" y="7" width="12" height="8" rx="2" />
                                                        <rect x="7" y="3" width="6" height="4" rx="1" />
                                                        <circle cx="7.5" cy="11" r="1" fill="white" />
                                                        <circle cx="12.5" cy="11" r="1" fill="white" />
                                                        <rect x="9" y="15" width="2" height="2" rx="1" />
                                                    </svg>
                                                    Refine the prompt
                                                </div>
                                            )}
                                        </button>
                                        <button
                                            title="Click to same domain prompt to the library"
                                            onClick={() => handleSaveToRedux()}
                                            className={`p-1 text-foreground text-foreground  ${isRefining ? 'opacity-50 cursor-not-allowed' : 'bg-outline  hover:bg-gray-700'}`}
                                            disabled={isRefining}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M17 3H5a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2zM5 3h11a1 1 0 011 1v3H4V4a1 1 0 011-1z" />
                                            </svg>
                                            Save to Library
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Template Selection Section */}
            { (false) &&
            <div className="flex flex-col gap-2 border border-gray-400 rounded h-[60%]">
                <div className="shadow-lg overflow-y-auto">
                    <div className="flex justify-between items-center p-2 bg-secondary text-secondary-foreground">
                        <h2 className="text-secondary-foreground font-bold">2. Select Report Templates</h2>
                        <button
                            onClick={() => { setIsTemplatesOpen(!isTemplatesOpen) }}
                            className={`${buttonOutline} text-sm text-foreground bg-background hover:bg-secondary/80`}
                        >
                            {isTemplatesOpen ? '▲' : '▼'}
                        </button>
                    </div>
                    {isTemplatesOpen && (
                        <div className="flex-1 flex flex-col gap-2 h-[60%]">
                            <div className="flex bg-secondary text-secondary-foreground px-2 rounded-md mb-4">
                                <label htmlFor="category" className="block me-2 text-sm font-medium whitespace-nowrap">Filter by Category:</label>
                                <select
                                    id="category"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-2 border border-gray-600 rounded-md bg-secondary text-secondary-foreground"
                                >
                                    {CATEGORIES.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Template Selection Section */}
                            <div className="flex " id="templates-container">
                                {/* Business Templates Column */}
                                <div className="w-1/2 pr-2 bg-secondary text-secondary-foreground">
                                    <h3 className="text-xs font-semibold text-center">Business</h3>
                                    <div className="flex flex-col gap-1  h-[24vh] min-h-[10px] max-h-[40vh]  always-scrollbar">
                                        {/* Business templates will be rendered here */}
                                        {filteredTemplates.map((template) => (
                                            <button
                                                key={template.title}
                                                onClick={() => handleTemplateSelect(template)}
                                                className={`w-full p-1 rounded-md bg-popover text-secondary-foreground ${selectedTemplateKey === template.title
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-700 text-gray-100'
                                                    }`}
                                            >
                                                {template.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Personal Templates Column */}
                                <div className="w-1/2 pl-2 bg-secondary text-secondary-foreground ">
                                    <h3 className="text-xs font-semibold text-center">Personal</h3>
                                    <div className="flex flex-col gap-2 h-[24vh] min-h-[10px] max-h-[40vh] overflow-y-auto">
                                        {filteredTemplates
                                            .filter(template => template.usage === "Personal")
                                            .map((template, index) => {
                                                const actualIndex = filteredTemplates.findIndex(t => t === template);
                                                return (
                                                    <button
                                                        key={actualIndex}
                                                        onClick={() => handleTemplateSelect(filteredTemplates[actualIndex])}
                                                        className={`w-full p-1 rounded-md bg-popover text-secondary-foreground ${selectedTemplate === actualIndex
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-700 text-gray-300'
                                                            }`}
                                                    >
                                                        {template.title}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Editable Content Section */}
                <div className="flex flex-col gap-2 p-2 bg-secondary text-gray-100 shadow-lg overflow-y-auto">
                    {/* Custom Template Section */}
                    <h3 className="text-md font-semibold ml-1 bg-secondary text-secondary-foreground">
                        {selectedTemplate === null
                            ? 'Template Prompt'
                            : selectedTemplate === PROMPT_TEMPLATES.length - 1
                                ? 'Custom Template'
                                : 'Prompt for: ' + filteredTemplates[selectedTemplate]?.title}
                    </h3>

                    {/* Add placeholder jump buttons */}
                    {placeholders.length > 0 && (
                        <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                            <span className="text-sm text-gray-400">Click the button to jump to the placeholder ... </span>
                            {placeholders.map((placeholder, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectTemplatePlaceholder(idx)}
                                    className={buttonAccent}
                                >
                                    {placeholder.text.length > 100
                                        ? `${placeholder.text.substring(0, 99)}...`
                                        : placeholder.text}
                                </button>
                            ))}
                        </div>
                    )}
                    <TextareaAutosize
                        ref={editableTextareaRef}
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        minRows={5}
                        maxRows={30}
                        className="w-full p-2 border border-gray-600 rounded-md bg-background text-gray-100 bg-popover text-secondary-foreground text-base"
                        placeholder="You can edit the content here before inserting..."
                        id="editable-content-textarea"
                    />
                    <div className="flex items-center justify-end gap-4">
                        <button
                            title="Insert Prompt with Context into Chat"
                            onClick={handleInsertTemplate}
                            className={`${buttonOutline} hover:bg-blue-700 text-white rounded-full w-120 h-12 px-5 flex items-center justify-center shadow-lg text-2xl relative group`}
                            aria-label="Insert Prompt with Context into Chat    "
                            type="button"
                        >
                            <div className="flex gap-2 text-sm text-gray-300">
                                Insert this prompt into chat
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            }
            {/* Library Modal */}
            {isLibraryOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-4 rounded-md w-3/4 max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Library Documents</h2>
                            <button
                                onClick={() => setIsLibraryOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-2">
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Filter documents by name..."
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                                    onChange={(e) => setDocFilter(e.target.value)}
                                    value={docFilter}
                                />
                            </div>
                            <div className="mb-2 flex gap-2">
                                <button
                                    className="px-3 py-1 bg-blue-600 rounded-md text-sm hover:bg-blue-700"
                                    onClick={() => setDocFilter("Domain")}
                                >
                                    Show Domain Docs
                                </button>
                                <button
                                    className="px-3 py-1 bg-gray-600 rounded-md text-sm hover:bg-gray-700"
                                    onClick={() => setDocFilter("")}
                                >
                                    Show All
                                </button>
                            </div>
                            {documents
                                .filter(doc => doc.name.toLowerCase().startsWith(docFilter.toLowerCase()))
                                .map(doc => (
                                    <div
                                        key={doc.id}
                                        className="p-2 border border-gray-600 rounded-md hover:bg-gray-700 cursor-pointer"
                                        onClick={() => {
                                            setDomainContent(doc.content);
                                            setIsLibraryOpen(false);
                                        }}
                                    >
                                        <div className="font-semibold">{doc.name}</div>
                                        <div className="text-sm text-gray-400">
                                            {new Date(doc.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            {documents.length === 0 && (
                                <div className="text-gray-400 text-center py-4">
                                    No documents saved in library
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setIsLibraryOpen(false)}
                                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div>
    );
}