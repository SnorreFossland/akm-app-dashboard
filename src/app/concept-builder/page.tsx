import ConceptBuilder from '@/components/concept-builder/ConceptBuilder';
import ModelComponent from "@/features/model-universe/components/ModelComponent";

const SyncPage = () => {
  return (
    <div className="akm-canvas flex flex-col w-full h-full overflow-hidden">
      <div className="flex flex-col">
        <ModelComponent />
        <div className="flex overflow-hidden">
          <ConceptBuilder />
        </div>
      </div>
    </div>
  );
};

export default SyncPage;