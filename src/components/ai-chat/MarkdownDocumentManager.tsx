// import { useState, useEffect, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from '@/store';
// import { saveMarkdownDocument } from '@/redux/features/markdownSlice';
// import MarkdownLibrary from './MarkdownLibrary';
// interface MarkdownDocumentManagerProps {
//     docName: string;
//     setDocName: (name: string) => void;
//     markdownContent: string;
//     onDocumentSelect: (content: string, name: string) => void;
//     openLibraryButtonRef?: React.RefObject<HTMLButtonElement>; // Make it optional with ?
//     documentPanelOpen: boolean;
//     setDocumentPanelOpen: (open: boolean) => void; // Add this prop
//     isDocumentPanelOpen: boolean; // Assuming this is a boolean state
// }

// const MarkdownDocumentManager = ({
//     docName,
//     setDocName,
//     markdownContent,
//     onDocumentSelect,
//     openLibraryButtonRef,
//     documentPanelOpen,
//     setDocumentPanelOpen, // Assuming this is a function to set the document panel open state
//     isDocumentPanelOpen,
// }: MarkdownDocumentManagerProps) => {
//     const dispatch = useDispatch();
//     const [isLibraryOpen, setIsLibraryOpen] = useState(false);
//     const documents = useSelector((state: RootState) => state.modelUniverse.phData.documents);
//     const fileInputRef = useRef<HTMLInputElement>(null);


//     // Expose this function to parent components
//     const openLibrary = () => setIsLibraryOpen(documentPanelOpen ? true : true);

//     // Add effect to sync ref with the openLibrary function
//     useEffect(() => {
//         if (openLibraryButtonRef && openLibraryButtonRef.current) {
//             openLibraryButtonRef.current.onclick = () => openLibrary();
//         }
//     }, [openLibraryButtonRef]);

//     const handleExportLibrary = () => {
//         // Create a JSON object with all documents
//         const libraryData = JSON.stringify(documents, null, 2);

//         // Create a blob with the data
//         const blob = new Blob([libraryData], { type: 'application/json' });
//         const url = URL.createObjectURL(blob);

//         // Create an anchor element and trigger download
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `markdown-library-${new Date().toISOString().slice(0, 10)}.json`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//     };
//     const handleSelectFromLibrary = (content: string, name: string) => {
//         onDocumentSelect(content, name);
//         setDocName(name);
//         setDocumentPanelOpen(true);
//     };

//     // Import library functionality
//     const handleImportLibrary = (e: React.MouseEvent) => {
//         e.preventDefault(); // Try preventing default behavior
//         e.stopPropagation(); // Ensure event doesn't propagate
//         if (fileInputRef.current) {
//             fileInputRef.current.click();
//         }
//     };

//     const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (!file) return;

//         const reader = new FileReader();
//         reader.onload = (event) => {
//             try {
//                 const jsonData = JSON.parse(event.target?.result as string);

//                 // Check if the data has the expected format
//                 if (Array.isArray(jsonData) && jsonData.length > 0) {
//                     // Import each document in the library
//                     jsonData.forEach(doc => {
//                         if (doc.name && doc.content) {
//                             dispatch(saveMarkdownDocument({
//                                 id: doc.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
//                                 name: doc.name,
//                                 content: doc.content,
//                                 createdAt: doc.createdAt || new Date().toISOString()
//                             }));
//                         }
//                     });
//                     alert(`Successfully imported ${jsonData.length} documents`);
//                 } else {
//                     alert('Invalid library format');
//                 }
//             } catch (error) {
//                 alert('Failed to parse library file');
//                 console.error(error);
//             }
//         };
//         reader.readAsText(file);

//         // Reset the input so the same file can be selected again
//         if (fileInputRef.current) {
//             fileInputRef.current.value = '';
//         }
//     };

//     return (
//         <>
//             {/* Library Modal */}
//         </>
//     );
// };

// export default MarkdownDocumentManager;