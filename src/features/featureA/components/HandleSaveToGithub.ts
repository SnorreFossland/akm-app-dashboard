// src/features/featureA/components/HandleSave.ts
import { saveFeatureAData } from '../featureASlice';
import { AppDispatch } from '@/store/store';

export const handleSaveToGithub = async (dispatch: AppDispatch, data: any,
  setSaveStatus: React.Dispatch<React.SetStateAction<'idle' | 'saving' | 'failed'>>, setPullRequestUrl: (url: string | null) => void) => {
  setSaveStatus('saving');
  try {
    const prUrl = await dispatch(saveFeatureAData(data)).unwrap();
    setSaveStatus('idle');
    setPullRequestUrl(prUrl);
    alert('Pull request created successfully!');
  } catch (error) {
    setSaveStatus('failed');
    console.error(error);
    alert('Failed to create pull request.');
  }
};