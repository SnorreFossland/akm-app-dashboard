"use client";
import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { Card, CardTitle } from "@/components/ui/card";
import { faRobot, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactMarkdown from "react-markdown";
import PromptBuilder from "@/components/prompt-builder/PromptBuilder";
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import DraggableBar from "@/components/ui/DraggableBar";
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { saveMarkdownDocument } from "@/redux/features/markdownSlice";
import { LoadingCircularProgress } from "@/components/loading";
import { setDomainData, deleteDomainPrompt } from "@/features/model-universe/modelSlice";

import { faEdit, faPaperPlane, faTrash, faLink } from "@fortawesome/free-solid-svg-icons";

interface IconButtonProps {
  onClick: () => void;
  icon: any;
  className?: string;
  iconWidth?: string;
  iconSize?: SizeProp;
}
interface ActionCardTitleButtonProps {
  title: string;
  done: boolean;
  onClick: () => void;
  icon: any;
}
interface DispatchCardTitleProps {
  dispatchDone: boolean;
  handleDispatchFinalPrompt: () => void;
  extraClassName?: string;
}

export default function VercelAiPage() {
  const data = useSelector((state: RootState) => state.modelUniverse);
  const dispatch = useDispatch();
  const [leftPanelWidth, setLeftPanelWidth] = useState(450);
  const [middlePanelWidth, setMiddlePanelWidth] = useState(600);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [activeTab, setActiveTab] = useState("introduction");
  const [editedPrompt, setEditedPrompt] = useState<string>('')
  const [phase, setPhase] = useState("initial");
  const [dispatchDone, setDispatchDone] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [domainInput, setDomainInput] = useState<string>('');

  const documents = useSelector((state: RootState) => state.markdown.documents);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string>('')
  const [docName, setDocName] = useState<string>('New Document');
  const mdFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'document' | 'library'>('document');
  const [dividerPosition, setDividerPosition] = useState(10); // 40% default width for left panel
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);


  const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, className = "", iconWidth = "26px", iconSize = "1x" as SizeProp }) => {
    return (
      <Button onClick={onClick} className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}>
        <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
      </Button>
    );
  };

  const handleLeftResize = (newWidth: number) => {
    setLeftPanelWidth(newWidth);
  };

  const handleMiddleResize = (newWidth: number) => {
    setMiddlePanelWidth(newWidth);
  };

  const handleSelectFromLibrary = (content: string, name: string) => {
    setMdContent(content);
    setDocName(name);
    setIsEditing(false);
    setActiveLeftTab('document'); // Switch to document tab
    setIsLibraryOpen(false); // Close the library modal after selection

    console.log("Selected document from library:", { content, name });
  };

  const handleExportLibrary = () => {
    if (documents.length === 0) return;

    // Create a JSON file from the documents
    const dataStr = JSON.stringify(documents, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    // Create and trigger a download link
    const exportFileName = `aichat-doc-library-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  const handleImportLibrary = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedDocuments = JSON.parse(event.target?.result as string);

        // Validate the imported data structure
        if (Array.isArray(importedDocuments) && importedDocuments.every(doc =>
          typeof doc === 'object' && doc !== null &&
          'id' in doc && 'name' in doc && 'content' in doc)) {

          // Import each document to Redux
          importedDocuments.forEach(doc => {
            dispatch(saveMarkdownDocument({
              id: doc.id || Date.now().toString(),
              name: doc.name,
              content: doc.content,
              createdAt: doc.createdAt || new Date().toISOString()
            }));
          });

          alert(`Successfully imported ${importedDocuments.length} documents`);
        } else {
          alert('Invalid file format. Import failed.');
        }
      } catch (error) {
        console.error('Error importing library:', error);
        alert('Failed to import library. Invalid JSON format.');
      }
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset the file input
  };

  // Dispatch the edited prompt to the Redux store
  const handleDispatchEditedPrompt = () => {
    if (!editedPrompt.trim()) {
      alert("No edited prompt available to dispatch.");
      return;
    }
    console.log("205 Dispatching Edited Prompt:", editedPrompt);

    // Get current domain data
    const currentDomainData = data?.phData?.domain || {};

    // Create updated domain data with new prompt
    const updatedData = {
      ...currentDomainData,
      prompt: editedPrompt
    };

    // Use setDomainData instead of setDomainPrompt
    dispatch(setDomainData(updatedData));
    setDispatchDone(true);
    setEditedPrompt("");
  };

  // Delete the prompt from the Redux store
  const handleDeletePrompt = () => {
    dispatch(deleteDomainPrompt());
    setEditedPrompt("");
    setDomainInput("");
    setPhase("initial");
  };
    // Reusable ActionCardTitleButton component


    const ActionCardTitleButton: React.FC<ActionCardTitleButtonProps> = ({ title, done, onClick, icon }) => {
        return (
            <CardTitle className="flex justify-center m-1 mb-auto bg-gray-700 border border-gray-500">
                <div className={`flex justify-between items-center flex-grow ps-2 ${done ? "text-green-600" : "text-green-200"}`}>
                    {title}
                    <div className="flex items-center ml-auto">
                        {!done ? (
                            <div style={{ marginLeft: 8, marginRight: 8 }}>
                                <LoadingCircularProgress />
                            </div>
                        ) : (
                            <div style={{ marginLeft: 8, marginRight: 8, color: done ? "green" : "gray" }}>
                                <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                            </div>
                        )}
                        <IconButton onClick={onClick} icon={icon} />
                    </div>
                </div>
            </CardTitle>
        );
    };

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Left Panel */}
      {showLeftPanel && (
        <div className="h-full overflow-hidden" style={{ width: leftPanelWidth + "px", minWidth: "300px" }} >
          <DocumentPanel
            mdContent={mdContent}
            setMdContent={setMdContent}
            setIsLibraryOpen={setIsLibraryOpen}
            isLibraryOpen={isLibraryOpen} />
        </div>
      )}

      {/* Draggable Bar between Left and Middle panels */}
      {showLeftPanel && (
        <DraggableBar
          onResize={handleLeftResize}
          initialWidth={leftPanelWidth}
          minWidth={200}
          maxWidth={() => window.innerWidth - 400}
        />
      )}

      {/* Middle Panel */}
      <div className="flex flex-col h-full overflow-hidden" style={{ width: middlePanelWidth + "px", minWidth: "300px" }}>
        <div className="flex justify-between items-center rounded-md gap-1 bg-primary-foreground p-1 mb-2 sm:mb-4 sm:p-2 ">
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="flex items-center text-xs bg-muted hover:bg-gray-600 text-white ps-1 pb-1 rounded"
            title='Show Left pane'
          >
            <span>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="2" y1="17" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="ml-1 hidden bg-muted hover:bg-gray-600 text-white sm:inline">{!showLeftPanel}</span>
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-blue-400 px-1">AI Prompt Builder</h1>
          <div className="flex items-center">
            <div className="text-orange-700">AI-Powered Dashboard</div>
            <FontAwesomeIcon icon={faRobot} className="fa-2lg text-orange-700" />
          </div>
        </div>
        {/* <ModelComponent /> */}
        <div className="flex flex-1 overflow-hidden">
          <PromptBuilder />
        </div>
      </div>

      {/* Draggable Bar between Middle and Right panels */}
      <DraggableBar
        onResize={handleMiddleResize}
        initialWidth={middlePanelWidth}
        minWidth={300}
      />

      {/* Right Panel */}
      <div className="flex-1 h-full overflow-hidden">
        <div className="border-solid rounded border-1 border-green-900 h-full overflow-y-hidden" style={{ width: `${110 - dividerPosition}%` }} ref={containerRef}>
          <ModelComponent />
          <Card className="p-1 h-full border-solid rounded border-4 border-green-900 w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="mx-1 mb-0 pb-0 bg-transparent">
                <TabsTrigger value="introduction" className="pb-2 mt-3">
                  ...
                </TabsTrigger>
                {/* <TabsTrigger value="final-suggested-prompt" className="pb-2 mt-3">
                                    AI Suggested Prompt
                                </TabsTrigger> */}
                <TabsTrigger value="existing-prompt" className="pb-2 mt-3">
                  Stored Prompt
                </TabsTrigger>
              </TabsList>
              <TabsContent value="introduction" className="m-0 px-1 py-2 rounded bg-background">
                <div className="m-2 p-4 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 max-h-[calc(100vh-21rem)]">
                  <h2 className="text-xl font-bold text-green-500 mb-4">Welcome to the Prompt Builder</h2>

                  <p className="text-white mb-3">
                    The Prompt Builder is an AI-powered tool that helps you create perfect prompts for domain-specific knowledge models.
                    Its about asking the right questions to ask AI to give the best definition of a subject  (The Domain we want to explore).
                  </p>

                  <h3 className="text-lg font-bold text-green-400 mt-4 mb-2">How it works:</h3>

                  <ol className="text-white list-decimal ml-5 space-y-2">
                    <li><span className="font-bold">Start with a Subject :</span> Enter a domain, topic, or theme you want to create a prompt for.</li>
                    <li><span className="font-bold">Answer Clarifying Questions:</span> The AI will ask questions to refine your requirements.</li>
                    <li><span className="font-bold">Review & Edit:</span> Examine the suggested prompt and make any necessary edits.</li>
                    <li><span className="font-bold">Keep:</span> When satisfied, save your prompt to use with your knowledge models. </li>
                  </ol>
                  <div className="text-sm font-bold mt-4 mb-2">
                    <span className="text-green-400">Note: </span> You can run the prompt in next step
                  </div>
                  <div className="mt-6 p-3 border border-green-700 rounded bg-background">
                    <h4 className="text-green-400 font-bold mb-2">Tips for best results:</h4>
                    <ul className="text-white list-disc ml-5 space-y-1">
                      <li>Be specific about your domain</li>
                      <li>Provide detailed answers to the clarification questions</li>
                      <li>Don&apos;t hesitate to iterate through multiple rounds of refinement</li>
                      <li>Edit the final prompt to add any missing details</li>
                    </ul>
                  </div>
                  {/* 
                                    <div className="mt-6 text-center">
                                        <button onClick={() => setActiveTab("final-suggested-prompt")}
                                            className="bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded">
                                            Get Started
                                        </button>
                                    </div> */}
                </div>
              </TabsContent>
              {/* <TabsContent value="final-suggested-prompt" className="m-0 px-1 py-2 rounded bg-background">
                                <div className=" py-1 rounded bg-gray-900 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-[calc(100vh-20rem)]">
                                    <ReactMarkdown className="prose prose-sm p-2 text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full min-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
                                        {finalPrompt}
                                    </ReactMarkdown>
                                </div>
                                <div className="mb-auto min-w-[50%]">
                                    <DispatchCardTitle
                                        dispatchDone={dispatchDone}
                                        handleDispatchFinalPrompt={handleDispatchFinalPrompt}
                                        extraClassName="float-bottom"
                                    />
                                </div>
                            </TabsContent> */}
              <TabsContent value="existing-prompt" className="m-0 px-1 py-2 rounded bg-background">
                <div className="m-2 p-1 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 h-full">
                  <div className="text-white px-2 bg-gray-900 max-h-[calc(100vh-21rem)] overflow-y-auto">
                    {!editedPrompt ? (
                      <ReactMarkdown className="prose prose-sm text-white custom-markdown whitespace-normal break-words overflow-x-hidden max-w-full w-full prose-pre:overflow-auto prose-img:max-w-full prose-p:break-words prose-p:overflow-wrap-anywhere prose-code:break-all prose-code:whitespace-pre-wrap">
                        {`${data?.phData?.domain.prompt || "No prompt in store."}`}
                      </ReactMarkdown>
                    ) : (
                      <Textarea
                        className="p-2 bg-gray-900 text-lg text-gray-300"
                        value={editedPrompt}
                        onChange={(e) => setEditedPrompt(e.target.value)}
                        rows={20}
                        placeholder="Edit the stored prompt here..."
                      />
                    )}
                  </div>
                  <div className="flex justify-between bg-gray-700">
                    <IconButton
                      onClick={() => { setEditedPrompt(data?.phData?.domain.prompt || ""); setPhase("final"); }}
                      icon={faEdit}
                      className="mr-2 w-full"
                    />
                    <IconButton
                      onClick={handleDispatchEditedPrompt}
                      icon={faPaperPlane}
                      className="mr-2 w-full"
                    />
                    <IconButton
                      onClick={handleDeletePrompt}
                      icon={faTrash}
                      className="ml-2 bg-red-700 w-full"
                    />
                  </div>
                  <ActionCardTitleButton
                    title="Next step:  Go to Domain Builder"
                    done={true}
                    onClick={() => window.location.href = "/domain-builder"}
                    icon={faLink}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Toggle button for left panel */}
      <button
        onClick={() => setShowLeftPanel(!showLeftPanel)}
        className="fixed left-2 bottom-2 flex items-center text-xs bg-muted hover:bg-gray-600 text-white px-2 py-1 rounded"
        title={showLeftPanel ? 'Hide Left Panel' : 'Show Left Panel'}
      >
        <span className="text-lg">{showLeftPanel ? '←' : '→'}</span>
      </button>
      {/* Pass export functionality to library component */}
      <>
        {/* Library Modal */}
        {isLibraryOpen && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center btn-xs z-50"
            onClick={() => setIsLibraryOpen(false)}
          >
            <div
              className="bg-background rounded-lg p-4 w-[600px]"
              onClick={(e) => e.stopPropagation()} // Prevent clicks on modal content from closing
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-blue-400">Document Library</h3>
                <div className="flex space-x-2">

                  <button
                    onClick={handleExportLibrary}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded"
                    disabled={documents.length === 0}
                  >
                    Export Library
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelection}
                    accept=".json"
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={handleImportLibrary}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
                  >
                    <span>Import Library</span>
                  </button>
                  <button
                    onClick={() => setIsLibraryOpen(false)}
                    className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
              {/* Pass export functionality to library component */}
              <div className="text-sm text-gray-400 mb-2  max-h-[80vh] overflow-auto">
                <MarkdownLibrary
                  onSelect={handleSelectFromLibrary}
                  hideExportLibraryButton={true}
                />
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}