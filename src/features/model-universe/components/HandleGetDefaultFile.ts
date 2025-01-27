// src/features/model-universe/components/HandleGetLocalFile.ts
import { setFileData } from '../modelSlice';
import { AppDispatch } from '@/store/store';

export const handleGetDefaultFile = (event: React.ChangeEvent<HTMLInputElement>, dispatch: AppDispatch) => {
  const fileUrl = '/AKM-Core-Template_PR.json';
  console.log('7 file:', fileUrl);
  fetch(fileUrl)
    .then(response => response.blob())
    .then(blob => {
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
      reader.readAsText(blob);
    })
    .catch(error => {
      console.error('Error fetching file:', error);
    });
};