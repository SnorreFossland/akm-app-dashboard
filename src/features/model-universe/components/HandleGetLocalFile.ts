// src/features/model-universe/components/HandleGetLocalFile.ts
import { setFileData } from '../modelSlice';
import { AppDispatch } from '@/store/store';

export const handleGetLocalFile = (event: React.ChangeEvent<HTMLInputElement>, dispatch: AppDispatch) => {
  const file = event.target.files?.[0];
  // console.log('7 file:', file);
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: any = JSON.parse(e.target?.result as string); // Parse the JSON string
        console.log('13 data:', data);
        dispatch(setFileData(data)); // Dispatch the action with the data
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
  }
};