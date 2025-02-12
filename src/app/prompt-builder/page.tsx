import PromptBuilder from "@/components/prompt-builder/PromptBuilder";
import ModelComponent from "@/features/model-universe/components/ModelComponent";

export default function VercelAiPage() {

  return (
    <div className="akm-canvas flex flex-col gap-1 m-1">
      {/* {chatOutput && <div className="chat-output">{chatOutput}</div>} */}
      <div className="flex flex-col gap-1 m-1">
        <ModelComponent />
        <div className="flex mx-2">
          <PromptBuilder />
        </div>
      </div>
    </div>
  );
}