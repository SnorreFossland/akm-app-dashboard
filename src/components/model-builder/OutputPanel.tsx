'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Card, CardTitle } from '@/components/ui/card';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import DiffModal from '@/components/ai-chat/DiffModal';
import { Edit, Clipboard, Library, Save, X, BookmarkPlus, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingCircularProgress } from "@/components/loading";

import { saveMarkdownDocument } from '@/features/model-universe/modelSlice';
import { ObjectCard } from '@/components/object-card';
import { ModelviewCard } from '@/components/modelview-card'; // Adjust path as needed
import { setNewModel, setNewModelview, setFocusModel, setPhFocus, Model } from '@/features/model-universe/modelSlice';
import { ObjectSchema } from '@/objectSchema';

interface DocumentPanelProps {
    modelPreview: string; // The preview content to display
    setModelPreview: React.Dispatch<React.SetStateAction<string>>;
    modelContent: string | Model | null; // The main content, can be string or Model
    setmodelContent: React.Dispatch<React.SetStateAction<string | Model | null>>;
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

type PendingSavePayload = {
    focusModel: { id: string; name: string };
    mergedModel: Model;
};

export default function DocumentPanel({
    modelPreview,
    setModelPreview,
    modelContent,
    setmodelContent,
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
    // console.log('DocumentPanel render - modelContent:', modelContent?.substring(0, 100) || 'empty');
    // console.log('DocumentPanel render - modelContent length:', modelContent?.length || 0);
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch();
    const [dispatchDone, setDispatchDone] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(typeof modelContent === 'string' ? modelContent : (modelContent?.description || ''));
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [templatePlaceholders, setTemplatePlaceholders] = useState<{ text: string, start: number, end: number }[]>([]);
    const buttonAccent = "px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md whitespace-nowrap";
    const message = { content: modelContent || '' }; // Default message content
    const [statusMsg, setStatusMsg] = useState(''); // <-- error state
    const [activeTab, setActiveTab] = useState('current-knowledge');

    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    // const [metis, setMetis] = useState<Metis | null >(null);
    const [currentModel, setCurrentModel] = useState<Model | null>(null);
    const [currentModelview, setCurrentModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(null);
    const [model, setModel] = useState<Model>(currentModel ?? { id: '', name: '', description: '', objects: [], relships: [], metamodelRef: '', modelviews: [] });
    const [curmod, setCurmod] = useState<Model | null>(null);
    const [modelview, setModelview] = useState<{ id?: string; name?: string; description?: string; objectviews?: any[]; relshipviews?: any[] } | null>(currentModelview ?? { id: '', name: '', description: '', objectviews: [], relshipviews: [] });
    const [showDiffModal, setShowDiffModal] = useState(false);
    const [pendingSavePayload, setPendingSavePayload] = useState<PendingSavePayload | null>(null);
    const [diffOldContent, setDiffOldContent] = useState('');
    const [diffNewContent, setDiffNewContent] = useState('');
    const [diffTitle, setDiffTitle] = useState('Model changes');


    useEffect(() => {
        if (!modelContent) {
            setIsEditing(true);
        }
    }, []);
    // Update editContent when modelContent changes from parent
    useEffect(() => {
        setEditContent(typeof modelContent === 'string' ? modelContent : (modelContent && 'description' in modelContent ? modelContent.description : ''));
    }, [modelContent]);

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
        // Don't clear modelContent when canceling, just reset editContent to original
        setEditContent(typeof modelContent === 'string' ? modelContent : (modelContent?.description || ''));
        setIsEditing(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        onEdit();
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

    const normalizeObjectsForDiff = (objects: any[] = []) =>
        [...objects]
            .map((obj) => ({
                id: obj?.id || '',
                name: obj?.name || '',
                description: obj?.description || '',
                typeName: obj?.typeName || obj?.proposedType || '',
                typeRef: obj?.typeRef || '',
                typeviewRef: obj?.typeviewRef || ''
            }))
            .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

    const normalizeRelshipsForDiff = (relships: any[] = []) =>
        [...relships]
            .map((rel) => ({
                id: rel?.id || '',
                name: rel?.name || '',
                typeRef: rel?.typeRef || '',
                fromobjectRef: rel?.fromobjectRef || '',
                nameFrom: rel?.nameFrom || '',
                toobjectRef: rel?.toobjectRef || '',
                nameTo: rel?.nameTo || ''
            }))
            .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

    const formatModelForDiff = (model?: Model | null) => {
        if (!model) return '';
        const objects = normalizeObjectsForDiff(model.objects || []);
        const relships = normalizeRelshipsForDiff(model.relships || []);
        const lines = [];
        lines.push('Objects:');
        if (objects.length === 0) {
            lines.push('  (none)');
        } else {
            objects.forEach((obj) => {
                lines.push(JSON.stringify(obj, null, 2));
            });
        }
        lines.push('');
        lines.push('Relationships:');
        if (relships.length === 0) {
            lines.push('  (none)');
        } else {
            relships.forEach((rel) => {
                lines.push(JSON.stringify(rel, null, 2));
            });
        }
        return lines.join('\n');
    };

    const normalizeNameForKey = (value?: string) =>
        (value || '')
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[\-_]+/g, ' ')
            .replace(/\s+/g, ' ');

    const getObjectKey = (obj: Partial<Model['objects'][number]>) =>
        `${normalizeNameForKey(obj?.name)}::${(obj?.typeName || '').toLowerCase().trim()}`;

    const getRelKey = (name?: string, from?: string, to?: string) =>
        `${(name || '').toLowerCase().trim()}::${(from || '').trim()}::${(to || '').trim()}`;

    const dedupeObjects = (baseObjects: Model['objects'], newObjects: Model['objects']) => {
        const normalizedIndex = baseObjects.reduce<Record<string, string>>((map, obj) => {
            const key = getObjectKey(obj);
            if (key && !(key in map)) {
                map[key] = obj.id;
            }
            map[obj.id] = obj.id;
            return map;
        }, {} as Record<string, string>);

        const mergedObjects: Model['objects'] = [...baseObjects];
        const objectIdMap: Record<string, string> = {};

        baseObjects.forEach((obj) => {
            objectIdMap[obj.id] = obj.id;
        });

        newObjects.forEach((obj) => {
            if (!obj) return;
            const candidateId = obj.id || crypto.randomUUID();
            const normalizedKey = getObjectKey({ ...obj, id: candidateId });
            if (normalizedKey && normalizedKey in normalizedIndex) {
                objectIdMap[candidateId] = normalizedIndex[normalizedKey];
                return;
            }

            const newId = candidateId;
            normalizedIndex[normalizedKey] = newId;
            objectIdMap[candidateId] = newId;
            mergedObjects.push({ ...obj, id: newId });
        });

        return { mergedObjects, objectIdMap };
    };

    const dedupeRelships = (
        baseRelships: Model['relships'],
        newRelships: Model['relships'],
        objectIdMap: Record<string, string>
    ) => {
        const normalizedIndex = new Set<string>();
        const mergedRelships: Model['relships'] = [...baseRelships];

        baseRelships.forEach((rel) => {
            normalizedIndex.add(getRelKey(rel.name, rel.fromobjectRef, rel.toobjectRef));
        });

        newRelships.forEach((rel) => {
            if (!rel) return;
            const actualFrom = objectIdMap[rel.fromobjectRef] || rel.fromobjectRef;
            const actualTo = objectIdMap[rel.toobjectRef] || rel.toobjectRef;
            if (!actualFrom || !actualTo) return;
            const key = getRelKey(rel.name, actualFrom, actualTo);
            if (normalizedIndex.has(key)) {
                return;
            }
            normalizedIndex.add(key);
            mergedRelships.push({
                ...rel,
                id: rel.id || crypto.randomUUID(),
                fromobjectRef: actualFrom,
                toobjectRef: actualTo
            });
        });

        return mergedRelships;
    };

    const createMergedModel = (focusModel: Model) => {
        const isModel = modelContent !== null && typeof modelContent === 'object';
        const generatedModel = isModel ? (modelContent as Model) : null;

        if (!generatedModel) {
            return focusModel;
        }

        const { mergedObjects, objectIdMap } = dedupeObjects(
            focusModel.objects || [],
            generatedModel.objects || []
        );

        const mergedRelships = dedupeRelships(
            focusModel.relships || [],
            generatedModel.relships || [],
            objectIdMap
        );

        return {
            ...focusModel,
            name: generatedModel.name || focusModel.name,
            description: generatedModel.description || focusModel.description,
            objects: mergedObjects,
            relships: mergedRelships
        } as Model;
    };

    const applyMergedModel = (focusModel: Model, mergedModel: Model) => {

        const phFocus = {
            focusModel: { id: focusModel.id, name: focusModel.name },
            focusModelview: { id: modelview?.id || '', name: modelview?.name || '' },
            focusObject: data?.phFocus?.focusObject || { id: '', name: '' },
            focusObjectview: data?.phFocus?.focusObjectview || { id: '', name: '' },
            focusProj: data?.phFocus?.focusProj || { id: '', name: '', description: '' },
            focusObjectIds: data?.phFocus?.focusObjectIds ?? [],
            focusRelshipIds: data?.phFocus?.focusRelshipIds ?? [],
        };

        setCurmod(mergedModel);
        dispatch(setNewModel(mergedModel));
        dispatch(setFocusModel({ id: mergedModel.id, name: mergedModel.name }));
        dispatch(setPhFocus({
            ...phFocus,
            focusObjectIds: phFocus.focusObjectIds ?? [],
            focusRelshipIds: phFocus.focusRelshipIds ?? [],
        }));

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
        setStatusMsg('Saved to library');
        setTimeout(() => setStatusMsg(''), 3000);
    };

    const handleDiffConfirm = () => {
        if (pendingSavePayload) {
            applyMergedModel(
                pendingSavePayload.mergedModel,
                pendingSavePayload.mergedModel
            );
        }
        setPendingSavePayload(null);
        setShowDiffModal(false);
    };

    const handleDiffCancel = () => {
        setPendingSavePayload(null);
        setShowDiffModal(false);
    };

    const handleSaveToLibraryWithApproval = () => {
        if (!modelContent || typeof modelContent === 'string') {
            setStatusMsg('No generated model to save');
            setTimeout(() => setStatusMsg(''), 3000);
            return;
        }

        const focusModel =
            data?.phData?.metis?.models?.find((m: Model) => m.id === data?.phFocus?.focusModel?.id) ||
            data?.phData?.metis?.models?.[0];

        if (!focusModel) {
            setStatusMsg('No base model available');
            setTimeout(() => setStatusMsg(''), 3000);
            return;
        }

        const mergedModel = createMergedModel(focusModel);
        const oldContent = formatModelForDiff(focusModel);
        const newContent = formatModelForDiff(mergedModel);

        if (oldContent === newContent) {
            applyMergedModel(focusModel, mergedModel);
            return;
        }

        setDiffTitle(`${focusModel.name || 'Model'} changes`);
        setDiffOldContent(oldContent);
        setDiffNewContent(newContent);
        setPendingSavePayload({ focusModel: { id: focusModel.id, name: focusModel.name }, mergedModel });
        setShowDiffModal(true);
    };

    return (
        <>
            <div className="p-0 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col h-full w-full">
                {/* <div className="flex items-center justify-between mb-2 px-1">
                <div className="text-sm text-gray-400">Objects and Relships Preview</div>
            </div> */}
                <div className="prose prose-invert custom-markdown markdown-preview bg-secondary p-1 rounded-md overflow-auto  max-w-full whitespace-pre-wrap break-words">
                    {/* <div className="h-full w-full"> */}
                    {data
                        ? <Card className="bg-transparent w-full h-full overflow-hidden">
                            {/* <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="current-knowledge" className='pb-2 mt-3'>Preview</TabsTrigger>
                                <TabsTrigger value="model" className='pb-2 mt-3'>Objects/Relationships</TabsTrigger>
                                <TabsTrigger value="modelview" className='pb-2 mt-3'>Modelview</TabsTrigger>
                            </TabsList>

                            <TabsContent value="current-knowledge" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
                                <div className="mx-1 ">
                                    {modelPreview && (
                                        <MarkdownPreview mdPreview={modelPreview} />
                                    )}
                                </div>
                            </TabsContent> */}

                            {/* <TabsContent value="model" className="m-0 px-1 rounded bg-background h-[calc(100vh-2rem)] "> */}
                            <div className="flex flex-col h-full w-full">
                                {(modelContent && typeof modelContent === 'object') ? (
                                    <>
                                        <button
                                            title="Save to Library"
                                            onClick={handleSaveToLibraryWithApproval}
                                            className={`text-xs ms-2 ${statusMsg === '' ? 'text-green-400 hover:text-green-200' : 'text-gray-400'} flex flex-row-reverse items-center gap-1`}
                                        >
                                            <BookmarkPlus className="h-4 w-4" />
                                        </button>
                                        <div className="text-xs w-full">
                                            <ObjectCard model={{
                                                id: typeof modelContent === 'object' && modelContent ? modelContent.id : crypto.randomUUID(),
                                                name: typeof modelContent === 'object' && modelContent ? modelContent.name : 'Generated Model',
                                                description: typeof modelContent === 'object' && modelContent ? modelContent.description : '',
                                                objects: typeof modelContent === 'object' && modelContent && modelContent.objects ? modelContent.objects.map(obj => ({
                                                    id: obj.id || crypto.randomUUID(),
                                                    name: obj.name,
                                                    description: obj.description,
                                                    proposedType: obj.proposedType || '',
                                                    typeRef: obj.typeRef,
                                                    typeName: obj.typeName,
                                                    category: obj.category,
                                                })) : [],
                                                relships: (modelContent && typeof modelContent === 'object' && 'relships' in modelContent ? modelContent.relships.map(rel => ({
                                                    id: rel.id || crypto.randomUUID(),
                                                    name: rel.name || '',
                                                    typeRef: rel.typeRef || '',
                                                    fromobjectRef: rel.fromobjectRef || '',
                                                    nameFrom: rel.nameFrom || '',
                                                    toobjectRef: rel.toobjectRef || '',
                                                    nameTo: rel.nameTo || '',
                                                })) : []),
                                                metamodelRef: modelContent && typeof modelContent === 'object' ? modelContent.metamodelRef || '' : '',
                                                modelviews: modelContent && typeof modelContent === 'object' ? modelContent.modelviews || [] : []
                                            }}
                                            />
                                        </div>
                                    </>)
                                    : (<div className='flex justify-center text-gray-400'>No preview yet</div>)
                                }
                            </div>
                            {/* </TabsContent> */}

                            {/* <TabsContent value="modelview" className="m-0 px-1 py-2 rounded bg-background h-[calc(100vh-5rem)]">
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
                        </Tabs> */}
                        </Card>
                        : <div className="flex justify-center items-center h-screen">
                            <LoadingCircularProgress />
                        </div>
                    }
                    {/* </div> */}
                </div>
            </div >
            <DiffModal
                isOpen={showDiffModal}
                oldContent={diffOldContent}
                newContent={diffNewContent}
                title={diffTitle}
                onClose={handleDiffCancel}
                onConfirm={handleDiffConfirm}
            />
        </>
    );
}