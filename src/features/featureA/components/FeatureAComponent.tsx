// src/features/featureA/components/FeatureAComponent.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getFeatureAData, saveFeatureAData } from '../featureASlice';
import type { RootState, AppDispatch } from '@/store/store';

export default function FeatureAComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.featureA.data);
  const status = useSelector((state: RootState) => state.featureA.status);
  const error = useSelector((state: RootState) => state.featureA.error);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'failed'>('idle');
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<any | null>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'failed'>('idle');

  // useEffect(() => {
  //   if (status === 'idle') {
  //     dispatch(getFeatureAData());
  //   }
  // }, [status, dispatch]);

  const handleGetFile = async () => {
    setFileStatus('loading');
    console.log('42 handleGetFile');
    try {
      await dispatch(getFeatureAData()).unwrap();
      setFileStatus('idle');
    } catch (error) {
      setFileStatus('failed');
      console.error(error);
      alert('Failed to fetch file.');
    }
  };

  const handleSave = async () => {
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



  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'failed') return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Feature A Model Data</h1>
      <p>{data ? data.phData.metis?.name : 'No data available'}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <button onClick={handleSave} disabled={saveStatus === 'saving'}>
        {saveStatus === 'saving' ? 'Saving...' : 'Save Data to GitHub'}
      </button>
      {pullRequestUrl && (
        <p>
          <a href={pullRequestUrl} target="_blank" rel="noopener noreferrer">{pullRequestUrl}</a>
        </p>
      )}

      <button onClick={handleGetFile} disabled={fileStatus === 'loading'}>
        {fileStatus === 'loading' ? 'Loading...' : 'Get GitHub File'}
      </button>
      {/* {fileContent && (
        <p>{fileContent.phData.metis.name}</p>
      )} */}
    </div>
  );
}