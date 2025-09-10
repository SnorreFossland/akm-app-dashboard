'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Card, CardTitle } from '@/components/ui/card';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import { Edit, Clipboard, Library, Save, X, BookmarkPlus, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingCircularProgress } from "@/components/loading";

import { saveMarkdownDocument } from '@/features/model-universe/modelSlice';
import { ModelviewCard } from '@/components/modelview-card'; // Adjust path as needed
import { setNewModel, setObjects, setRelationships, setNewModelview, setFocusModel, setPhFocus, Metis, Model } from '@/features/model-universe/modelSlice';
import { object } from 'zod';
import { ObjectSchema } from '@/objectSchema';

interface DocumentPanelProps {
    mvPreview: string; // The preview content to display
    setMvPreview: React.Dispatch<React.SetStateAction<string>>;
    mvContent: string | Model | null; // The main content, can be string or Model
    setMvContent: React.Dispatch<React.SetStateAction<string | Model | null>>;
    onEdit?: () => void;
    onPaste?: () => void;
    onLibrary?: () => void;
    onSave?: (content: string) => void;
    onSaveToLibrary?: (content: string) => void;
    setIsLibraryOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    isLibraryOpen?: boolean;
    documentId?: string; // Optional document ID for updates
    panelType?: string; // 'left' or 'right'
}

