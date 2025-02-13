'use client';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { setDomainData } from '@/features/model-universe/modelSlice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingCircularProgress } from '@/components/loading';
import { TabsContent } from '@/components/ui/tabs';   // Updated default prompt text

import { systemPrompt } from '@/app/prompt-builder/prompts';
// Use a revised system prompt that does not ask for the topic.
const revisedSystemPrompt = "Please create the best ChatGPT prompt based on the provided domain.";

export default function PromptBuilder() {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();
    const [dispatchDone, setDispatchDone] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('existing-domain-description');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [prompt, setPrompt] = useState({ text: revisedSystemPrompt, domain: "" });
    const [finalPrompt, setFinalPrompt] = useState<string>("");
    const [suggestedDomainData, setSuggestedDomainData] = useState<any>(null);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleDispatchDomainData = () => {
        if (!suggestedDomainData) {
            alert('No Domain data to dispatch');
            return;
        }
        // const upatedDomainData = {
        //     phData: {
        //         ...data.phData,
        //         domain: suggestedDomainData,
        //     },
        //     phFocus: data.phFocus,
        //     phUser: data.phUser,
        //     phSource: data.phSource,
        // };

        dispatch(setDomainData(suggestedDomainData));
        setSuggestedDomainData(null);
        setDispatchDone(true);
    };


    const handleBuildPrompt = async () => {
        console.log("14 Building prompt...", prompt);
        setIsLoading(true);
        setActiveTab('suggested-concepts');
        // Validate that a topic is provided before generating a prompt.
        if (!prompt.domain.trim()) {
            alert("Please enter a domain/topic before generating a new prompt.");
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch("/api/genprompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt.text, domain: prompt.domain }),
            });
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const data = await response.json();
            setFinalPrompt(data.response);
            setSuggestedDomainData(data.domain);
        } catch (error) {
            console.error("Error building prompt:", error);
            setFinalPrompt("Failed to build prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecutePrompt = async () => {
        console.log("14 Executing prompt for domain...", prompt);
        setActiveTab('suggested-domain-description');

        if (!prompt.domain.trim()) {
            alert("Please enter a domain/topic before executing the prompt.");
            return;
        }

        try {
            const response = await fetch("/api/gendomain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: finalPrompt }),
            });
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const data = await response.json();
            setSuggestedDomainData(data.response);
            console.log("102 Generated Domain data:", data.response);
        } catch (error) {
            console.error("Error building domain data:", error);
            setSuggestedDomainData("Failed to build Domain summary.");
        } finally {
            setIsLoading(false);
        }
    }



    return (
        <div className="flex h-[calc(100vh-5rem)] w-full overflow-hidden">
            <div className="border-solid rounded border-4 border-green-700 w-1/4 h-full flex flex-col overflow-y-auto">
                <h2 className="text-xl font-bold mb-2">Prompt Builder</h2>
                {/* Revised prompt text area */}
                <Textarea
                    value={prompt.text}
                    onChange={(e) => setPrompt({ ...prompt, text: e.target.value })}
                    rows={10}
                    placeholder="System prompt for building your final prompt..."
                />
                {/* Input field for the domain/topic */}
                <div className="mt-4">
                    <label className="block font-semibold mb-1">Enter your Domain/Topic:</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="E.g., E-Scooter Rental Services"
                        value={prompt.domain}
                        onChange={(e) => setPrompt({ ...prompt, domain: e.target.value })}
                    />
                </div>
                <Button onClick={handleBuildPrompt} className="btn mt-2">
                    Build Prompt
                </Button>
                <div className="border-solid rounded border-4 border-blue-800 mt-4">
                    {finalPrompt && (
                        <div className="mt-4">
                            <h3 className="font-semibold">Result:</h3>
                            <Textarea
                                value={finalPrompt}
                                onChange={(e) => setFinalPrompt(e.target.value)}
                                rows={10}
                                className="bg-gray-80 p-2 border rounded"
                            />
                            <Button onClick={handleExecutePrompt} className="btn mt-2">
                                Send to ChatGPT
                            </Button>
                        </div>
                    )}
                </div>
                <div className="mt-auto">
                    <CardTitle
                        className={`flex justify-between items-center flex-grow ps-1 bg-gray-600 border border-gray-700 ${(dispatchDone) ? 'text-green-600' : 'text-green-200'}`}
                    >
                        <div
                            className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                        >
                            Save to current Store
                            <div className="flex items-center ml-auto">
                                {!dispatchDone ? (
                                    <div style={{ marginLeft: 8, marginRight: 8 }}>
                                        <LoadingCircularProgress />
                                    </div>
                                ) : (
                                    <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone ? 'green' : 'gray' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                    </div>
                                )}
                                <Button
                                    onClick={() => {
                                        handleDispatchDomainData();
                                    }}
                                    className="rounded text-xl p-4 bg-green-700 text-white">
                                    <FontAwesomeIcon icon={faPaperPlane} width="26px" size="1x" />
                                </Button>
                            </div>
                        </div>
                    </CardTitle>
                </div>
            </div>



            <div className="border-solid rounded border-4 border-blue-800 w-3/4 h-full overflow-y-auto">
                <Card className="p-1 h-full">
                    <CardTitle className="flex justify-center text-white m-1">Active Knowledge Canvas (Domain description)</CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                        <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                            <TabsTrigger value="existing-domain-description" className="pb-2 mt-3">Existing Domain description</TabsTrigger>
                            <TabsTrigger value="suggested-domain-description" className="pb-2 mt-3">Suggested Domain description</TabsTrigger>
                        </TabsList>
                        <TabsContent value="existing-domain-description" className="m-0 px-1 py-2 rounded bg-background h-full">
                            <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                                <ReactMarkdown>
                                    {`# ${data?.phData?.domain}\n\n## ${data?.phData?.domain?.description}\n\n${data?.phData?.domain?.summary}`}
                                </ReactMarkdown>
                            </div>
                        </TabsContent>
                        <TabsContent value="suggested-domain-description" className="m-0 px-1 py-2 rounded bg-background h-full">
                            <div className="m-1 py-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                                <ReactMarkdown>
                                    {suggestedDomainData}
                                </ReactMarkdown>
                                {/* <DomainCard DomainData={DomainDataList} /> */}
                            </div>
                            <div className="mt-auto">
                                <CardTitle
                                    className={`flex justify-between items-center float-bottom flex-grow ps-1 bg-gray-600 border border-gray-700
                                            ${(dispatchDone) ? 'text-green-600' : 'text-green-200'}`}
                                >
                                    <div
                                        className={`flex justify-between items-center flex-grow ${dispatchDone ? 'text-green-600' : 'text-green-200'}`}
                                    >
                                        Save to current Store
                                        <div className="flex items-center ml-auto">
                                            {!dispatchDone ? (
                                                <div style={{ marginLeft: 8, marginRight: 8 }}>
                                                    <LoadingCircularProgress />
                                                </div>
                                            ) : (
                                                <div style={{ marginLeft: 8, marginRight: 8, color: dispatchDone ? 'green' : 'gray' }}>
                                                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                                </div>
                                            )}
                                            <Button
                                                onClick={() => {
                                                    handleDispatchDomainData();
                                                }}
                                                className="rounded text-xl p-4 bg-green-700 text-white">
                                                <FontAwesomeIcon icon={faPaperPlane} width="26px" size="1x" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardTitle>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}