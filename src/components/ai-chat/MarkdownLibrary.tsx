import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { saveMarkdownDocument, deleteMarkdownDocument } from '@/features/model-universe/modelSlice'; // Updated import
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';

interface MarkdownLibraryProps {
  onSelect: (content: string, name: string) => void;
  hideExportLibraryButton?: boolean;
  onShowInLeftPanel?: (content: string, name: string) => void; // New prop for showing in left panel
  onSetCurrentDocument?: (content: string, name: string) => void; // New prop for setting current document
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
  const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null); // Track which document is expanded
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);

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

        const now = new Date().toISOString();
        dispatch(saveMarkdownDocument({
          id: uniqueId,
          name: fileName,
          type: 'markdown',
          content: content,
          createdAt: now,
          updatedAt: now
        }));

        setIsLibraryOpen(true);
        setSearchTerm('');
        onSelect(content, fileName);

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
  const handleShowInLeftPanel = (content: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowInLeftPanel) {
      onShowInLeftPanel(content, name);
    } else {
      // Fallback to original onSelect behavior
      onSelect(content, name);
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
      </div>

      {!filteredDocuments && <div className="text-gray-400 text-center p-4">No documents found.</div>}

      {filteredDocuments?.length === 0 ? (
        <div className="text-gray-400 text-center p-4">
          Select a document to view or edit
          <br />
          {searchTerm ? 'No documents match your search' : 'No documents saved yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredDocuments?.map((doc, index) => (
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
                    <h4 className="font-medium text-lg text-blue-300">{doc.name}</h4>
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
                      <div className="text-xs text-gray-400">
                        • {doc.content.length} characters
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(doc.content, doc.name);
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
                              onSetCurrentDocument(doc.content, doc.name);
                            } else {
                              onSelect(doc.content, doc.name);
                            }
                          }}
                          className="flex items-center gap-1 text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          {/* <Eye className="h-3 w-3" /> */}
                          Add as current Document
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkdownLibrary;