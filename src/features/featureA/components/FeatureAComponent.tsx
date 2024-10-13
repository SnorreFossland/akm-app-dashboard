// src/features/featureA/components/FeatureAComponent.tsx
'use client';

import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getFeatureAData, saveFeatureAData, setFileData } from '../featureASlice';
import type { RootState, AppDispatch } from '@/store/store';
import { Button } from '@/components/ui/button';

export default function FeatureAComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.featureA.data);
  const status = useSelector((state: RootState) => state.featureA.status);
  const error = useSelector((state: RootState) => state.featureA.error);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'failed'>('idle');
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'failed'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<any>(null);

  const handleGetFile = async () => {
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


  const handleGetLocalFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('45 file:', file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data: any = { project: JSON.parse(e.target?.result as string) };
          console.log('48 e:', data);
          dispatch(setFileData(data)); // Dispatch the action with the data
        } catch (error) {
          console.error('Error parsing JSON:', error);

        }
      };
      reader.readAsText(file);
    }
  };

  const handleGetLocalFileClick = () => {
    fileInputRef.current?.click();
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

  // if (!data) {
  //   return <div>Loading...</div>
  // }

  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'failed') return <p>Error: {error}</p>;

  console.log('76 data:', data);

  return (
    <div className='feature-a-component bg-gray-600 p-4 w-full'>
      <h1>Feature A Model Data</h1>

      <div className='feature-a-data text-left p-4 bg-gray-600'>
        {pullRequestUrl && (
          <p>
          <a href={pullRequestUrl} target="_blank" rel="noopener noreferrer">{pullRequestUrl}</a>
          </p>
        )}
        <div className='flex mt-0 mb-0'>
          <Button onClick={handleGetFile} disabled={fileStatus === 'loading'}>
          {fileStatus === 'loading' ? 'Loading...' : 'Get GitHub File'}
          </Button>
          <Button onClick={handleGetLocalFileClick}>
          Get Local File
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="application/json"
          onChange={handleGetLocalFile}
        />
      </div>
      <hr />

      {data // show what in redux store
      ? <div className='feature-a-data text-left mx-2 p-4 bg-gray-700'>
          <div className='grid grid-cols-2 gap-4'>
            <h5>{data?.project?.phData?.metis?.name}</h5> <br />
            <div className='text-left text-gray p-4 bg-gray-800'>
              <h5>Models: </h5>
              <ul>
              {data?.project?.phData?.metis?.models.map(
                (model: any) => (
                <li key={model.name}>
                  {`${model.name} - ${model?.objects?.length} `}<br />
                </li>
                )
              )}
              </ul>
            </div>
            <div className='text-left text-gray p-4 bg-gray-800'>
              <h6>Metamodels: </h6>
              {data?.project?.phData?.metis?.metamodels.map(
              (metamodel: any) => (
                <React.Fragment key={metamodel.name}>
                - {metamodel.name} <br />
                </React.Fragment>
              )
              )}
            </div>
          </div>
        </div>
      : <div className='text-center p-4 bg-gray-200'>No Model data available</div>}
      <hr />
      <div className='feature-a-data text-left p-4 bg-gray-800'>
      <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
        {saveStatus === 'saving' ? 'Saving...' : 'Save Data to GitHub'}
      </Button>
      </div>
      {/* <div>
        <input type="file" onChange={handleGetLocalFile} />
        <h2>heading: {data?.project?.phData.metis.name}</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre> 
      </div> */}
    </div>
  );
}