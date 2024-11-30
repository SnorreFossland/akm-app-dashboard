import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setOntologyData, clearStore } from "@/features/ontology/ontologySlice";
import { handleSaveToLocalFile } from '@/features/featureA/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/featureA/components/HandleGetLocalFile';
import { handleGetLocalFileClick } from '@/features/featureA/components/HandleGetLocalFileClick';

const LocalFiles = ({ currentModel, model, data }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  return (
    <div className="flex justify-between mx-2 px-4 text-white rounded ">
      <div className="flex justify-between align-center bg-gray-800">
        <h3 className="mx-2 font-bold text-gray-400 inline-block"> Current Model: </h3> <span className="inline-block"> {currentModel?.name}</span>
        <h3 className="mx-2 font-bold text-gray-400 inline-block"> No. of Objects: </h3> <span className="inline-block"> {currentModel?.objects.length}</span>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleGetLocalFile(e, dispatch)}
      />
      <div className="flex ">
        <button
          className="bg-blue-500 text-white rounded m-1 py-0.5 px-2 text-xs"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          Load Local File
        </button>
        <button
          className="bg-red-500 text-white rounded m-1 py-0 px-2 text-xs"
          onClick={() => {
            dispatch(clearModel(model));
          }}
        >
          Clear Model
        </button>
        <button
          className="bg-red-500 text-white rounded m-1 py-0 px-2 text-xs"
          onClick={() => {
            dispatch(clearStore());
          }}
        >
          Clear Store
        </button>
        <button
          className="bg-blue-500 text-white rounded m-1 py-0 px-2 text-xs"
          onClick={() => {
            handleSaveToLocalFile(data);
          }}
        >
          Save to Local file
        </button>
      </div>
    </div>
  );
};

export default LocalFiles;