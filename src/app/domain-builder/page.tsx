import DomainBuilder from "@/components/domain-builder/DomainBuilder";
import ModelComponent from "@/features/model-universe/components/ModelComponent";

export default function VercelAiPage() {

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* {chatOutput && <div className="chat-output">{chatOutput}</div>} */}
      <div className="flex flex-col gap-1 m-1 ">
      <ModelComponent />
      <div className="flex mx-2 overflow-hidden">
        <DomainBuilder />
      </div>
      </div>
    </div>
  );
}