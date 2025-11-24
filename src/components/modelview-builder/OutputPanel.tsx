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

interface OutputPanelProps {
    mvPreview: string; // The preview content to display
    setMvPreview: React.Dispatch<React.SetStateAction<string>>;
    mvContent: string | Model | null; // The main content, can be string or Model
    setMvContent: React.Dispatch<React.SetStateAction<string>>;
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

export default function OutputPanel({
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
}: OutputPanelProps) {
    // Add debugging
    // console.log('49 DocumentPanel render - mvPreview:', mvPreview?.substring(0, 100) || 'empty');
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
        setEditContent(typeof mvContent === 'string' ? mvContent : (mvContent?.description || ''));
    }, [mvContent]);

    // Focus the textarea when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

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
            focusRelship: data?.phFocus?.focusRelship || { id: '', name: '' },
            focusRelshipview: data?.phFocus?.focusRelshipview || { id: '', name: '' },
            focusObjectIds: data?.phFocus?.focusObjectIds || [],
            focusRelshipIds: data?.phFocus?.focusRelshipIds || [],
            focusProj: data?.phFocus?.focusProj || { id: '', name: '', description: '' },
            focusDoc: data?.phFocus?.focusDoc || { id: null },
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
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="text-sm text-gray-400">Objects and Relships Preview</div>
            </div>
            <div className="prose prose-invert custom-markdown markdown-preview bg-secondary p-1 rounded-md overflow-auto  max-w-full whitespace-pre-wrap break-words">
                {data
                    ? <Card className="bg-transparent w-full h-full overflow-hidden">
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
                                        modelview={{
                                            name: modelview.name || 'Default View',
                                            description: modelview.description || '',
                                            objectviews: modelview.objectviews || [],
                                            relshipviews: modelview.relshipviews || []
                                        } as any}
                                    />
                                )}
                            </div>
                        </div>
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

