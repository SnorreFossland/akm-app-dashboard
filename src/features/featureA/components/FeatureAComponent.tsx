// src/features/featureA/components/FeatureAComponent.tsx
'use client';

import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { Button } from '@/components/ui/button';
import { handleSaveToLocalFile } from './HandleSaveToLocalFile';
import { handleGetFile } from './HandleGetFile';
import { handleGetLocalFile } from './HandleGetLocalFile';
import { handleGetLocalFileClick } from './HandleGetLocalFileClick';
import { handleSaveToGithub } from './HandleSaveToGithub';
import { clearStore } from '../featureASlice';
// import { handleClearStore } from './HandleClearStore';

function FeatureAComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.featureA.data);
  const status = useSelector((state: RootState) => state.featureA.status);
  const error = useSelector((state: RootState) => state.featureA.error);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'failed'>('idle');
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'failed'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<any>(null);

  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'failed') return <p>Error: {error}</p>;

  return (
    <div className='feature-a-component bg-gray-600 p-4 w-full'>
      <h1>AKMM Model Data</h1>

      <div className='feature-a-data text-left p-4 bg-gray-600'>
        {pullRequestUrl && (
          <p>
            <a href={pullRequestUrl} target="_blank" rel="noopener noreferrer">{pullRequestUrl}</a>
          </p>
        )}
        <div className='flex mt-0 mb-0 mx-1'>
          <Button onClick={() => handleGetFile(dispatch, setFileStatus, setFileContent)} disabled={fileStatus === 'loading'}>
            {fileStatus === 'loading' ? 'Loading...' : 'Get GitHub File'}
          </Button>
          <Button onClick={() => handleGetLocalFileClick(fileInputRef)}>
            Get Local File
          </Button>
          <Button onClick={() => dispatch(clearStore ())}>
            Clear Store
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="application/json"
          onChange={(event) => handleGetLocalFile(event, dispatch)}
        />
      </div>
      <hr />
      {data ? (
        <div className='feature-a-data text-left mx-2 p-4 bg-gray-700'>
          <div className='grid grid-cols-2 gap-4'>
            <h5>{data?.project?.phData?.metis?.name}</h5> <br />
            <div className='text-left text-gray p-4 bg-gray-800'>
              <h5>Models: </h5>
              <ul>
                {data?.project?.phData?.metis?.models.map((model: any) => (
                  <li key={model.name}>
                    {`${model.name} - ${model?.objects?.length} `}<br />
                  </li>
                ))}
              </ul>
            </div>
            <div className='text-left text-gray p-4 bg-gray-800'>
              <h6>Metamodels: </h6>
              {data?.project?.phData?.metis?.metamodels.map((metamodel: any) => (
                <React.Fragment key={metamodel.name}>
                  - {metamodel.name} <br />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className='text-center p-4 bg-gray-200'>No Model data available</div>
      )}
      <hr />
      <div className='feature-a-data text-left p-4 bg-gray-800'>
        <Button onClick={() => handleSaveToGithub(dispatch, data, setSaveStatus, setPullRequestUrl)} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? 'Saving...' : 'Save Data to GitHub'}
        </Button>
        <Button onClick={() => handleSaveToLocalFile(data)}>
          Save Data to Local File
        </Button>
      </div>
    </div>
  );
}

export default FeatureAComponent;