import DomainBuilder from "@/components/domain-builder/DomainBuilder";
import ModelComponent from "@/features/model-universe/components/ModelComponent";

export default function VercelAiPage() {

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* {chatOutput && <div className="chat-output">{chatOutput}</div>} */}
      <div className="flex flex-col ">
      <ModelComponent />
      <div className="flex overflow-hidden">
        <DomainBuilder />
      </div>
      </div>
    </div>
  );
}