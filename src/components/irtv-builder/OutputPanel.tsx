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
import { ObjectCard } from '@/components/object-card';
import { ModelviewCard } from '@/components/modelview-card'; // Adjust path as needed
import { setNewModel, setObjects, setRelationships, setNewModelview, setFocusModel, setPhFocus, Metis, Model } from '@/features/model-universe/modelSlice';
import { object } from 'zod';
import { ObjectSchema } from '@/objectSchema';

interface DocumentPanelProps {
    irtvPreview: string; // The preview content to display
    setIrtvPreview: React.Dispatch<React.SetStateAction<string>>;
    irtvContent: string | Model | null; // The main content, can be string or Model
    setIrtvContent: React.Dispatch<React.SetStateAction<string | Model | null>>;
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
    irtvPreview,
    setIrtvPreview,
    irtvContent,
    setIrtvContent,
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
    // console.log('DocumentPanel render - irtvContent:', irtvContent?.substring(0, 100) || 'empty');
    // console.log('DocumentPanel render - irtvContent length:', irtvContent?.length || 0);
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(typeof irtvContent === 'string' ? irtvContent : (irtvContent?.description || ''));
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<{ text: string, start: number, end: number }[]>([]);
    const buttonAccent = "px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap";
    const message = { content: irtvContent || '' }; // Default message content
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state
    const [activeTab, setActiveTab] = useState('current-knowledge');

    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    // const [metis, setMetis] = useState<Metis | null >(null);
    const [currentModel, setCurrentModel] = useState<Model | null>(null);
    const [currentModelview, setCurrentModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);
    const [model, setModel] = useState<Model>(currentModel ?? { id: '', name: '', description: '', objects: [], relships: [], metamodelRef: '', modelviews: [] });
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [modelview, setModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(currentModelview ?? { id: '', name: '', description: '', objectviews: [], relshipviews: [] });


    useEffect(() => {
        if (!irtvContent) {
            setIsEditing(true);
        }
    }, []);
    // Update editContent when irtvContent changes from parent
    useEffect(() => {
        setEditContent(typeof irtvContent === 'string' ? irtvContent : (irtvContent && 'description' in irtvContent ? irtvContent.description : ''));
    }, [irtvContent]);

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
        // Don't clear irtvContent when canceling, just reset editContent to original
        setEditContent(typeof irtvContent === 'string' ? irtvContent : (irtvContent?.description || ''));
        setIsEditing(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        onEdit();
    };

    const handleSaveToLibrary = () => {
        // Save to library in Redux store if irtvContent is not null and is not a string
        if (irtvContent && typeof irtvContent !== 'string') {
            dispatch(setObjects(irtvContent.objects));
            dispatch(setRelationships(irtvContent.relships));
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

    const handleDispatchIrtvData = () => {
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

        // Narrow irtvContent to a Model before accessing its properties
        const isIrtvModel = irtvContent !== null && typeof irtvContent === 'object';

        // Merge: model (generated) into focusModel
        const mergedModel: Model = {
            ...focusModel,
            // Use narrowed access with fallback values
            name: isIrtvModel ? (irtvContent as Model).name : 'Generated Model',
            description: isIrtvModel ? (irtvContent as Model).description || '' : '',
            objects: [
                // existing focus model objects
                ...focusModel.objects,
                // append generated objects if irtvContent is a Model, else nothing
                ...(isIrtvModel && (irtvContent as Model).objects ? (irtvContent as Model).objects : []),
            ],
            relships: [
                // existing focus model relationships
                ...focusModel.relships,
                // append generated relationships if irtvContent is a Model, else nothing
                ...(isIrtvModel && (irtvContent as Model).relships ? (irtvContent as Model).relships : []),
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
                                <TabsTrigger value="model" className='pb-2 mt-3'>Objects/Relationships</TabsTrigger>
                                <TabsTrigger value="modelview" className='pb-2 mt-3'>Modelview</TabsTrigger>
                            </TabsList>

                            <TabsContent value="current-knowledge" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                <div className="mx-1 ">
                                    {irtvPreview && (
                                        <MarkdownPreview mdPreview={irtvPreview} />
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="model" className="m-0 px-1 rounded bg-background h-[calc(100vh-2rem)] ">
                                <div className="flex flex-col h-full w-full">
                                    <button
                                        title="Save to Library"
                                        onClick={handleDispatchIrtvData}
                                        className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex flex-row-reverse items-center gap-1`}
                                    >
                                        <BookmarkPlus className="h-4 w-4" />
                                    </button>
                                    <div className="text-xs w-full">
                                        <ObjectCard model={{
                                            id: typeof irtvContent === 'object' && irtvContent ? irtvContent.id : crypto.randomUUID(),
                                            name: typeof irtvContent === 'object' && irtvContent ? irtvContent.name : 'Generated Model',
                                            description: typeof irtvContent === 'object' && irtvContent ? irtvContent.description : '',
                                            objects: typeof irtvContent === 'object' && irtvContent && irtvContent.objects ? irtvContent.objects.map(obj => ({
                                                id: obj.id || crypto.randomUUID(),
                                                name: obj.name,
                                                description: obj.description,
                                                proposedType: obj.proposedType || '',
                                                typeRef: obj.typeRef,
                                                typeName: obj.typeName,
                                                category: obj.category,
                                            })) : [],
                                            relships: (irtvContent && typeof irtvContent === 'object' && 'relships' in irtvContent ? irtvContent.relships.map(rel => ({
                                                id: rel.id || crypto.randomUUID(),
                                                name: rel.name || '',
                                                typeRef: rel.typeRef || '',
                                                fromobjectRef: rel.fromobjectRef || '',
                                                nameFrom: rel.nameFrom || '',
                                                toobjectRef: rel.toobjectRef || '',
                                                nameTo: rel.nameTo || '',
                                            })) : []),
                                            metamodelRef: irtvContent && typeof irtvContent === 'object' ? irtvContent.metamodelRef || '' : '',
                                            modelviews: irtvContent && typeof irtvContent === 'object' ? irtvContent.modelviews || [] : []
                                        }}
                                        />
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