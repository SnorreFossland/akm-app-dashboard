// src/features/featureA/components/HandleGetFile.ts
import { getFeatureAData } from '../featureASlice';
import { AppDispatch } from '@/store/store';

export const handleGetFile = async (dispatch: AppDispatch, setFileStatus: (status: string) => void, setFileContent: (content: any) => void) => {
  setFileStatus('loading');
  try {
    const result = await dispatch(getFeatureAData()).unwrap();
    setFileStatus('idle');
    console.log('File fetched successfully:', result);
    if (result) {
      setFileContent(result);
    } else {
      console.error('No data returned');
      alert('No data returned from the server.');
    }
  } catch (error) {
    setFileStatus('failed');
    console.error(error);
    alert('Failed to fetch file.');
  }
};