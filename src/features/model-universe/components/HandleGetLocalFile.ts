// src/features/model-universe/components/HandleGetLocalFile.ts
import { setFileData, DataType } from '../modelSlice';
import { AppDispatch } from '@/store/store';

export const handleGetLocalFile = (event: React.ChangeEvent<HTMLInputElement>, dispatch: AppDispatch, existingData: DataType) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData: DataType = JSON.parse(e.target?.result as string);

        // merge the data with the existing state
        const updatedData = {
          ...existingData,
          phData: {
            ...existingData.phData,
            ...fileData.phData,
          },
          phSource: fileData.phSource || existingData.phSource,
          phFocus: fileData.phFocus || existingData.phFocus,
          phUser: fileData.phUser || existingData.phUser,
        };

        dispatch(setFileData(updatedData));
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
  }
};