// src/features/featureA/components/FeatureAComponent.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getFeatureAData, saveFeatureAData } from '../featureASlice';
import type { RootState, AppDispatch } from '@/store/store';
import { Button } from '@/components/ui/button';

interface DataType {
  content: {
    phData: { metis: any }
  }
}

export default function FeatureAComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.featureA.data);
  const status = useSelector((state: RootState) => state.featureA.status);
  const error = useSelector((state: RootState) => state.featureA.error);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'failed'>('idle');
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<any | null>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'failed'>('idle');

  const handleGetFile = async () => {
    setFileStatus('loading');
    console.log('42 handleGetFile');
    try {
      await dispatch(getFeatureAData()).unwrap();
      setFileStatus('idle');
      setFileContent(data.content);
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
    <div className='feature-a-component bg-gray-600 p-4 w-full'>
      <h1>Feature A Model Data</h1>
      {data 
        ? (
          <div className='feature-a-data text-left p-4 bg-gray-700'>
            <div className='mt-4 mb-4 text-left text-gray p-4 bg-gray-800'>
            {data.content?.phData?.metis?.name} <br />
            <h5>Models: </h5>
            {data.content?.phData?.metis?.models.map(
              (model: any) => (
                <React.Fragment key={model.name}>
                 - {model.name} <br />
                </React.Fragment>
              )
            )}
            </div>
            <div className='mt-4 mb-4 text-left text-gray p-4 bg-gray-600'>
              <h6>Metamodels: </h6>
              {data.content?.phData?.metis?.metamodels.map(
                (metamodel: any) => (
                  <React.Fragment key={metamodel.name}>
                  - {metamodel.name} <br />
                  </React.Fragment>
                )
              )}
            </div>
          </div>
        ) 
        : 'No data available'}
      <hr />
      <div className='feature-a-data text-left p-4 bg-gray-800'>
        {pullRequestUrl && (
          <p>
            <a href={pullRequestUrl} target="_blank" rel="noopener noreferrer">{pullRequestUrl}</a>
          </p>
        )}
        <Button onClick={handleGetFile} disabled={fileStatus === 'loading'}>
          {fileStatus === 'loading' ? 'Loading...' : 'Get GitHub File'}
        </Button>
        <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? 'Saving...' : 'Save Data to GitHub'}
        </Button>

      </div>
    </div>
  );
}