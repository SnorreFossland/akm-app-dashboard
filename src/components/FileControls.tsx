import React from 'react';
import { Button } from "@/components/ui/button";
import { clearStore, clearModel } from "@/features/featureA/featureASlice";

const FileControls = ({ fileInputRef, dispatch, model, handleGetLocalFile, handleSaveToLocalFile }) => (
    <div className="flex justify-between mx-2 px-4 text-white rounded">
        <div className="flex justify-between align-center bg-gray-800">
            <h3 className="mx-2 font-bold text-gray-400 inline-block"> Current Model: </h3> <span className="inline-block"> {model?.name}</span>
            <h3 className="mx-2 font-bold text-gray-400 inline-block"> No. of Objects: </h3> <span className="inline-block"> {model?.objects.length}</span>
        </div>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleGetLocalFile(e, dispatch)} />
        <div className="flex ">
            <Button className="bg-blue-500 text-white rounded m-1 py-0.5 px-2 text-xs" onClick={() => fileInputRef.current?.click()}>
                Load Local File
            </Button>
            <Button className="bg-red-500 text-white rounded m-1 py-0 px-2 text-xs" onClick={() => dispatch(clearModel(model))}>
                Clear Model
            </Button>
            <Button className="bg-red-500 text-white rounded m-1 py-0 px-2 text-xs" onClick={() => dispatch(clearStore())}>
                Clear Store
            </Button>
            <Button className="bg-blue-500 text-white rounded m-1 py-0 px-2 text-xs" onClick={() => handleSaveToLocalFile(data)}>
                Save to Local file
            </Button>
        </div>
    </div>
);

export default FileControls;