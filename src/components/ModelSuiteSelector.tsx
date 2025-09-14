import React from 'react';

type Model = { id?: string; name?: string; description?: string; objects?: any[]; relships?: any[]; modelviews?: any[] };

interface Props {
  metis?: { name?: string; models?: Model[] };
  currentModel?: Model | null;
  curMetamodel?: { id?: string; name?: string } | null;
  currentModelviewId?: string | null;
  onModelSelect: (modelName: string) => void;
  onModelviewSelect: (modelviewId: string | null) => void;
}

export default function ModelSuiteSelector({
  metis,
  currentModel,
  curMetamodel,
  currentModelviewId,
  onModelSelect,
  onModelviewSelect
}: Props) {

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModelSelect(e.target.value);
  };

  const handleModelviewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    onModelviewSelect(v === "" ? null : v);
  };

  const modelviews = currentModel?.modelviews || [];
  const focusModelview = (currentModelviewId) ? modelviews.find(mv => mv.id === currentModelviewId) : modelviews[0];  ;

  return (
    <div className="flex justify-between bg-gray-800 text-xs items-center gap-2 px-1">
      <div className="flex items-center gap-2">
        <div>
          <span className="ms-1 font-bold text-gray-400 inline-block">ModelSuite:</span>
          <span className="text-gray-300 ms-1">{metis?.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="model-select" className="me-1 font-bold text-gray-400 inline-block">Model:</label>
        <select
          id="model-select"
          className="ps-2 inline-block bg-gray-900 font-bold text-xs text-gray-200"
          onChange={handleModelChange}
          value={currentModel?.name || ""}
        >
          {metis?.models?.map((model, idx) => (
            <option key={model.id || `${model.name ?? 'model'}-${idx}`} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="modelview-select" className="me-1 font-bold text-gray-400 inline-block">Modelview:</label>
        <select
          id="modelview-select"
          className="ps-2 inline-block bg-gray-900 text-gray-400"
          onChange={handleModelviewChange}
          value={currentModelviewId || ""}
        >
          <option value="">{focusModelview?.name}</option>
          {modelviews.map((mv: any, idx: number) => (
            <option key={mv.id || `${mv.name ?? 'mv'}-${idx}`} value={mv.id}>
              {mv.name || mv.id}
            </option>
          ))}
        </select>
      </div>

      <div className="px-1 me-auto">
        <span className="text-gray-400">{curMetamodel?.name || "Default"}</span>
      </div>

      <div className="flex items-center">
        <h3 className="flex ms-1 pl-1 font-bold text-gray-400 inline-block">
          No.ofObj:
          <span className="px-1 inline-block bg-gray-900 w-16 text-right">
            {currentModel?.objects?.length ?? 0}
          </span>
        </h3>
      </div>
    </div>
  );
}