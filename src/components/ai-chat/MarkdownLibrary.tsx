import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { deleteMarkdownDocument } from '@/redux/features/markdownSlice';

interface MarkdownLibraryProps {
  onSelect: (content: string, name: string) => void;
}

const MarkdownLibrary = ({ onSelect }: MarkdownLibraryProps) => {
  const dispatch = useDispatch();
  // Fix the selector path to match your actual Redux state structure
  const documents = useSelector((state: RootState) => state.markdown.documents);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 bg-gray-800 p-2 z-10">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
        />
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