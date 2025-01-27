import ModelviewBuilder from '@/components/model-universe/ModelviewBuilder';
import ModelComponent from "@/features/model-universe/components/ModelComponent";

const SyncPage = () => {

  return (
    <div className="akm-canvas flex flex-col gap-1 m-1">
      <ModelComponent /> 
      <div className="flex flex-col gap-1 m-1">
          <ModelviewBuilder />
      </div>
    </div>
  );
};

export default SyncPage;