import ModelBuilder from '@/components/model-universe/ModelBuilder';
import ModelComponent from "@/features/model-universe/components/ModelComponent";

const SyncPage = () => {

  return (
    <div className="akm-canvas flex flex-col gap-1 m-1">
      <ModelComponent /> 
      <div className="flex flex-col gap-1 m-1">
          <ModelBuilder />
      </div>
    </div>
  );
};

export default SyncPage;