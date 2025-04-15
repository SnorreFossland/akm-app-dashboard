import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { deleteMarkdownDocument } from '@/redux/features/markdownSlice';
import { saveMarkdownDocument } from '@/redux/features/markdownSlice';

interface MarkdownLibraryProps {
  onSelect: (content: string, name: string) => void;
  hideExportLibraryButton?: boolean;
}
const MarkdownLibrary = ({ onSelect, hideExportLibraryButton }: MarkdownLibraryProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const dispatch = useDispatch();
  const documents = useSelector((state: RootState) => state.markdown.documents);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    e.preventDefault(); // Try preventing default behavior
    e.stopPropagation(); // Ensure event doesn't propagate

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
        // Extract filename without extension for the document name
        const fileName = file.name.replace(/\.[^/.]+$/, "");

        // Create a unique ID with timestamp + random string to avoid collisions
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Save to Redux store
        dispatch(saveMarkdownDocument({
          id: uniqueId,
          name: fileName,
          content: content,
          createdAt: new Date().toISOString()
        }));

        // Ensure the library stays open
        setIsLibraryOpen(true);
        
        // Set the search term to empty to make sure all documents are visible
        setSearchTerm('');

        // Also select it for editing (optional - remove if you just want to show in the list)
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

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelection}
        accept=".md,.txt,.markdown"
        style={{ display: 'none' }}
      />

      <div className=" bg-gray-700  rounded">
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

      {filteredDocuments.length === 0 ? (
        <div className="text-gray-400 text-center p-4">
          {searchTerm ? 'No documents match your search' : 'No documents saved yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelect(doc.content, doc.name)}
              className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-lg text-blue-300">{doc.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleExportToFile(doc.content, doc.name, e)}
                    className="text-xs bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded"
                  >
                    Export
                  </button>
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">
                {doc.content.substring(0, 150)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkdownLibrary;