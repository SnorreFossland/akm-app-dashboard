// src/features/featureA/components/HandleGetLocalFile.ts
import { setFileData } from '../featureASlice';
import { AppDispatch } from '@/store/store';

export const handleGetLocalFile = (event: React.ChangeEvent<HTMLInputElement>, dispatch: AppDispatch) => {
  const file = event.target.files?.[0];
  console.log('file:', file);
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: any = { project: JSON.parse(e.target?.result as string) }; // adding project key to make it compatible with the new format
        console.log('data:', data);
        dispatch(setFileData(data)); // Dispatch the action with the data
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
  }
};