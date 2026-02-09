import { PipelineSettings } from "@/components/settings/PipelineSettings";
import { TagSettings } from "@/components/settings/TagSettings";

export default function AjustesPage() {
  return (
    <div className="flex flex-col gap-10">
      <PipelineSettings />
      <TagSettings />
    </div>
  );
}
