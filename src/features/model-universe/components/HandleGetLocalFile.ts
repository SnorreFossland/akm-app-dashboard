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
        console.log('12 File data loaded:', fileData, existingData);

        // Check if required structures exist, provide defaults if not
        const fileModels = fileData?.phData?.metis?.models || [];
        const existingModels = existingData?.phData?.metis?.models || [];

        // merge the data with the existing state, ensuring required metis properties are included
        const updatedData = {
          phData: {
            metis: {
              // Use optional chaining and provide fallbacks
              ...(fileData?.phData?.metis || {}),
              ...(existingData?.phData?.metis || {}),
              metamodels: existingData?.phData?.metis?.metamodels?.length > 0
                ? existingData?.phData?.metis?.metamodels
                : fileData?.phData?.metis?.metamodels || [],
              models: [
                ...fileModels,
                ...existingModels,
              ],
            },
            domain: existingData?.phData?.domain || fileData?.phData?.domain || {},
            // ontology moved under domain in new shape
            // keep domain.ontology if present in either source
            ...(existingData?.phData?.domain?.ontology || fileData?.phData?.domain?.ontology
              ? { domain: { ...(existingData?.phData?.domain || fileData?.phData?.domain || {}), ontology: (existingData?.phData?.domain?.ontology || fileData?.phData?.domain?.ontology) } }
              : {}),
            documents: existingData?.phData?.documents || fileData?.phData?.documents || [],
          },
          phFocus: {
            ...(fileData?.phFocus || {}),
            ...(existingData?.phFocus || {}),
          },
          phUser: fileData?.phUser || existingData?.phUser || {},
          phSource: existingData?.phSource || existingData?.phData?.domain?.name || 'unknown',
          status: existingData?.status || 'ok',
        };

        console.log('27 Updated data:', updatedData);
        dispatch(setFileData(fileData));
        // dispatch(setFileData(updatedData));

      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
  }
};
