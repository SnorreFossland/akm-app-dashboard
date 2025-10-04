import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { saveMarkdownDocument, deleteMarkdownDocument, setDomainData, MarkdownDocument } from '@/features/model-universe/modelSlice';
import extractDomainNameAndDescription from './docExtraction';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';

interface MarkdownLibraryProps {
  onSelect: (content: string, name: string, docMeta?: MarkdownDocument) => void;
  hideExportLibraryButton?: boolean;
  onShowInLeftPanel?: (content: string, name: string, docMeta?: MarkdownDocument) => void; // New prop for showing in left panel
  onSetCurrentDocument?: (content: string, name: string, docMeta?: MarkdownDocument) => void; // New prop for setting current document
  currentDocument?: string; // Add this missing prop
}
const MarkdownLibrary = ({
  onSelect,
  hideExportLibraryButton,
  onShowInLeftPanel,
  onSetCurrentDocument, // Add this parameter
  currentDocument
}: MarkdownLibraryProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const dispatch = useDispatch();
  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents) as MarkdownDocument[];
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null); // Track which document is expanded
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [metadataMessage, setMetadataMessage] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const filteredDocuments = documents?.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-scroll when expanded content is rendered
  useEffect(() => {
    if (expandedDocId && expandedContentRef.current) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        if (expandedContentRef.current) {
          expandedContentRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 100);
    }
  }, [expandedDocId]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      dispatch(deleteMarkdownDocument(id));
    }
  };

  // Function to export document to local file
  const handleExportToFile = (content: string, filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to import document from local file
  const handleImportFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the file once selected
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newDoc: MarkdownDocument = {
          id: uniqueId,
          name: fileName,
          type: 'markdown',
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        dispatch(saveMarkdownDocument(newDoc));

        setIsLibraryOpen(true);
        setSearchTerm('');
        onSelect(content, fileName, newDoc);

        console.log(`File "${fileName}" successfully imported`);
      } catch (error) {
        console.error("Error importing file:", error);
      }
    };

    reader.onerror = () => {
      console.error("Error reading file");
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle clicking on document line to expand/collapse
  const handleDocumentClick = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpandedId = expandedDocId === docId ? null : docId;
    setExpandedDocId(newExpandedId);
  };

  // Handle showing document in left panel
  const handleShowInLeftPanel = (doc: MarkdownDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowInLeftPanel) {
      onShowInLeftPanel(doc.content, doc.name, doc);
    } else {
      // Fallback to original onSelect behavior
      onSelect(doc.content, doc.name, doc);
    }
  };

  const handleSaveAsDomain = (content: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { name: domainName, description } = extractDomainNameAndDescription(content);
    dispatch(setDomainData({
      name: domainName || name,
      description: description || '',
      presentation: content,
      prompt: '',
      additionalContext: ''
    }));
  };

  const beginEditMetadata = (doc: MarkdownDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocId(doc.id);
    setEditName(doc.name);
    setEditType(doc.type || 'markdown');
    setMetadataMessage(null);
    setMetadataError(null);
  };

  const cancelEditMetadata = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocId(null);
    setMetadataError(null);
  };

  const saveMetadata = (doc: MarkdownDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setMetadataError('Document name is required.');
      return;
    }

    const normalizedType = (editType || '').trim() || 'markdown';

    const updatedDoc: MarkdownDocument = {
      ...doc,
      name: trimmedName,
      type: normalizedType,
      updatedAt: new Date().toISOString(),
    };

    dispatch(saveMarkdownDocument(updatedDoc));
    setEditingDocId(null);
    setMetadataError(null);
    setMetadataMessage('Document details updated.');
    setTimeout(() => setMetadataMessage(null), 2000);

    if (onSetCurrentDocument && currentDocument && currentDocument === doc.content) {
      onSetCurrentDocument(updatedDoc.content, updatedDoc.name, updatedDoc);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full p-4 bg-gray-800 rounded-lg">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelection}
        accept=".md,.txt,.markdown"
        style={{ display: 'none' }}
      />

      <div className="bg-gray-700 rounded">
        <div className="flex items-center justify-between gap-2 p-1">
          <div className="ps-2 text-xs">Import from local file </div>
          <button
            onClick={handleImportFile}
            className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 rounded whitespace-nowrap"
          >
            Import File
          </button>
        </div>

        {metadataMessage && (
          <div className="text-xs text-green-400 text-center px-2 py-1">{metadataMessage}</div>
        )}

        {!filteredDocuments && <div className="text-gray-400 text-center p-4">No documents found.</div>}

        {filteredDocuments?.length === 0 ? (
          <div className="text-gray-400 text-center p-4">
            Select a document to view or edit
            <br />
            {searchTerm ? 'No documents match your search' : 'No documents saved yet'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredDocuments?.map((doc, index) => {
              const rawType = (doc.type || 'markdown').toString();
              const displayType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
              return (
                <div key={doc.id} className="bg-gray-700 rounded-lg transition-colors">
                  {/* Document Header - Clickable to expand/collapse */}
                  <div
                    onClick={(e) => handleDocumentClick(doc.id, e)}
                    className="p-3 cursor-pointer hover:bg-gray-600 transition-colors rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {expandedDocId === doc.id ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-lg text-blue-300">{doc.name}</h4>
                          <span className="px-2 py-0.5 text-[0.65rem] uppercase tracking-wide rounded-full bg-blue-900/40 text-blue-200 border border-blue-800/60">
                            {displayType}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ms-auto">
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {doc.content.substring(0, 150)}...
                      </p>
                      <div className="flex justify-end items-center gap-2 ms-auto">
                        <button
                          onClick={(e) => handleExportToFile(doc.content, doc.name, e)}
                          className="text-xs bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded"
                        >
                          Save to File
                        </button>
                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - Shows when document is clicked */}
                  {expandedDocId === doc.id && (
                <div
                  ref={expandedContentRef}
                  className="border-t border-gray-600 bg-gray-800"
                >
                      <div className="p-3">
                        <div className="bg-gray-900 rounded p-3 mb-3 max-h-60 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
                            {doc.content}
                          </pre>
                        </div>
                        <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-400 space-x-2">
                          <span>• {doc.content.length} characters</span>
                          <span>• {displayType}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => beginEditMetadata(doc, e)}
                            disabled={editingDocId === doc.id}
                            className={`flex items-center gap-1 text-xs px-3 py-1 rounded ${editingDocId === doc.id ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                          >
                            {editingDocId === doc.id ? 'Editing…' : 'Edit details'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(doc.content, doc.name, doc);
                            }}
                              className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                            >
                              {/* <Eye className="h-3 w-3" /> */}
                              Add as context
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSetCurrentDocument) {
                                  onSetCurrentDocument(doc.content, doc.name, doc);
                                } else {
                                  onSelect(doc.content, doc.name, doc);
                                }
                              }}
                              className="flex items-center gap-1 text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded"
                            >
                              {/* <Eye className="h-3 w-3" /> */}
                              Add as current Document
                            </button>
                            <button
                              onClick={(e) => handleSaveAsDomain(doc.content, doc.name, e)}
                              className="flex items-center gap-1 text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded"
                            >
                              Save as domain
                          </button>
                        </div>
                      </div>
                      {editingDocId === doc.id && (
                        <div className="mt-3 space-y-3 rounded-md border border-gray-600 bg-gray-900/70 p-3">
                          <div className="grid gap-2 md:grid-cols-2">
                            <label className="text-xs text-gray-300 flex flex-col gap-1">
                              <span>Document name</span>
                              <input
                                value={editName}
                                onChange={(event) => {
                                  setEditName(event.target.value);
                                  if (metadataError) setMetadataError(null);
                                }}
                                className="bg-gray-800 text-gray-100 text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                placeholder="Enter document name"
                              />
                            </label>
                            <label className="text-xs text-gray-300 flex flex-col gap-1">
                              <span>Document type</span>
                              <input
                                value={editType}
                                onChange={(event) => {
                                  setEditType(event.target.value);
                                  if (metadataError) setMetadataError(null);
                                }}
                                className="bg-gray-800 text-gray-100 text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                placeholder="e.g. Markdown"
                              />
                            </label>
                          </div>
                          {metadataError && (
                            <div className="text-xs text-red-400">{metadataError}</div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={(event) => saveMetadata(doc, event)}
                              className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditMetadata}
                              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownLibrary;
