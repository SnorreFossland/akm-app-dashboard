// src/features/featureA/components/HandleGetFile.ts
import { getmodelData } from '../modelSlice';
import { AppDispatch } from '@/store/store';


export const handleGetFile = async (dispatch: AppDispatch, setFileStatus: React.Dispatch<React.SetStateAction<'idle' | 'loading' | 'failed'>>, setFileContent: (content: any) => void) => {
  setFileStatus('loading');
  try {
    const result = await dispatch(getmodelData()).unwrap();
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