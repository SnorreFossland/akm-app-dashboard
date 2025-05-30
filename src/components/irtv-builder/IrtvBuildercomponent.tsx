"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faQuestionCircle, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';

import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { LoadingCircularProgress } from '@/components/loading';
import ReactMarkdown from 'react-markdown';
import ModelSelector from '@/components/ai-chat/ModelSelector';

// IRTV Builder specific props interface
interface IRTVBuilderComponentProps {
    input: string;
    setInput: (input: string) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    onResponseChange: (response: string) => void;
    onViewInPreview: (response: string) => void;
    setShowLeftPanel: (show: boolean) => void;
    onAddContent: (content: string) => void;
    irtvContent: string;
    setIrtvContent: (content: string) => void;
    irtvPreview: string;
    setIrtvPreview: (preview: string) => void;
    setCurrentMessages: (messages: any[]) => void;
}

// IRTV-specific prompts (you'll need to create these)
const IRTVSystemPrompt = `You are an expert IRTV (Information Requirements for Testing and Verification) analyst. 
Your task is to analyze requirements and generate comprehensive IRTV documentation that identifies all information needs for testing and verification activities.

Focus on:
- Information Requirements identification
- Test data specifications
- Verification criteria
- Traceability requirements
- Documentation standards`;

const IRTVUserPrompt = `Generate IRTV documentation for the given requirements. Include:
1. Information Requirements Matrix
2. Test Data Requirements
3. Verification Information Needs
4. Traceability Information
5. Documentation Requirements`;

