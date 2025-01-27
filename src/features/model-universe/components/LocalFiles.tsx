import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setOntologyData, clearStore, clearModel } from "@/features/model-universe/modelSlice";
import { handleSaveToLocalFile } from '@/features/model-universe/components/HandleSaveToLocalFile';
import { handleGetLocalFile } from '@/features/model-universe/components/HandleGetLocalFile';
import { handleGetLocalFileClick } from '@/features/model-universe/components/HandleGetLocalFileClick';

const LocalFiles = ({ model, data }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  return (
    <div className="flex justify-between mx-2 px-4 text-white rounded ">
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