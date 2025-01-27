import ConceptBuilder from '@/components/concept-builder/ConceptBuilder';
import ModelComponent from "@/features/model-universe/components/ModelComponent";

const SyncPage = () => {
  return (
    <div className="akm-canvas flex flex-col gap-1 m-1">
      <div className="flex flex-col gap-1 m-1">
        <ModelComponent />
        <div className="flex mx-2">
          <ConceptBuilder />
        </div>
      </div>
    </div>
  );
};

export default SyncPage;