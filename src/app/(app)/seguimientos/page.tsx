import { FollowUpsBoard } from "@/components/seguimientos/FollowUpsBoard";
import { WeeklyAgenda } from "@/components/seguimientos/WeeklyAgenda";

export default function SeguimientosPage() {
  return (
    <div className="flex flex-col gap-10">
      <FollowUpsBoard />
      <WeeklyAgenda />
    </div>
  );
}
