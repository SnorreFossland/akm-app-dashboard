import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setFileData } from '@/features/model-universe/modelSlice';
import updateFileContent from '@/features/model-universe/modelSlice';
// import { AppDispatch } from '@/store/store';

const LocalFile: React.FC = () => {
    const [fileContent, setFileContent] = useState<string>('');
    const dispatch = useDispatch();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setFileContent(text);
                try {
                    const data = JSON.parse(text);
                    dispatch(setFileData(data)); // Dispatch the action with the parsed JSON data
                } catch (error) {
                    console.error('Error parsing file content as JSON:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleSaveFile = () => {
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'file.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <input type="file" onChange={(e) => handleFileChange(e)} />
            <textarea
                value={fileContent}
                onChange={(e) => {
                    setFileContent(e.target.value);
                    // dispatch(updateFileContent({ content: e.target.value, other: "" })); // Dispatch the action with the updated content
                }}
                rows={10}
                cols={50}
            />
            <button onClick={handleSaveFile}>Save File</button>
        </div>
    );
};

export default LocalFile;