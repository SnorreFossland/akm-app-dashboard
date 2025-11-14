// src/features/model-universe/components/HandleGetDefaultFile.ts
import { setFileData, setSource } from '../modelSlice';
import { AppDispatch, persistor } from '@/store/store';

// Existing default loader
export const handleGetDefaultFile = (event: React.ChangeEvent<HTMLInputElement>, dispatch: AppDispatch) => {
  const fileUrl = '/Mimris-template_PR.json';
  fetch(fileUrl)
    .then(r => r.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data: any = JSON.parse(e.target?.result as string);
          dispatch(setFileData(data));
          // dispatch(setSource('AKM-Core-Template_PR'));
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

// Generic public file loader used by AppBootstrap
export const handleGetPublicFile = async (
  dispatch: AppDispatch,
  fileUrl: string,
  sourceName?: string
) => {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    dispatch(setFileData(data));
    if (sourceName) dispatch(setSource(sourceName));

    // Persist immediately to ensure the new template is saved
    if (typeof persistor !== 'undefined' && persistor.persist) {
      persistor.persist();
    }
  } catch (error) {
    console.error(`Error fetching ${fileUrl}:`, error);
  }
};