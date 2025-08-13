"use client";
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RootState, AppDispatch } from '@/store/store';
import { Building2, Network, Package } from 'lucide-react';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import { Onest } from 'next/font/google';
import { OntologyCard } from '@/components/ontology-card';
import ModelComponent from './ModelComponent';
import { Model, ModelView, setFocusModel } from '@/features/model-universe/modelSlice';

const UniverseComponent: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const data = useSelector((state: RootState) => state.modelUniverse);
    const ontology = useSelector((state: { modelUniverse: any }) => data.phData.ontology);
    const domain = useSelector((state: { modelUniverse: any }) => data.phData.domain);
    const [activeTab, setActiveTab] = useState('domain');
    const [activeSubtab, setActiveSubtab] = useState('model-list');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const [metis, setMetis] = useState<any>(null);
    const [currentModel, setCurrentModel] = useState<Model | null>(null);
    const [currentModelview, setCurrentModelview] = useState<ModelView | null>(null);
    const [curMetamodel, setCurMetamodel] = useState<{ id: string; name: string; objecttypes: any[]; relshiptypes: any[]; objecttypeviews: any[] } | null>(null);
    const [focusModelLocal, setFocusModelLocal] = useState<{ id: string; name: string } | null>(null);
    const [focusModelview, setFocusModelview] = useState<{ id: string; name: string } | null>(null);
    const [focusObject, setFocusObject] = useState<{ id: string; name: string } | null>(null);
    const [focusObjectview, setFocusObjectview] = useState<{ id: string; name: string } | null>(null);



    useEffect(() => {
        if (data.phFocus) {
            setFocusModelLocal(data.phFocus.focusModel);
            setFocusModelview(data.phFocus.focusModelview);
            setMetis(data.phData.metis);
            setCurrentModel(data.phData.metis?.models?.find(model => model.id === focusModelLocal?.id) || null);
            setCurrentModelview((currentModel?.modelviews.find((mv: { id: string }) => mv.id === focusModelview?.id) as ModelView) || null);
        }
    }, [data.phFocus, data.phData.metis, focusModelLocal?.id, focusModelview?.id, currentModel?.modelviews]);

    const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedModel = data.phData.metis.models.find(model => model.name === event.target.value);
        setCurrentModel(selectedModel || null);
        setFocusModelLocal(selectedModel || null);
        setFocusModelview(selectedModel?.modelviews[0] || null);
        if (selectedModel) {
            dispatch(setFocusModel({ id: selectedModel.id, name: selectedModel.name }));
        }
        // if (selectedModel) {
        //   setCurrentModelview(selectedModel.modelviews[0]);
        // }
    };

    const handleModelviewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    };

    return (
        <div className="h-full bg-background text-gray-100">
            <Tabs defaultValue="domain" value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 group">
                {/* <div className="border-b border-gray-600 bg-gray-800/50"> */}
                <TabsList className="grid w-full grid-cols-3 max-w-lg my-0 mx-auto pt-2 z-20">
                    <TabsTrigger
                        value="domain"
                        className="flex items-center gap-2 group-data-[state=active]:bg-blue-600/20 group-data-[state=active]:text-blue-400"
                    >
                        <Building2 className="w-4 h-4" />
                        Domain
                    </TabsTrigger>
                    <TabsTrigger
                        value="ontology"
                        className="flex items-center gap-2 group-data-[state=active]:bg-green-600/20 group-data-[state=active]:text-green-400"
                    >
                        <Network className="w-4 h-4" />
                        Ontology
                    </TabsTrigger>
                    <TabsTrigger
                        value="models"
                        className="flex items-center gap-2 group-data-[state=active]:bg-purple-600/20 group-data-[state=active]:text-purple-400"
                    >
                        <Package className="w-4 h-4" />
                        Models
                    </TabsTrigger>
                </TabsList>
                {/* </div> */}

                <div className="flex-1 overflow-auto">
                    <TabsContent value="domain" className="h-full m-0 p-0">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-blue-400">Domain Overview</h2>
                            </div>

                            <div className="grid gap-4">
                                {domain ? (
                                    <div key={domain.name} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                                        <h3 className="text-lg font-medium text-white mb-2">
                                            {domain.name}
                                        </h3>
                                        <p className="text-gray-300 text-sm mb-3">
                                            {domain.description || 'No description provided'}
                                        </p>
                                        {domain.presentation ? (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-300 mb-2">Domain Presentation</h4>
                                                <div className="border border-gray-600 rounded-lg overflow-hidden">
                                                    <DocumentPanel
                                                        mdContent={domain.presentation}
                                                        setMdContent={() => { }} // Read-only
                                                        setIsLibraryOpen={setIsLibraryOpen}
                                                        isLibraryOpen={isLibraryOpen}
                                                        panelType="middle"
                                                        onSave={() => { }} // No-op function for read-only mode
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-xs">No presentation defined</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                        <p className="text-gray-400">No domains defined yet</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Use the Domain Builder to create your first domain
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="ontology" className="h-full m-0 p-0">
                        <div className="space-y-4">
                            <div className="grid gap-4">
                                {ontology ? (
                                    <OntologyCard domainData={{ ...domain || "" }} ontologyData={ontology} />
                                ) : (
                                    <div className="text-center py-8">
                                        <Network className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                        <p className="text-gray-400">No ontologies defined yet</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Use the Ontology Builder to create your first ontology
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="models" className="h-full m-0 p-0 border-t border-gray-600">
                        <div className="flex justify-between pt-2">
                            <div className=" px-1 bg-background">
                                <label htmlFor="model-select" className="mx-1 font-bold text-gray-400 inline-block">Current Model:</label>
                                <select id="model-select" className="px-2 inline-block bg-gray-900 text-gray-400 inline-block" onChange={handleModelChange} value={currentModel?.name}>
                                    {metis?.models.map((model: { name: string }) => (
                                        <option key={model.name} value={model.name}>{model.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="bg-background">
                                <label htmlFor="model-view-select" className="mx-2 font-bold text-gray-400 inline-block">Model View:</label>
                                <select id="model-view-select" className="px-2 py-0 inline-block text-gray-400 inline-block" onChange={handleModelviewChange} value={currentModelview?.name}>
                                    {currentModel?.modelviews?.map((modelView: ModelView) => (
                                        <option key={modelView.id} value={modelView.name}>{modelView.name}</option>
                                    ))}
                                </select>
                            </div>
                            <h3 className="flex mx-1 pl-1 font-bold  bg-gray-700 text-gray-400 inline-block">No.ofObj:<span className="px-1 inline-block bg-gray-900 w-full"> {currentModel?.objects?.length}</span></h3>
                        </div>
                        <div className="space-y-4">
                            <ModelComponent />
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default UniverseComponent;