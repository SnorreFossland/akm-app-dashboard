// src/features/model/components/ModelComponent.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';


// import { Button } from '@/components/ui/button';
import { handleSaveToLocalFile } from './HandleSaveToLocalFile';
import { handleGetFile } from './HandleGetFile';
import { handleGetLocalFile } from './HandleGetLocalFile';
// import { handleGetLocalFileClick } from './HandleGetLocalFileClick';
import { handleSaveToGithub } from './HandleSaveToGithub';
import { clearStore, clearModel } from '../modelSlice';
import { handleGetDefaultFile } from './HandleGetDefaultFile';
// import { set } from 'zod';
// import { handleClearStore } from './HandleClearStore';


function ModelComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.modelUniverse);
  const status = useSelector((state: RootState) => state.modelUniverse.status as 'idle' | 'loading' | 'failed');
  const error = useSelector((state: RootState) => state.modelUniverse.error);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'failed'>('idle');
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'failed'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<any>(null);

  const [metis, setMetis] = useState<any>(null);

  const [currentModel, setCurrentModel] = useState<any>(null);
  const [currentModelview, setCurrentModelview] = useState<any>(null);
  const [focusModel, setFocusModel] = useState<any>(null);
  const [focusModelview, setFocusModelview] = useState<any>(null);
  const [focusObject, setFocusObject] = useState<any>(null);
  const [focusObjectview, setFocusObjectview] = useState<any>(null);
  // const [focusRelationship, setFocusRelationship] = useState<any>(null);
  // const [focusRelationshipview, setFocusRelationshipview] = useState<any>(null);

  // const [detailsOpen, setDetailsOpen] = useState(false);
  console.log('49 ModelComponent:', data);

  useEffect(() => {
    if (!data.phData) {
      handleGetDefaultFile({} as React.ChangeEvent<HTMLInputElement>, dispatch);
    }
  }, []);
  
  useEffect(() => {
    if (data.phFocus) {
      setFocusModel(data.phFocus.focusModel);
      setFocusModelview(data.phFocus.focusModelview);
      setFocusObject(data.phFocus.focusObject);
      setFocusObjectview(data.phFocus.focusObjectview);
      // setFocusRelationship(data.phFocus.focusRelship);
      // setFocusRelationshipview(data.phFocus.focusRelshipview);
    // }
    // if (data.phData.metis) {
      setMetis(data.phData.metis);
      setCurrentModel(data.phData.metis.models.find(model => model.id === focusModel?.id));
      setCurrentModelview(currentModel?.modelviews.find(modelview => modelview.id === focusModelview?.id));
      
    }
  }, [data.phFocus, data.phData.metis, focusModel?.id, focusModelview?.id, currentModel?.modelviews]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModel = data.phData.metis.models.find((model: any) => model.name === event.target.value);
    setCurrentModel(selectedModel);
    // if (selectedModel) {
    //   setCurrentModelview(selectedModel.modelviews[0]);
    // }
  };

  const handleModelviewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModelview = currentModel.modelviews.find((modelview: any) => modelview.name === event.target.value);
    setCurrentModelview(selectedModelview);
  };

  // if (status === 'loading') return <div>Loading...</div>;
  // if (status === 'failed') return <div>Error: {error}</div>;

  // if (!metis || !currentModel || !currentModelview) return null;

  return (
    <div className='model-universe-a-component w-full'>
      <header className="m-2 me-auto w-full bg-green-500/50 text-gradient-to-r from-green-700 to-blue-700 text-transparent bg-clip-text shadow-md shadow-green-500/50">
        <div className="flex justify-between items-center font-bold text-white text-green-500 mx-5">
          <div className="me-5 mb-0 mt-4 text-muted-foreground">AKM file :
            <span className="px-2 text-gray-300">{data.phData.metis?.name}.json</span>
          </div>
          <div className="me-5 text-3xl rounded bg-green-500/50 text-gradient-to-r from-green-700 to-blue-700 text-transparent bg-clip-text shadow-md shadow-green-500/50">
            &nbsp;&nbsp; AKM-Core-Template &nbsp;&nbsp;
          </div>
          <div className="flex items-center mx-5">
            <div className="mx-4 text-orange-700">AI-Powered AKM Dashboard</div>
            <FontAwesomeIcon icon={faRobot} className="text-orange-700" />
          </div>
        </div>
      </header>
      <div className="flex justify-between bg-gray-800">
        <div className="flex justify-between bg-gray-600 p-1">
          <div className=" px-1 bg-gray-800">
            <label htmlFor="model-select" className="mx-1 font-bold text-gray-400 inline-block">Model:</label>
            <select id="model-select" className="px-2 inline-block bg-gray-900 text-gray-400 inline-block" onChange={handleModelChange} value={currentModel?.name}>
              {metis?.models.map((model: { name: string }) => (
                <option key={model.name} value={model.name}>{model.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-gray-800">
            <label htmlFor="model-view-select" className="mx-2 font-bold text-gray-400 inline-block">Model View:</label>
            <select id="model-view-select" className="px-2 py-0 inline-block text-gray-400 inline-block" onChange={handleModelviewChange} value={currentModelview?.name}>
              {currentModel?.modelviews?.map((modelView: { name: string }) => (
                <option key={modelView.name} value={modelView.name}>{modelView.name}</option>
              ))}
            </select>
          </div>
          <h3 className="flex mx-1 pl-1 font-bold  bg-gray-700 text-gray-400 inline-block">No.ofObj:<span className="px-1 inline-block bg-gray-900 w-full"> {currentModel?.objects?.length}</span></h3>
        </div>
        <div className="flex bg-gray-800">
          <button
            className="bg-gray-700 text-white rounded m-1 py-0.5 px-2 text-xs"
            onClick={() => handleGetFile(dispatch, setFileStatus, setFileContent)} disabled={fileStatus === 'loading'}>
            {fileStatus === 'loading' ? 'Loading...' : 'Load from GitHub'}
          </button>
          <button
            className="bg-gray-700 text-white rounded m-1 py-0.5 px-2 text-xs"
            onClick={() => handleSaveToGithub(dispatch, data, setSaveStatus, setPullRequestUrl)} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : 'Save to GitHub'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleGetLocalFile(e, dispatch)}
          />
          <button
            className="bg-blue-500 text-white rounded m-1 py-0.5 px-2 text-xs"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            Open Local File
          </button>
          <button
            className="bg-blue-500 text-white rounded m-1 py-0 px-2 text-xs"
            onClick={() => {
              handleSaveToLocalFile(data);
            }}
          >
            Save Local file
          </button>

          <button
            className="bg-red-500 text-white rounded m-1 py-0 px-2 text-xs"
            onClick={() => {
              dispatch(clearModel(currentModel));
            }}
          >
            Clear Model
          </button>
          <button
            className="bg-red-500 text-white rounded m-1 py-0 px-2 text-xs"
            onClick={() => {
              dispatch(clearStore());
              handleGetDefaultFile({} as React.ChangeEvent<HTMLInputElement>, dispatch);
            }}
          >
            Clear Store
          </button>

        </div>
      </div>
      <div className="flex bg-gray-800">
        <div className=" bg-gray-800 w-full">
          <details>
            <summary className="m-1 w-full cursor-pointe">Current AKM file details...</summary>
            <hr />
            <div className='model-universe-a-data text-left mx-2 p-2 bg-gray-600 w-full'>
              <div className="p-1 flex justify-start bg-gray-600">
                <div className="flex justify-left mx-1 bg-gray-800">Focus:
                  <h3 className="mx-2 font-bold text-gray-400 bg-gray-800 inline-block">Model: <span className="px-2 inline-block bg-gray-900"> {focusModel?.name} </span></h3>
                  <h3 className="mx-2 font-bold text-gray-400 inline-block">Modelview: <span className="px-2 inline-block bg-gray-900"> {focusModelview?.name}</span></h3>
                  <h3 className="mx-2 font-bold text-gray-400 inline-block">Object:  <span className="px-2 inline-block bg-gray-900"> {focusObject?.name}</span></h3>
                  <h3 className="mx-2 font-bold text-gray-400 inline-block">Objectview:  <span className="px-2 inline-block bg-gray-900"> {focusObjectview?.name}</span></h3>
                  {/* <h3 className="mx-2 font-bold text-gray-400 inline-block">Relationship:  <span className="px-2 inline-block bg-gray-900"> {focusRelationship?.name}</span></h3>
                <h3 className="mx-2 font-bold text-gray-400 inline-block">Relationshipview:  <span className="px-2 inline-block bg-gray-900"> {focusRelationshipview?.name}</span></h3> */}
                </div>
              </div>
              <h1>Current Model:</h1>
              {pullRequestUrl && (
                <p>
                  <a href={pullRequestUrl} target="_blank" rel="noopener noreferrer">{pullRequestUrl}</a>
                </p>
              )}
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
              <div className='model-universe-a-data text-left mx-2 p-4 bg-gray-700 w-full'>
                <div className='grid grid-cols-2 gap-4 w-full'>
                  <h5>{data?.phData?.metis?.name}</h5> <br />
                  <div className='text-left text-gray p-4 bg-gray-800 w-full'>
                    <h5>Models: </h5>
                    <ul>
                      {data?.phData?.metis?.models?.map((model: any) => (
                        <li key={model.name} className="mb-2">
                          <span className="font-bold">{model.name}</span><span className="italic"> - {model.description}</span> <span className="text-gray-400 float-right"> {model?.objects?.length} objects</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='text-left text-gray p-4 bg-gray-800 w-full'>
                    <h6>Metamodels: </h6>
                    {data?.phData?.metis?.metamodels?.map((metamodel: any) => (
                      <li key={metamodel.name} className="mb-2">
                        <span className="font-bold">{metamodel.name}</span><span className="italic"> - {metamodel.description}</span> <span className="text-gray-400 float-right"> | {metamodel?.objecttypes?.length} object types</span>
                      </li>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center p-4 bg-gray-200 w-full'>No Model data available</div>
            )}
            <hr />
            <div className='model-universe-a-data text-left p-4 bg-gray-800 w-full'>
            </div>
          </details>
          {/* <span className="ms-2">{detailsOpen ? '▼' : '▶'}</span> */}
        </div>
      </div>
    </div>
  );
}

export default ModelComponent;