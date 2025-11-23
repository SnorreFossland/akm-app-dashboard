"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faPaperPlane, faEdit, faTrash, faLink, faBrain, faSave } from "@fortawesome/free-solid-svg-icons";
import { Edit, Clipboard, Library, Save, HelpCircle, X, BookmarkPlus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { saveMarkdownDocument, setDomainData, MarkdownDocument } from '@/features/model-universe/modelSlice';
import { setCurrentDocument, updateProjectInfo } from '@/features/model-universe/modelSlice';
import { setMessages } from '@/features/domainChat/domainChatSlice';
import DocumentPanel from '@/components/ai-chat/DocumentPanel';
// import DomainBuilder from "@/components/domain-builder/DomainBuilder";
import ChatComponent from '@/components/domain-builder/ChatComponent';
import ModelComponent from "@/features/model-universe/components/ModelComponent";
import { LoadingCircularProgress } from "@/components/loading";
import GettingStartedGuide from '@/components/domain-builder/GettingStartedGuide';
import Guide from '@/components/domain-builder/Guide';
import MarkdownPreview from '@/components/ai-chat/MarkdownPreview';
import MarkdownLibrary from '@/components/ai-chat/MarkdownLibrary';
import { ThreePanelLayout } from '@/components/ThreePanelLayout';
import ModalThreePanelLayout from '@/components/ModalThreePanelLayout';
import { FloatingActionButtons } from '@/components/FloatingActionButtons';
import { FileOperations } from '@/components/FileOperations';
import UniverseComponent from '@/features/model-universe/components/UniverseComponent';
import { labelRect } from 'mermaid/dist/rendering-util/rendering-elements/shapes/labelRect.js';
import DomainEditorModal from "@/components/DomainEditorModal";
import { DomainBuilderHeader } from '@/components/domain-builder/DomainBuilderHeader';
import DiffModal from '@/components/ai-chat/DiffModal';
import { useAIChatMode } from '@/hooks/useAIChatMode';

  const middlePanelContent = showDomainEditor ? {
    // ...existing code...
    // (no change for edit mode or ai-assistant mode)
    ...existing code...
  } : showAIAssistant ? {
    // ...existing code...
    ...existing code...
  } : {
    tabs: [
      {
        key: 'domain',
        label: 'Current Domain',
        content: (
          <div className="bg-background rounded-lg p-4 h-full overflow-auto">
            <div className="flex flex-col space-y-4 mb-4">
              {/* Action buttons header */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded" onClick={() => {/* TODO: implement Set as Additional Context */}}>Set as Additional Context</button>
                <button className="flex items-center gap-1 text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded" onClick={() => {/* TODO: implement Set as Current */}}>Set as Current</button>
                <button className="flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded" onClick={() => {/* TODO: implement Set as Project Plan */}}>Set as Project Plan</button>
                <button className="flex items-center gap-1 text-xs bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded" onClick={() => {/* TODO: implement Set as Domain */}}>Set as Domain</button>
              </div>
              {/* ...existing content... */}
              {/* Lines 647-653 omitted */}
            </div>
          </div>
        )
      },
      {
        key: 'suite',
        label: 'Current Model Suite',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4 h-full">
            <UniverseComponent />
          </div>
        )
      }
    ],
    defaultTab: 'domain'
  };

  // Update local state when Redux state changes
  useEffect(() => {
    if (domainData) {
      setDomainName(domainData.name || '');
      setDomainDescription(domainData.description || '');
      setDomainPresentation(domainData.presentation || '');
      setCurrentDocument(domainData.presentation || '');
    }
  }, [domainData]);

  useEffect(() => {
    if (!focusProj) return;

    if (focusProj.id) {
      const matchingDoc = documents?.find((doc) => doc.id === focusProj.id);
      if (matchingDoc) {
        setMdContent(matchingDoc.content || '');
        setDocName(matchingDoc.name || 'Project Document');
        return;
      }
    }

    if (focusProj.description) {
      setMdContent(focusProj.description);
      if (focusProj.name) {
        setDocName(focusProj.name);
      }
    }
  }, [focusProj, documents]);

  // Add this new useEffect to listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to changes to the 'currentDocument' key
      if (e.key === 'currentDocument' && e.newValue !== null) {
        console.log('localStorage currentDocument changed externally:', e.newValue?.substring(0, 100) || 'empty');
        // Only update if the new value is different from current state
        if (e.newValue !== currentDocument) {
          setCurrentDocument(e.newValue);
          console.log('Updated currentDocument from localStorage change');
        }
      }
    };

    // Listen for storage events (fired when localStorage changes in other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events within the same tab
    const handleCustomStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.key === 'currentDocument' && customEvent.detail.newValue !== null) {
        console.log('Custom storage event for currentDocument:', customEvent.detail.newValue?.substring(0, 100) || 'empty');
        if (customEvent.detail.newValue !== currentDocument) {
          setCurrentDocument(customEvent.detail.newValue);
          console.log('Updated currentDocument from custom storage event');
        }
      }
    };

    window.addEventListener('localStorageChange', handleCustomStorageChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, [currentDocument]);

  useEffect(() => {
    if (focusProj?.id || focusProj?.description) {
      const matchingDoc = documents?.find((doc) => doc.id === focusProj.id);
      if (matchingDoc) {
        setMdContent(matchingDoc.content);
        setDocName(matchingDoc.name);
        setDocType(normalizeDocumentType(matchingDoc.type));
      } else if (focusProj.description) {
        const fallbackContent = focusProj.description;
        setMdContent(fallbackContent);
        if (focusProj.name) {
          setDocName(focusProj.name);
        }
      }
    }
  }, [focusProj, documents]);

  const handleConfirmSave = useCallback(() => {
    if (!pendingSave) {
      console.error('No pending save data');
      return;
    }

    console.group('💾 Domain Save Confirmation');
    console.log('Document:', pendingSave.doc);

    // Save to library
    dispatch(saveMarkdownDocument(pendingSave.doc));

    // Update local state
    setCurrentDocument(pendingSave.doc.content);
    // setDomainPresentation(pendingSave.doc.content);

    // Clear modal state
    setShowDiffModal(false);
    setPendingSave(null);

    console.log('✅ Document saved to library');
    console.groupEnd();
  }, [pendingSave, dispatch]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModelName = e.target.value;
    const model = metis?.models ? metis.models.find((m: { name: string }) => m.name === selectedModelName) : null;
    setCurrentModel(model);
  };


  const normalizeDocumentType = (type?: string) => {
    if (!type) return 'Markdown';
    const trimmed = type.trim();
    if (!trimmed) return 'Markdown';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  // Function to dispatch form field changes
  const handleSaveDomainData = () => {
    const updatedDomainData = {
      name: domainName,
      description: domainDescription,
      presentation: domainPresentation,
      // Preserve existing fields
      prompt: domainData?.prompt || '',
      additionalContext: domainData?.additionalContext || ''
    };

    dispatch(setDomainData(updatedDomainData));
  };

  // Handle individual field changes with auto-save
  const handleFieldChange = (field: string, value: string) => {
    const updatedData = {
      ...domainData,
      [field]: value
    };

    dispatch(setDomainData(updatedData));

    // Update local state
    switch (field) {
      case 'name':
        setDomainName(value);
        break;
      case 'description':
        setDomainDescription(value);
        break;
      case 'presentation':
        setDomainPresentation(value);
        break;
    }
  };

  // Reusable IconButton component
  interface IconButtonProps {
    onClick: () => void;
    icon: any;
    className?: string;
    iconWidth?: string;
    iconSize?: SizeProp;
  }
  const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, className = "", iconWidth = "26px", iconSize = "1x" as SizeProp }) => {
    return (
      <Button onClick={onClick} className={`rounded text-xl p-4 bg-green-700 text-white ${className}`}>
        <FontAwesomeIcon icon={icon} width={iconWidth} size={iconSize} />
      </Button>
    );
  };

  const handleAddMD = () => {
    mdFileInputRef.current?.click()
  }

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
              id: doc.id, name: doc.name, content: doc.content, type: doc.type || 'markdown', createdAt: doc.createdAt || new Date().toISOString(), updatedAt: doc.updatedAt || new Date().toISOString()
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

  const handleSelectFromLibrary = (content: string, name: string, _doc?: MarkdownDocument) => {
    setMdContent(content);
    setDocName(name);
    setIsEditing(false);
    setActiveLeftTab('document'); // Switch to document tab
    setIsLibraryOpen(false); // Close the library modal after selection

    console.log("Selected document from library:", { content, name });
  };

  // Edit mode save handler
  const handleSaveToLibrary = useCallback(() => {
    const contentToSave = currentDocument; // Use currentDocument which has the live edits

    // Find the document we're editing by matching the original content
    const existingDoc = documents?.find(doc =>
      doc.content === originalContent || doc.name === documentName
    );

    let newDoc: MarkdownDocument;
    let oldContent = originalContent || ''; // Use the stored original content

    if (existingDoc) {
      // Updating existing document - keep the same ID and name
      newDoc = {
        id: existingDoc.id, // Keep the same ID to update in place
        name: existingDoc.name, // Keep the original name, don't add timestamp
        type: existingDoc.type || documentType,
        content: contentToSave,
        createdAt: existingDoc.createdAt,
        updatedAt: new Date().toISOString(),
      };

      // Use the existing document's content as old content if we don't have originalContent
      if (!oldContent) {
        oldContent = existingDoc.content;
      }
    } else {
      // Creating new document only if no existing document found
      newDoc = {
        id: Date.now().toString(),
        name: documentName || 'Untitled Document',
        type: documentType,
        content: contentToSave,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // For new documents, oldContent remains empty or the originalContent
    }

    // Show diff modal
    setPendingSave({ doc: newDoc, oldContent });
    setShowDiffModal(true);
  }, [documentName, documentType, currentDocument, documents, originalContent]);

  const handleResponseChange = (response: string) => { setLastResponse(response) };

  const handleViewInMarkdown = (response: string) => {
    const cleanResponse = (response: string) => {
      const cleaned = response.replace(/^(Sure|I'd be happy to help|Here's|Certainly|Absolutely|Of course|I can help with that|Let me|Okay|Alright|I'll|Yes|No problem|Got it)[,.!]?\s+/i, '');
      const cleaned2 = cleaned.replace(/\s+(Let me know if you need any more help|Hope that helps|If you have any questions, feel free to ask|Is there anything else you'd like to know\?|Does that answer your question\?|Do you need any clarification\?|Feel free to ask if you have more questions|Hope this helps|Let me know if you need anything else)[,.!]?\s*$/i, '');
      return cleaned2;
    };
    const cleanedResponse = cleanResponse(response);
    setMdPreview(cleanedResponse);
    setShowRightPanel(true); // Show the right panel with markdown preview
  };

  // Simple Modal component
  const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="relative bg-popover rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Define left panel content
  const leftPanelContent = {
    tabs: [
      {
        key: 'projects',
        label: 'Projects',
        content: (
          <DocumentPanel
            mdContent={mdContent}
            setMdContent={setMdContent}
            setIsLibraryOpen={setIsLibraryOpen}
            isLibraryOpen={isLibraryOpen}
            panelType='left'
            showDocumentList
            onSelect={(content, name) => {
              setMdContent(content);
              if (name) {
                setDocName(name);
              }
            }}
          />
        )
      },
    ],
    defaultTab: 'projects'
  };
  // Middle Panel Content
  const middlePanelContent = showDomainEditor ? {
    tabs: [
      {
        key: 'domain-editor',
        label: 'Edit Domain',
        content: (
          <div className="bg-background rounded-lg p-4 h-full overflow-auto">
            <div className="flex flex-col space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Domain Name</label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter domain name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={domainDescription}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter domain description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Domain Presentation (Markdown)</label>
                <textarea
                  value={domainPresentation}
                  onChange={(e) => handleFieldChange('presentation', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                  placeholder="Enter domain presentation in markdown format"
                  rows={15}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDomainData}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowDomainEditor(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      },
      {
        key: 'preview',
        label: 'Preview',
        content: (
          <div className="bg-background rounded-lg p-4 h-full overflow-auto">
            <div className="flex flex-col space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Live Preview</label>
                <div className="p-4 bg-gray-800 rounded min-h-[400px] border border-gray-700">
                  <MarkdownPreview mdPreview={domainPresentation || 'No presentation available.'} />
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        key: 'suite',
        label: 'Current Model Suite',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4 h-full">
            <UniverseComponent />
          </div>
        )
      }
    ],
    defaultTab: 'domain-editor'
  } : showAIAssistant ? {
    tabs: [
      {
        key: 'ai-assistant',
        label: 'AI Domain Builder',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded h-full">
            <ChatComponent
              input={input}
              setInput={setInput}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              onResponseChange={handleResponseChange}
              onViewInMarkdown={handleViewInMarkdown}
              setShowLeftPanel={setShowLeftPanel}
              showLeftPanel={showLeftPanel}
              chatInput={chatInput}
              onAddMD={handleAddMD}
              mdContent={mdContent}
              setMdContent={setMdContent}
              mdPreview={mdPreview}
              setMdPreview={setMdPreview}
              currentDocument={currentDocument}
              setCurrentMessages={setCurrentMessages}
              gettingStartedGuide={<GettingStartedGuide />}
              guide={<Guide />}
            />
          </div>
        )
      },
      {
        key: 'domain',
        label: 'Current Domain',
        content: (
          <div className="bg-background rounded-lg p-4 h-full overflow-auto">
            <div className="flex flex-col space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Domain Presentation</label>
                <div className="p-2 bg-gray-800 rounded min-h-[120px]">
                  <MarkdownPreview mdPreview={domainPresentation || 'No presentation available.'} />
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        key: 'suite',
        label: 'Current Model Suite',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4 h-full">
            <UniverseComponent />
          </div>
        )
      }
    ],
    defaultTab: 'ai-assistant'
  } : {
    tabs: [
      {
        key: 'domain',
        label: 'Current Domain',
        content: (
          <div className="bg-background rounded-lg p-4 h-full overflow-auto">
            <div className="flex flex-col space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Domain Presentation</label>
                <div className="p-2 bg-gray-800 rounded min-h-[120px]">
                  <MarkdownPreview mdPreview={domainPresentation || 'No presentation available.'} />
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        key: 'suite',
        label: 'Current Model Suite',
        content: (
          <div className="flex-1 overflow-auto bg-gray-800/20 rounded border border-gray-600 p-4 h-full">
            <UniverseComponent />
          </div>
        )
      }
    ],
    defaultTab: 'domain'
  };

  // Remove middlePanelContentModal - no longer needed

  // Define right panel content with the new props
  const rightPanelContent = showDomainEditor ? {
    tabs: [
      {
        key: 'preview',
        label: 'Live Preview',
        content: (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-200 truncate">
                  {domainName || 'Domain Presentation'}
                </h3>
                <span className="text-xs text-gray-400">domain</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800/30 flex-shrink-0">
              <button
                onClick={handleSaveToLibrary}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
                title="Save domain to library"
              >
                <BookmarkPlus className="h-3 w-3" />
                Save to Library
              </button>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4">
              {domainPresentation ? (
                <MarkdownPreview mdPreview={domainPresentation} variant="default" />
              ) : (
                <div className="text-center text-gray-400 p-8">
                  <p className="text-sm">No domain presentation</p>
                  <p className="text-xs mt-2">Edit the domain to see preview</p>
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/30 flex-shrink-0">
              <span className="text-xs text-gray-400">
                {domainPresentation?.length || 0} characters
              </span>
            </div>
          </div>
        )
      }
    ],
    defaultTab: 'preview'
  } : {
    tabs: [
      {
        key: 'preview',
        label: 'Preview',
        content: (
          <DocumentPanel
            mdContent={mdPreview}
            setMdContent={setMdPreview}
            setIsLibraryOpen={setIsLibraryOpen}
            isLibraryOpen={isLibraryOpen}
            panelType='right'
            currentDocumentContent={currentDocument}
            markdownPreviewContent={mdPreview}
            onSaveToLibrary={handleSaveToLibraryAndClearChat}
          />
        )
      }
    ],
    defaultTab: 'preview'
  };

  const modelSelector = (true) ? (
    <div className="flex justify-between bg-gray-800 text-xl">
      <div className="px-1">
        <span className="ms-1 font-bold text-gray-400 inline-block">ModelSuite:</span>
        <span className="text-gray-300">{metis?.name}</span>
      </div>
      <div className="px-1">
        <label htmlFor="model-select" className="me-1 font-bold text-gray-400 inline-block">Current Model:</label>
        <select id="model-select" className="ps-2 inline-block bg-gray-900 text-gray-400 inline-block" onChange={handleModelChange} value={currentModel?.name}>
          {metis?.models.map((model: { name: string }) => (
            <option key={model.name} value={model.name}>{model.name}</option>
          ))}
        </select>
      </div>
      <div className="px-1 me-auto">
        {/* <label htmlFor="model-view-select" className="me-2 font-bold text-gray-400 inline-block"></label> */}
        <span className="text-gray-400">{curMetamodel?.name || "Default"}</span>
      </div>
      <h3 className="flex ms-1 pl-1 font-bold text-gray-400 inline-block">No.ofObj:<span className="px-1 inline-block bg-gray-900 w-full"> {currentModel?.objects?.length}</span></h3>
    </div>
  ) : (
    <div className="flex justify-between bg-gray-800 text-xs">
      <div className="px-1">
        <label htmlFor="metamodel-select" className="ms-1 font-bold text-gray-400 inline-block">Document:</label>
        <span className="text-gray-300 italic px-2">
          {Array.isArray(documents) && documents.length > 0 ? documents[0].name : "Domain Definition"}
        </span>
      </div>
    </div>
  )

  const floatingActions = [
    {
      label: 'AI Assistant',
      href: '/domain-builder/aiAssistant',
      icon: <FontAwesomeIcon icon={faRobot} className="w-5 h-5" />,
      className: 'text-blue-300 ring-blue-900/50'
    },
    {
      label: 'Edit Document',
      href: '/domain-builder/edit',
      icon: <Edit className="w-5 h-5" />,
      className: 'text-emerald-300 ring-emerald-900/50'
    }
  ] as const;

  // // page-level inline tabs: 'current-domain' and 'current-suite'
  // const [pageTab, setPageTab] = useState<'current-domain' | 'current-suite'>('current-domain');

  // // helpers to locate tab content
  // const findLeftTabContent = (key: string) => leftPanelContent.tabs.find((t: any) => t.key === key)?.content || null;
  // const findMiddleTabContent = (key: string) => middlePanelContentInline.tabs.find((t: any) => t.key === key)?.content || null;

  const handleEditDocument = useCallback(() => {
    // Toggle domain editor mode
    setShowDomainEditor(!showDomainEditor);
    // Turn off AI Assistant if it's on
    if (showAIAssistant) {
      setShowAIAssistant(false);
    }
    console.log('Edit Document: Toggling domain editor');
  }, [showDomainEditor, showAIAssistant]);

  const handleOpenAIAssistant = useCallback(() => {
    // Toggle AI Assistant mode instead of opening modal
    setShowAIAssistant(!showAIAssistant);
    // Turn off domain editor if it's on
    if (showDomainEditor) {
      setShowDomainEditor(false);
    }
    console.log('AI Assistant: Toggling chat mode');
  }, [showAIAssistant, showDomainEditor]);

  const handleViewMode = useCallback(() => {
    // Turn off both modes to return to normal view
    setShowDomainEditor(false);
    setShowAIAssistant(false);
    console.log('View Mode: Returning to normal view');
  }, []);

  // Create header component with AI Assistant active state
  const domainBuilderHeader = (
    <DomainBuilderHeader
      onEditDocument={handleEditDocument}
      onOpenAIAssistant={handleOpenAIAssistant}
      onViewMode={handleViewMode}
      showLeftPanel={showLeftPanel}
      showRightPanel={showRightPanel}
      isAIAssistantActive={showAIAssistant}
      isEditDocumentActive={showDomainEditor}
    />
  );

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <div className="mb-2 pb-2 border-b border-gray-700">
        <FileOperations />
      </div>
      <div className="flex-1 overflow-hidden bg-gray-900/60">
        <ThreePanelLayout
          leftPanelContent={leftPanelContent}
          middlePanelContent={middlePanelContent}
          rightPanelContent={rightPanelContent}
          showLeftPanel={showLeftPanel}
          setShowLeftPanel={setShowLeftPanel}
          showRightPanel={showRightPanel}
          setShowRightPanel={setShowRightPanel}
          className="h-full min-w-0 bg-background text-gray-100"
          middlePanelHeader={domainBuilderHeader}
        />
      </div>

      {/* DiffModal for domain save */}
      <DiffModal
        isOpen={showDiffModal}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        oldContent={pendingSave?.oldContent || ''}
        newContent={pendingSave?.doc.content || ''}
        title="Save Domain to Library"
      />

      {/* Library Modal */}
      {isLibraryOpen && (
        <Modal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)}>
          <MarkdownLibrary
            onSelect={handleSelectFromLibrary}
            hideExportLibraryButton={false}
          />
        </Modal>
      )}
    </div>
  );
}
