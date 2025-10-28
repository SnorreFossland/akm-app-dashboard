import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { saveMarkdownDocument, deleteMarkdownDocument, setDomainData, MarkdownDocument, updateProjectInfo, setFocusDoc, DomainCategory, DOMAIN_CATEGORIES } from '@/features/model-universe/modelSlice';
import extractDomainNameAndDescription from './docExtraction';
import { ChevronDown, ChevronRight, Upload, Search, X, Plus } from 'lucide-react';
import { Check } from 'lucide-react';
import { toast } from "sonner";

interface MarkdownLibraryProps {
  onSelect: (content: string, name: string, docMeta?: MarkdownDocument) => void;
  hideExportLibraryButton?: boolean;
  onShowInLeftPanel?: (content: string, name: string, docMeta?: MarkdownDocument) => void;
  onSetCurrentDocument?: (content: string, name: string, docMeta?: MarkdownDocument) => void;
  onSetAdditionalContext?: (content: string, docMeta?: MarkdownDocument) => void;
  currentDocument?: string;
  onCreateFromTemplate?: () => void;
}
const MarkdownLibrary = ({
  onSelect,
  hideExportLibraryButton,
  onShowInLeftPanel,
  onSetCurrentDocument,
  onSetAdditionalContext,
  currentDocument,
  onCreateFromTemplate,
}: MarkdownLibraryProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const dispatch = useDispatch();
  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents) as MarkdownDocument[];

  // Prefer domainCategories defined in the model slice (try a couple of likely locations),
  // falling back to null if not present so we can use the legacy defaults below.
  // Try to get domainCategories from phData, fallback to undefined if not present
  const sliceDomainCategories = DOMAIN_CATEGORIES && Array.isArray(DOMAIN_CATEGORIES) ? DOMAIN_CATEGORIES : null;

  // highlight based on focusDoc id or the currentDocument content
  const focusDoc = useSelector((state: RootState) => state.modelUniverse.phFocus?.focusDoc);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [expandedDocName, setExpandedDocName] = useState<string>('');
  const [expandedDocType, setExpandedDocType] = useState<string>('');

  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDomainCategory, setEditDomainCategory] = useState('');
  const [metadataMessage, setMetadataMessage] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Document type options
  const documentTypeOptions = [
    'markdown',
    'project-plan',
    'roadmap',
    'domain',
    'prompt',
    'specification',
    'requirements',
    'report',
    'context',

  ];

  // Category options: gather existing categories from documents and append defaults
  const categoryOptions = useMemo(() => {
    const docCats = (documents || []).map(d => d.domainCategory).filter(Boolean) as string[];
    const uniqueDocCats = Array.from(new Set(docCats));

    // Use categories from the slice when available; otherwise fall back to legacy defaults.
    const legacyDefaults = ['Personal', 'Business', 'Technical', 'Organizational', 'Educational', 'Research', 'Design', 'Operations', 'Product', 'Public', 'Other'];
    const sourceDefaults = Array.isArray(sliceDomainCategories) && sliceDomainCategories.length > 0
      ? sliceDomainCategories
      : legacyDefaults;

    // Keep document-discovered categories first, then append defaults that aren't already present.
    return [...uniqueDocCats, ...sourceDefaults.filter(d => !uniqueDocCats.includes(d))];
  }, [documents, sliceDomainCategories]);

  const filteredDocuments = documents?.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If focusDoc is not set, find the first document whose content matches currentDocument.
  // This ensures only one "Current" document is highlighted even if multiple docs share identical content.
  const contentMatchId = useMemo(() => {
    if (!currentDocument) return null;
    const normalized = currentDocument.trim();
    if (!normalized) return null;
    return documents?.find(d => (d.content || '').trim() === normalized)?.id || null;
  }, [documents, currentDocument]);

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
    setExpandedDocName(newExpandedId ? (documents.find(d => d.id === newExpandedId)?.name || '') : '');
    setExpandedDocType(newExpandedId ? (documents.find(d => d.id === newExpandedId)?.type || '') : '');

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

  const handleSaveAsDomain = (content: string, name: string, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const trimmedDocName = name?.trim() || '';
    const { name: extractedName, description } = extractDomainNameAndDescription(content);
    const domainName = trimmedDocName || extractedName;

    if (type !== 'domain') {
      toast.error(
        <div className="flex items-start gap-3 p-2">
          <span className="inline-block mt-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-600/40" />
          <div className="text-sm">
            <div className="font-semibold text-red-500">Invalid document type</div>
            <div className="text-xs">Only documents of type <span className="font-medium">Domain</span> can be saved as domain data.</div>
          </div>
        </div>
      );
      return;
    }
    dispatch(setDomainData({
      name: domainName,
      description: description || '',
      presentation: content,
      prompt: '',
      additionalContext: ''
    }));
    toast.success(`Domain data "${domainName}" saved from document.`);
  };

  const handleSetFocusProject = (doc: MarkdownDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (doc.type !== 'project-plan') {
      toast.error(
        <div className="flex items-start gap-3 p-2">
          <span className="inline-block mt-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-600/40" />
          <div className="text-sm">
            <div className="font-semibold text-red-500">Invalid action</div>
            <div className="text-xs">Only documents of type <span className="font-medium">project-plan</span> can be set as the focus project.</div>
          </div>
        </div>
      );
      return;
    }

    dispatch(updateProjectInfo({
      id: doc.id,
      name: doc.name,
    }));

    toast.success(`Project "${doc.name}" set as focus`);
  };

  const beginEditMetadata = (doc: MarkdownDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocId(doc.id);
    setEditName(doc.name);
    setEditType(doc.type || 'markdown');
    setEditContent(doc.content || '');
    // setEditDomainCategory(doc.domainCategory || '');
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
      content: editContent,
      // domainCategory: (editDomainCategory as DomainCategory) || undefined,
      updatedAt: new Date().toISOString(),
    };

    dispatch(saveMarkdownDocument(updatedDoc));
    setEditingDocId(null);
    setMetadataError(null);
    setMetadataMessage('Document details updated.');
    setTimeout(() => setMetadataMessage(null), 2000);

    // Intentionally do not call onSetCurrentDocument here.
    // Notifying the parent caused the Library to close / switch tabs in the parent.
    // If you want to notify the parent without forcing a view change, add a separate
    // optional prop like `onDocumentUpdated?: (doc: MarkdownDocument) => void` and call it here.
  };


  return (
    <div className="flex flex-col gap-2 w-full h-full p-2 bg-background rounded-lg overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelection}
        accept=".md,.txt,.markdown"
        style={{ display: 'none' }}
      />

      {/* Top row: Search bar and Import button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 rounded"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Import icon button */}
        <button
          onClick={() => setShowImportDialog(!showImportDialog)}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
          title="Import from file"
        >
          <Upload className="h-4 w-4" />
        </button>

        {onCreateFromTemplate && (
          <button
            onClick={onCreateFromTemplate}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
            title="Create from template"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Import dialog - shown when icon clicked */}
      {showImportDialog && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded border border-gray-600/50 animate-in fade-in slide-in-from-top-2 duration-200 flex-shrink-0">
          <span className="text-xs text-gray-400">Import from local file</span>
          <div className="flex gap-2">
            <button
              onClick={handleImportFile}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => setShowImportDialog(false)}
              className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {metadataMessage && (
        <div className="text-xs text-green-400 text-center px-2 py-1 bg-green-900/20 rounded flex-shrink-0">
          {metadataMessage}
        </div>
      )}

      <div className="bg-gray-700 rounded flex-1 overflow-hidden flex flex-col">
        {!filteredDocuments && <div className="text-gray-400 text-center p-4">No documents found.</div>}

        {filteredDocuments?.length === 0 ? (
          <div className="text-gray-400 text-center p-4">
            Select a document to view or edit
            <br />
            {searchTerm ? 'No documents match your search' : 'No documents saved yet'}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-1 gap-1 p-2">
              {filteredDocuments?.map((doc, index) => {
                // determine if this document is the "current" one
                // Priority:
                // 1) Explicit focusDoc from Redux
                // 2) If no focusDoc, the first document whose content matches currentDocument
                const isCurrent = !!(
                  (focusDoc && focusDoc.id === doc.id) ||
                  (!focusDoc?.id && contentMatchId === doc.id)
                );
                const displayType = (doc.type || 'markdown').toString();
                // const displayType = rawType.charAt(0).toUpperCase() + rawType.slice(1);

                return (
                  <div key={doc.id} className="bg-gray-700 rounded transition-colors">
                    {/* Document Header - Clickable to expand/collapse */}
                    <div
                      onClick={(e) => handleDocumentClick(doc.id, e)}
                      aria-current={isCurrent ? 'true' : undefined}
                      className={`px-3 py-2 cursor-pointer transition-colors rounded ${isCurrent ? 'bg-blue-800/30 border-l-4 border-blue-500' : 'hover:bg-gray-600'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {expandedDocId === doc.id ? (
                            <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                            <h4 className="text-xs text-gray-300 truncate">{doc.name}</h4>
                            {/* {isCurrent && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded bg-green-900/30 text-green-300">
                                <Check className="h-3 w-3" />
                                Current
                              </span>
                            )} */}
                            <span className="px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide rounded-full bg-blue-900/40 text-blue-200 border border-blue-800/60 flex-shrink-0">
                              ( {doc.type})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <span className="text-[0.65rem] text-gray-400">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Shows when document is clicked */}
                    {expandedDocId === doc.id && (
                      <div
                        ref={expandedContentRef}
                        className="border-t border-gray-600 bg-gray-700"
                      >
                        <div className="p-2">
                          <div
                            role="button"
                            tabIndex={editingDocId === doc.id ? -1 : 0}
                            onClick={(e) => {
                              if (editingDocId === doc.id) {
                                e.stopPropagation();
                                return;
                              }
                              beginEditMetadata(doc, e as unknown as React.MouseEvent);
                            }}
                            onKeyDown={(e) => {
                              if (editingDocId === doc.id) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                beginEditMetadata(doc, e as unknown as React.MouseEvent);
                              }
                            }}
                            aria-disabled={editingDocId === doc.id}
                            className={`flex w-full items-center justify-between gap-1 text-[0.65rem] p-1 rounded 
                               ${editingDocId === doc.id
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                          >
                            <span className="flex items-center justify-between w-full bg-gray-700 gap-1">
                              {editingDocId === doc.id ? (
                                <span>Editing…</span>
                              ) : (
                                <>
                                  {/* <span>{doc.name}</span> */}
                                  <>
                                    {/* {doc.type && <span className="text-blue-300">({displayType})</span>} */}
                                    <button
                                      className="ms-auto px-2 py-1 text-xs bg-gray-700 rounded hover:bg-blue-900 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); beginEditMetadata(doc, e as unknown as React.MouseEvent); }}
                                      type="button"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleExportToFile(doc.content, doc.name, e); }}
                                      className="text-[0.65rem] bg-green-800 hover:bg-green-700 text-white px-1.5 py-0.5 rounded"
                                      type="button"
                                    >
                                      Export
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, e); }}
                                      className="text-[0.65rem] bg-red-800 hover:bg-red-700 text-white px-1.5 py-0.5 rounded"
                                      type="button"
                                    >
                                      Delete
                                    </button>
                                  </>
                                </>
                              )}
                            </span>
                          </div>
                          {editingDocId === doc.id && (
                            <div className="mt-3 space-y-3 rounded-md border border-gray-600 bg-gray-900/70 p-3">
                              <div className="grid gap-2 md:grid-cols-2">
                                <label className="text-xs text-gray-300 flex flex-col gap-1">
                                  <span>Document id</span>
                                  <input
                                    value={doc.id}
                                    readOnly
                                    title="Document id (read-only)"
                                    className="bg-gray-800 text-gray-400 text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none"
                                  />
                                </label>

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
                                  <select
                                    value={editType}
                                    onChange={(event) => {
                                      setEditType(event.target.value);
                                      if (metadataError) setMetadataError(null);
                                    }}
                                    className="bg-gray-800 text-gray-100 text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  >
                                    {documentTypeOptions.map((type) => (
                                      <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                {/* Replaced free-text category input with a dropdown */}
                                <label className="text-xs text-gray-300 flex flex-col gap-1">
                                  <span>Domain category</span>
                                  <select
                                    value={editDomainCategory}
                                    onChange={(event) => {
                                      setEditDomainCategory(event.target.value);
                                      if (metadataError) setMetadataError(null);
                                    }}
                                    className="bg-gray-800 text-gray-100 text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  >
                                    <option value="">(none)</option>
                                    {categoryOptions.map((cat) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </label>
                              </div>

                              <label className="text-xs text-gray-300 flex flex-col gap-1">
                                <span>Document content</span>
                                <textarea
                                  value={editContent}
                                  onChange={(event) => setEditContent(event.target.value)}
                                  className="bg-gray-800 text-gray-100 text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 min-h-[160px]"
                                  placeholder="Edit document content"
                                  rows={16}
                                />
                              </label>
                              {metadataError && (
                                <div className="text-xs text-red-400">{metadataError}</div>
                              )}
                              <div className="flex gap-2 flex-wrap">
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
                          {editingDocId !== doc.id && (
                            <div className="bg-gray-800/80 rounded p-2 mb-2 max-h-[calc(100vh-25rem)] overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-xs text-gray-300 font-mono overflow-y-auto">
                                {doc.content}
                              </pre>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <div className="text-[0.65rem] text-gray-400 space-x-2">
                              <span>• {doc.content.length} chars</span>
                              {/* <span>• ({displayType})</span> */}
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSetAdditionalContext) {
                                    onSetAdditionalContext(doc.content, doc);
                                    toast.success('Additional context updated');
                                  } else {
                                    onSelect(doc.content, doc.name, doc);
                                  }
                                }}
                                className="flex items-center gap-1 text-[0.65rem] bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                              >
                                Set as Additional Context
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isCurrent) return;
                                  dispatch(setFocusDoc({ id: doc.id, name: doc.name }));
                                  if (onSetCurrentDocument) {
                                    onSetCurrentDocument(doc.content, doc.name, doc);
                                  } else {
                                    onSelect(doc.content, doc.name, doc);
                                  }
                                }}
                                disabled={isCurrent}
                                className={`flex items-center gap-1 text-[0.65rem] px-2 py-1 rounded ${isCurrent ? 'bg-gray-600 text-gray-200 cursor-default' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}
                              >
                                Set as Current
                              </button>
                              <button
                                onClick={(e) => handleSetFocusProject(doc, e)}
                                className="flex items-center gap-1 text-[0.65rem] bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded"
                                title="Set as focus project"
                              >
                                Set as Project Plan
                              </button>
                              <button
                                onClick={(e) => handleSaveAsDomain(doc.content, doc.name, doc.type ?? 'markdown', e)}
                                className="flex items-center gap-1 text-[0.65rem] bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded"
                              >
                                Set as Domain
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownLibrary;