export default function DocumentPanel({
    mvPreview,
    setMvPreview,
    mvContent,
    setMvContent,
    onEdit = () => { },
    onPaste = () => { },
    onLibrary = () => { },
    onSave = () => { },
    onSaveToLibrary = () => { },
    documentId,
    setIsLibraryOpen = () => { },
    isLibraryOpen = false,
    panelType = 'left' // Default to 'left' panel type
}: DocumentPanelProps) {
    // Add debugging
    // console.log('DocumentPanel render - mvContent:', mvContent?.substring(0, 100) || 'empty');
    // console.log('DocumentPanel render - mvContent length:', mvContent?.length || 0);
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(typeof mvContent === 'string' ? mvContent : (mvContent?.description || ''));
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<{ text: string, start: number, end: number }[]>([]);
    const buttonAccent = "px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap";
    const message = { content: mvContent || '' }; // Default message content
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state
    const [activeTab, setActiveTab] = useState('current-knowledge');

    // Allow external trigger to switch to the Modelview Objectviews/Relshipviews tab
    useEffect(() => {
        const handler = () => setActiveTab('model');
        window.addEventListener('outputpanel:activateModelview', handler);
        return () => window.removeEventListener('outputpanel:activateModelview', handler);
    }, []);

    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    // const [metis, setMetis] = useState<Metis | null >(null);
    const [currentModel, setCurrentModel] = useState<Model | null>(null);
    const [currentModelview, setCurrentModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);
    const [model, setModel] = useState<Model>(currentModel ?? { id: '', name: '', description: '', objects: [], relships: [], metamodelRef: '', modelviews: [] });
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [modelview, setModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(currentModelview ?? { id: '', name: '', description: '', objectviews: [], relshipviews: [] });

    // Parse incoming mvContent into local modelview for preview tabs
    useEffect(() => {
        if (!mvContent) return;
        try {
            if (typeof mvContent === 'string') {
                const parsed = JSON.parse(mvContent);
                if (parsed && (parsed.objectviews || parsed.relshipviews)) {
                    setModelview(parsed);
                }
            } else if (typeof mvContent === 'object') {
                setModelview(mvContent as any);
            }
        } catch (err) {
            // keep as-is; preview tab can still show raw content
        }
    }, [mvContent]);


    useEffect(() => {
        if (!mvContent) {
            setIsEditing(true);
        }
    }, []);
    // Update editContent when mvContent changes from parent
    useEffect(() => {
        setEditContent(typeof mvContent === 'string' ? mvContent : (mvContent && 'description' in mvContent ? mvContent.description : ''));
    }, [mvContent]);

    // Function to detect placeholders in the format [placeholder]
    useEffect(() => {
        if (!editContent) {
            setTemplatePlaceholders([]);
            return;
        }

        const placeholderRegex = /\[([^\[\]]+)\]/g;
        const placeholders: { text: string, start: number, end: number }[] = [];
        let match;

        while ((match = placeholderRegex.exec(editContent)) !== null) {
            placeholders.push({
                text: match[1],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        setTemplatePlaceholders(placeholders);
    }, [editContent]);


    // Add this function with your other handler functions
    const handleSaveToFile = (content: string) => {
        // Create a blob with the content
        const blob = new Blob([content], { type: 'text/markdown' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Extract title from first line for filename
        const firstLine = 'AIChat: ' + content.split('\n')[0].replace(/^[#\-*>`_]+\s*/, '');
        const cleanTitle = firstLine.replace(/[#*/\\:?<>|"]/g, '').trim().substring(0, 50); // Clean title for filename
        const fileName = `${cleanTitle || 'document'}.md`;

        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show confirmation
        setStatusMsg(`Saved "${fileName}" to downloads`);
        setTimeout(() => setStatusMsg(''), 30000);
    };

    const handleCancel = () => {
        // Don't clear mvContent when canceling, just reset editContent to original
        setEditContent(typeof mvContent === 'string' ? mvContent : (mvContent?.description || ''));
        setIsEditing(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        onEdit();
    };

    const handleSaveToLibrary = () => {
        // Save to library in Redux store if mvContent is not null and is not a string
        if (mvContent && typeof mvContent !== 'string') {
            dispatch(setObjects(mvContent.objects));
            dispatch(setRelationships(mvContent.relships));
        }

        // Also call the prop callback for parent components
        // onSaveToLibrary(contentToSave);
    };

    const handleSave = () => {
        dispatch(saveMarkdownDocument({
            id: documentId || Date.now().toString(),
            name: documentId ? 'Updated Document' : 'Document ' + Date.now(),
            content: editContent,
            createdAt: new Date().toISOString()
        }));

        onSave(editContent);
        setIsEditing(false);
    };

    // Define placeholders based on panel type
    const getPlaceholder = () => {
        if (panelType === 'left') {
            return 'Type, paste content, or load from library. This will be used as context for AI chat.';
        }
        return '' // 'Click Markdown Preview to view or edit your document.';
    };

    const getEmptyMessage = () => {
        if (panelType === 'left') {
            return 'No response document. Click Edit to start writing or Library to load content.';
        }
        return 'No document selected!';
    };

    // Function to select and jump to a placeholder
    const selectTemplatePlaceholder = (idx: number) => {
        if (!textareaRef.current) return;

        const placeholder = templatePlaceholders[idx];
        if (!placeholder) return;

        // Focus the textarea
        textareaRef.current.focus();

        // Set selection range to highlight the placeholder
        textareaRef.current.setSelectionRange(
            placeholder.start,
            placeholder.end
        );

        // Scroll the placeholder into view if needed
        const textarea = textareaRef.current;

        // Get character position information
        const charInfo = getCaretCoordinates(textarea, placeholder.start);

        // Calculate scroll position
        if (charInfo) {
            const scrollTop = textarea.scrollTop;
            const offsetTop = charInfo.top;
            const textareaHeight = textarea.clientHeight;

            // Adjust scroll if needed to ensure the placeholder is visible
            if (offsetTop < scrollTop || offsetTop > scrollTop + textareaHeight - 30) {
                textarea.scrollTop = Math.max(0, offsetTop - textareaHeight / 2);
            }
        }
    };

    // Helper function to get caret coordinates in a textarea
    function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
        // Create a dummy element to measure text dimensions
        const div = document.createElement('div');
        // Copy styles that affect dimensions
        const styles = window.getComputedStyle(element);
        const props = [
            'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing',
            'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom',
            'width', 'lineHeight', 'textAlign', 'wordSpacing', 'whiteSpace'
        ];

        props.forEach(prop => {
            const value = styles[prop as keyof typeof styles];
            div.style[prop as any] = value !== null ? value.toString() : '';
        });

        // Set content up to the caret position
        div.textContent = element.value.substring(0, position);

        // Create a span where the caret would be
        const span = document.createElement('span');
        span.textContent = element.value.charAt(position) || '.';
        div.appendChild(span);

        // Position absolutely out of view
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        document.body.appendChild(div);

        // Measure position
        const rect = span.getBoundingClientRect();
        const result = {
            top: rect.top - div.getBoundingClientRect().top,
            left: rect.left - div.getBoundingClientRect().left,
            height: rect.height
        };

        document.body.removeChild(div);
        return result;
    }

    const handleDispatchMvData = () => {
        console.log('69 HandleDispatch:', dispatchDone); //, modelview, model);
        if (!model && !modelview) {
            alert('No IRTV to dispatch');
            return;
        }

        const focusModel =
            data?.phData?.metis?.models?.find((m: Model) => m.id === data?.phFocus?.focusModel?.id) ||
            data?.phData?.metis?.models?.[0];

        console.log('270 Focus Model:', focusModel);

        if (!focusModel) {
            alert('No base model available');
            return;
        }

        // Narrow mvContent to a Model before accessing its properties
        const isIrtvModel = mvContent !== null && typeof mvContent === 'object';

        // Merge: model (generated) into focusModel
        const mergedModel: Model = {
            ...focusModel,
            // Use narrowed access with fallback values
            name: isIrtvModel ? (mvContent as Model).name : 'Generated Model',
            description: isIrtvModel ? (mvContent as Model).description || '' : '',
            objects: [
                // existing focus model objects
                ...focusModel.objects,
                // append generated objects if mvContent is a Model, else nothing
                ...(isIrtvModel && (mvContent as Model).objects ? (mvContent as Model).objects : []),
            ],
            relships: [
                // existing focus model relationships
                ...focusModel.relships,
                // append generated relationships if mvContent is a Model, else nothing
                ...(isIrtvModel && (mvContent as Model).relships ? (mvContent as Model).relships : []),
            ]
        }

        const phFocus = {
            focusModel: focusModel,
            focusModelview: { id: modelview?.id || '', name: modelview?.name || '' },
            focusObject: data?.phFocus?.focusObject || { id: '', name: '' },
            focusObjectview: data?.phFocus?.focusObjectview || { id: '', name: '' },
            focusProj: data?.phFocus?.focusProj || { id: '', name: '' }
        };

        console.log('82 Merged Model:', focusModel, mergedModel);
        setCurmod(mergedModel);
        dispatch(setNewModel(mergedModel));
        dispatch(setFocusModel({ id: mergedModel.id, name: mergedModel.name }));
        dispatch(setPhFocus(phFocus));

        if (modelview) {
            const completeModelview = {
                ...modelview,
                id: modelview.id || crypto.randomUUID(),
                name: modelview.name || 'Default View',
                description: modelview.description || '',
                modelRef: mergedModel.id || '',
                modified: false,
                markedAsDeleted: false,
                objectviews: modelview.objectviews || [],
                relshipviews: modelview.relshipviews || []
            };
            dispatch(setNewModelview([completeModelview]));
        }

        setDispatchDone(true);
    };

    return (
        <div className="p-0 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col h-full w-full">
            {/* <div className="flex items-center justify-between mb-2 px-1">
                <div className="text-sm text-gray-400">Objects and Relships Preview</div>
            </div> */}
            <div className="prose prose-invert custom-markdown markdown-preview bg-secondary p-1 rounded-md overflow-auto  max-w-full whitespace-pre-wrap break-words">
                {/* <div className="h-full w-full"> */}
                {data
                    ? <Card className="bg-transparent w-full h-full overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="current-knowledge" className='pb-2 mt-3'>Preview</TabsTrigger>
                                <TabsTrigger value="model" className='pb-2 mt-3'>Modelview Objectviews/Relshipviews</TabsTrigger>
                                <TabsTrigger value="modelview" className='pb-2 mt-3'>Modelview</TabsTrigger>
                            </TabsList>

                            <TabsContent value="current-knowledge" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                <div className="mx-1 ">
                                    {mvPreview && (
                                        <MarkdownPreview mdPreview={mvPreview} />
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="model" className="m-0 px-1 rounded bg-background h-[calc(100vh-2rem)] ">
                                <div className="flex flex-col h-full w-full">
                                    <button
                                        title="Save to Library"
                                        onClick={handleDispatchMvData}
                                        className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex flex-row-reverse items-center gap-1`}
                                    >
                                        <BookmarkPlus className="h-4 w-4" />
                                    </button>
                                    <div className="text-xs w-full">
                                        {modelview && (
                                            <ModelviewCard
                                                modelviews={[{
                                                    name: modelview.name || 'Default View',
                                                    description: modelview.description || '',
                                                    objectviews: modelview.objectviews || [],
                                                    relshipviews: modelview.relshipviews || []
                                                } as any]}
                                            />
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="modelview" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                <div className="mx-1 ">
                                    {modelview && <ModelviewCard modelviews={[{
                                        // Use type assertion to match what ModelviewCard expects
                                        name: modelview.name || 'Default View',
                                        description: modelview.description || '',
                                        objectviews: modelview.objectviews || [],
                                        relshipviews: modelview.relshipviews || []
                                    } as any]} />}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>
                    : <div className="flex justify-center items-center h-screen">
                        <LoadingCircularProgress />
                    </div>
                }
                {/* </div> */}
            </div>
        </div >
    );
}