const IRTVBuilderComponent: React.FC<IRTVBuilderComponentProps> = ({
    input,
    setInput,
    selectedModel,
    setSelectedModel,
    onResponseChange,
    onViewInPreview,
    setShowLeftPanel,
    onAddContent,
    irtvContent,
    setIrtvContent,
    irtvPreview,
    setIrtvPreview,
    setCurrentMessages
}) => {
    const data = useSelector((state: RootState) => state.modelUniverse);
    const dispatch = useDispatch<AppDispatch>();

    // IRTV Builder state
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [activeTab, setActiveTab] = useState('current-analysis');
    const [activeSubTab, setActiveSubTab] = useState('requirements-summary');
    const [dispatchDone, setDispatchDone] = useState(false);

    // IRTV specific state
    const [irtvAnalysis, setIrtvAnalysis] = useState<any>(null);
    const [requirements, setRequirements] = useState<string>('');
    const [testScenarios, setTestScenarios] = useState<any[]>([]);
    const [verificationCriteria, setVerificationCriteria] = useState<any[]>([]);

    // Prompt state
    const [systemPrompt, setSystemPrompt] = useState(IRTVSystemPrompt);
    const [userPrompt, setUserPrompt] = useState(IRTVUserPrompt);

    // Add streaming state
    const [isStreaming, setIsStreaming] = useState(false);

    // Add temperature state
    const [temperature, setTemperature] = useState<number>(0.7);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    // Load saved temperature preference
    useEffect(() => {
        const savedTemp = localStorage.getItem('aiDashboard_temperature');
        if (savedTemp) {
            setTemperature(parseFloat(savedTemp));
        }
    }, []);

    // Add useEffect to monitor content changes
    useEffect(() => {
        console.log('IRTV Content changed:', {
            length: irtvContent?.length || 0,
            preview: irtvContent?.substring(0, 100) || 'empty'
        });
    }, [irtvContent]);

    // Temperature Selector component
    const TemperatureSelector = () => {
        return (
            <div className="flex flex-col items-start text-xs mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature:
                </label>
                <div className="flex items-center gap-2">
                    <select
                        value={temperature}
                        onChange={(e) => {
                            const newTemp = parseFloat(e.target.value);
                            setTemperature(newTemp);
                            localStorage.setItem('aiDashboard_temperature', newTemp.toString());
                        }}
                        className="bg-gray-800 border border-gray-600 rounded text-sm py-1 px-2 text-gray-200"
                        title="Temperature controls randomness. Lower values are more deterministic, higher values more creative."
                    >
                        <option value="0.0">0.0 (Deterministic)</option>
                        <option value="0.3">0.3 (Focused)</option>
                        <option value="0.5">0.5 (Balanced)</option>
                        <option value="0.7">0.7 (Creative)</option>
                        <option value="1.0">1.0 (Very Creative)</option>
                        <option value="1.2">1.2 (Highly Creative)</option>
                    </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Controls creativity vs consistency
                </p>
            </div>
        );
    };

    // Add dummy IRTV response for testing
    const getDummyIRTVResponse = (requirements: string) => {
        return `# IRTV Analysis Report

## Information Requirements Matrix

Based on the provided requirements:
${requirements}

### 1. Information Requirements Identification

| Requirement ID | Information Need | Data Source | Verification Method |
|---|---|---|---|
| REQ-001 | User authentication data | User database | Login test scenarios |
| REQ-002 | Payment processing data | Payment gateway | Transaction logs |
| REQ-003 | Report generation data | System database | Output verification |
| REQ-004 | Session management data | Session store | Timeout testing |
| REQ-005 | Audit trail data | Logging system | Audit log review |

## Summary

This IRTV analysis provides a comprehensive framework for testing and verification activities. All information requirements have been identified and mapped to appropriate verification methods.

*Generated by Dummy Model for testing purposes*`;
    };

    // Add streaming simulation for dummy model
    const simulateStreamingResponse = async (
        response: string,
        onChunk: (chunk: string) => void,
        onComplete: () => void
    ) => {
        const words = response.split(' ');
        const chunkSize = 3; // Words per chunk

        for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
            onChunk(chunk);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        onComplete();
    };

    // Enhanced error handling for quota issues
    const handleIRTVAnalysis = async () => {
        console.log('handleIRTVAnalysis called');
        console.log('irtvContent:', irtvContent);

        if (!irtvContent?.trim()) {
            alert('Please add content to the Document panel in the left sidebar to analyze');
            return;
        }

        console.log('Starting IRTV analysis...');

        setIsLoading(true);
        setIsStreaming(true);
        setStep(1);
        setActiveTab('irtv-analysis');
        setIrtvAnalysis('');

        try {
            // Check if dummy model is selected
            if (selectedModel === 'dummy') {
                console.log('Using dummy model for testing...');

                const dummyResponse = getDummyIRTVResponse(irtvContent);
                let accumulatedResponse = '';

                await simulateStreamingResponse(
                    dummyResponse,
                    (chunk) => {
                        accumulatedResponse += chunk;
                        setIrtvAnalysis(accumulatedResponse);
                        onResponseChange(accumulatedResponse);
                        onViewInPreview(accumulatedResponse);
                    },
                    () => {
                        setIsStreaming(false);
                        console.log('Dummy streaming completed');
                    }
                );

                setCurrentMessages([
                    {
                        role: "user",
                        content: irtvContent,
                        timestamp: Date.now()
                    },
                    {
                        role: "assistant",
                        content: accumulatedResponse,
                        timestamp: Date.now()
                    }
                ]);

                setStep(2);
                setIsLoading(false);
                setIsStreaming(false);
                return;
            }

            // Existing API logic for real models
            console.log('Making API request...');

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: `${userPrompt}\n\nDocument Content to Analyze:\n${irtvContent}`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 4000,
                    stream: true
                })
            });

            console.log('API response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('API error:', errorText);
                throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const reader = res.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            const decoder = new TextDecoder();
            let accumulatedResponse = '';

            console.log('Starting to read stream...');

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('Stream reading completed');
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    console.log('Raw chunk received:', chunk.substring(0, 200));

                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        console.log('Processing line:', trimmedLine.substring(0, 100));

                        if (trimmedLine.startsWith('data: ')) {
                            const data = trimmedLine.slice(6).trim();
                            console.log('Data to parse:', data);

                            if (data === '[DONE]') {
                                console.log('Received [DONE] signal');
                                setIsStreaming(false);
                                break;
                            }

                            if (!data || data === '') {
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                console.log('Parsed data:', parsed);

                                const content = parsed.choices?.[0]?.delta?.content ||
                                    parsed.choices?.[0]?.message?.content ||
                                    parsed.content;

                                if (content) {
                                    console.log('Content received:', content);
                                    accumulatedResponse += content;
                                    setIrtvAnalysis(accumulatedResponse);
                                    onResponseChange(accumulatedResponse);
                                    onViewInPreview(accumulatedResponse);
                                }
                            } catch (parseError) {
                                console.warn('Failed to parse chunk:', data, 'Error:', parseError);
                                continue;
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            console.log('Final accumulated response length:', accumulatedResponse.length);

            if (accumulatedResponse.length === 0) {
                console.log('No content received from streaming, trying non-streaming approach...');
                await handleIRTVAnalysisAlternative();
                return;
            }

            setCurrentMessages([
                {
                    role: "user",
                    content: irtvContent,
                    timestamp: Date.now()
                },
                {
                    role: "assistant",
                    content: accumulatedResponse,
                    timestamp: Date.now()
                }
            ]);

            setStep(2);
        } catch (error) {
            console.error("IRTV Analysis failed:", error);

            let errorMessage = error.message;
            if (errorMessage.includes('quota') || errorMessage.includes('429')) {
                errorMessage = 'API quota exceeded. Please:\n1. Try Dummy Model for testing\n2. Try GPT-3.5 Turbo model\n3. Check your OpenAI billing\n4. Wait and try again later';
            }

            alert(`Failed to generate IRTV analysis:\n${errorMessage}`);
            setActiveTab('current-analysis');
            setStep(0);
        }

        setIsLoading(false);
        setIsStreaming(false);
    };

    // Also update the alternative method to be more robust
    const handleIRTVAnalysisAlternative = async () => {
        console.log('Using alternative non-streaming approach...');

        if (!irtvContent?.trim()) {
            alert('Please add content to the Document panel in the left sidebar to analyze');
            return;
        }

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: `${userPrompt}\n\nDocument Content to Analyze:\n${irtvContent}`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 4000,
                    stream: false
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const data = await res.json();
            console.log('Non-streaming response:', data); // Debug log

            const response = data.choices?.[0]?.message?.content ||
                data.choices?.[0]?.text ||
                data.content ||
                data.response;

            if (!response) {
                throw new Error('No response content received from API');
            }

            console.log('Response received:', response.substring(0, 200)); // Debug log

            setIrtvAnalysis(response);
            onResponseChange(response);
            onViewInPreview(response);

            setCurrentMessages([
                {
                    role: "user",
                    content: irtvContent,
                    timestamp: Date.now()
                },
                {
                    role: "assistant",
                    content: response,
                    timestamp: Date.now()
                }
            ]);

            setStep(2);
        } catch (error) {
            console.error("Alternative IRTV Analysis failed:", error);
            throw error; // Re-throw to be handled by the main function
        }
    };

    // Save IRTV to content
    const handleSaveIRTV = () => {
        if (!irtvAnalysis) {
            alert('No IRTV analysis to save');
            return;
        }

        const updatedContent = irtvContent ? `${irtvContent}\n\n---\n\n${irtvAnalysis}` : irtvAnalysis;
        setIrtvContent(updatedContent);
        onAddContent(updatedContent);
        setDispatchDone(true);
    };

    // Alternative: Use useMemo for the prompts div to avoid useEffect issues
    const printPromptsDiv = useMemo(() => (
        <div className="flex flex-col max-h-[calc(100vh-30rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-blue-400 mb-2">System Prompt</h3>
                <div className="bg-gray-800 p-3 rounded">
                    <ReactMarkdown className="prose prose-invert max-w-none text-sm">
                        {systemPrompt}
                    </ReactMarkdown>
                </div>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-blue-400 mb-2">User Prompt</h3>
                <div className="bg-gray-800 p-3 rounded">
                    <ReactMarkdown className="prose prose-invert max-w-none text-sm">
                        {userPrompt}
                    </ReactMarkdown>
                </div>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-blue-400 mb-2">Document Content (Primary Input)</h3>
                <div className="bg-gray-800 p-3 rounded">
                    <ReactMarkdown className="prose prose-invert max-w-none text-sm">
                        {irtvContent || 'No document content available'}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    ), [irtvContent, systemPrompt, userPrompt]);

    return (
        <div className="flex flex-col h-full w-full bg-background text-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-blue-400">
                    IRTV Builder - AI Powered Information Requirements Analysis
                </h2>
            </div>

            <div className="flex flex-1 h-full">
                {/* Left Control Panel */}
                <div className="w-1/4 border-r border-gray-700 p-4">
                    <div className="mb-6">
                        <details className="mb-4">
                            <summary className="cursor-pointer text-blue-400 font-semibold mb-2">
                                <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                                About IRTV Builder
                            </summary>
                            <div className="bg-gray-800 p-3 rounded text-sm">
                                <p className="mb-2">Build Information Requirements for Testing and Verification (IRTV) documentation assisted by AI.</p>
                                <p className="mb-2">This tool helps identify:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>Information Requirements Matrix</li>
                                    <li>Test Data Requirements</li>
                                    <li>Verification Information Needs</li>
                                    <li>Traceability Information</li>
                                    <li>Documentation Requirements</li>
                                </ul>
                            </div>
                        </details>

                        {/* Model Selection - Add dummy option */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                AI Model:
                            </label>
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={(newModel) => {
                                    setSelectedModel(newModel);
                                    localStorage.setItem('aiDashboard_selectedModel', newModel);
                                }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use "Dummy Model" for testing without API quota usage
                            </p>
                        </div>

                        {/* Temperature Selection */}
                        <TemperatureSelector />

                        {/* Generate Button - Add debug onClick */}
                        <div className="mb-4">
                            <div className={`flex items-center justify-between p-3 rounded border ${irtvAnalysis ? 'border-green-600 bg-green-900/20' : 'border-gray-600'}`}>
                                <span className={`text-sm font-medium ${irtvAnalysis ? 'text-green-400' : 'text-gray-300'}`}>
                                    {isStreaming ? 'Generating IRTV Analysis...' : 'Generate IRTV Analysis'}
                                </span>
                                <div className="flex items-center space-x-2">
                                    {isLoading ? (
                                        <LoadingCircularProgress />
                                    ) : (
                                        <FontAwesomeIcon
                                            icon={faCheckCircle}
                                            className={irtvAnalysis ? 'text-green-500' : 'text-gray-500'}
                                        />
                                    )}
                                    <Button
                                        onClick={(e) => {
                                            console.log('Button clicked!'); // Add debug log
                                            console.log('Button disabled:', isLoading || !irtvContent?.trim()); // Add debug log
                                            console.log('isLoading:', isLoading); // Add debug log
                                            console.log('irtvContent length:', irtvContent?.length); // Add debug log
                                            handleIRTVAnalysis();
                                        }}
                                        disabled={isLoading || !irtvContent?.trim()}
                                        className={`${irtvAnalysis ? 'bg-green-800 hover:bg-green-700' : 'bg-blue-700 hover:bg-blue-600'} text-white`}
                                    >
                                        <FontAwesomeIcon icon={isStreaming ? faStop : faRobot} />
                                    </Button>
                                </div>
                            </div>
                            {!irtvContent?.trim() && (
                                <p className="text-xs text-yellow-500 mt-1">
                                    Add content to the Document panel in the left sidebar to start analysis
                                </p>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="mt-auto">
                            <div className={`flex items-center justify-between p-3 rounded border ${dispatchDone ? 'border-green-600 bg-green-900/20' : 'border-gray-600'}`}>
                                <span className={`text-sm font-medium ${dispatchDone ? 'text-green-400' : 'text-gray-300'}`}>
                                    Save to IRTV Document
                                </span>
                                <div className="flex items-center space-x-2">
                                    <FontAwesomeIcon
                                        icon={faCheckCircle}
                                        className={dispatchDone ? 'text-green-500' : 'text-gray-500'}
                                    />
                                    <Button
                                        onClick={handleSaveIRTV}
                                        disabled={!irtvAnalysis}
                                        className={`${dispatchDone ? 'bg-green-800 hover:bg-green-700' : 'bg-blue-700 hover:bg-blue-600'} text-white`}
                                    >
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Panel */}
                <div className="flex-1 p-4">
                    <Card className="h-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="current-analysis">Current Analysis</TabsTrigger>
                                <TabsTrigger value="irtv-analysis">IRTV Analysis</TabsTrigger>
                                <TabsTrigger value="irtv-document">IRTV Document</TabsTrigger>
                            </TabsList>

                            <TabsContent value="current-analysis" className="h-[calc(100%-4rem)] overflow-auto">
                                <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="requirements-summary">Requirements Summary</TabsTrigger>
                                        <TabsTrigger value="current-content">Current Content</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="requirements-summary">
                                        <div className="bg-gray-800 p-4 rounded">
                                            <h3 className="text-lg font-semibold text-blue-400 mb-3">Requirements Analysis Status</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Document Content:</span>
                                                    <span className={irtvContent?.trim() ? 'text-green-400' : 'text-gray-500'}>
                                                        {irtvContent?.trim() ? 'Available' : 'Empty'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>IRTV Analysis:</span>
                                                    <span className={irtvAnalysis ? 'text-green-400' : 'text-gray-500'}>
                                                        {irtvAnalysis ? 'Complete' : 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Ready to Analyze:</span>
                                                    <span className={irtvContent?.trim() ? 'text-green-400' : 'text-gray-500'}>
                                                        {irtvContent?.trim() ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="current-content">
                                        <div className="bg-gray-800 p-4 rounded h-full overflow-auto">
                                            <h3 className="text-lg font-semibold text-blue-400 mb-3">Current IRTV Content</h3>
                                            {irtvContent ? (
                                                <ReactMarkdown className="prose prose-invert max-w-none">
                                                    {irtvContent}
                                                </ReactMarkdown>
                                            ) : (
                                                <p className="text-gray-500">No IRTV content generated yet.</p>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </TabsContent>

                            <TabsContent value="irtv-analysis" className="h-[calc(100%-4rem)] overflow-auto">
                                {(irtvAnalysis || isStreaming) && (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center space-x-2">
                                                {isStreaming && (
                                                    <span className="text-blue-400 text-sm">
                                                        <FontAwesomeIcon icon={faRobot} className="animate-pulse mr-2" />
                                                        Streaming response...
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleOpenModal}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Show Prompts
                                            </button>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded h-full overflow-auto">
                                            <ReactMarkdown className="prose prose-invert max-w-none">
                                                {irtvAnalysis}
                                            </ReactMarkdown>
                                            {isStreaming && (
                                                <div className="mt-2">
                                                    <span className="text-blue-400 animate-pulse">█</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                {!irtvAnalysis && !isStreaming && (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <p>Generate IRTV analysis to see results here</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="irtv-document" className="h-[calc(100%-4rem)] overflow-auto">
                                <div className="bg-gray-800 p-4 rounded h-full overflow-auto">
                                    <h3 className="text-lg font-semibold text-blue-400 mb-3">Complete IRTV Document</h3>
                                    {irtvContent ? (
                                        <ReactMarkdown className="prose prose-invert max-w-none">
                                            {irtvContent}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-gray-500">No IRTV document content available. Generate and save analysis first.</p>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>

                    {/* Prompts Modal */}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                            <DialogHeader>
                                <DialogTitle>IRTV Analysis Prompts</DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto">
                                {printPromptsDiv}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCloseModal} className="bg-red-600 hover:bg-red-700">
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default IRTVBuilderComponent;