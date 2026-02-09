import type { PrismaClient } from "@prisma/client";
import { DEFAULT_STAGES } from "@/lib/constants";

export async function ensureDefaultStages(prisma: PrismaClient) {
  const count = await prisma.pipelineStage.count();
  if (count > 0) return;
  await prisma.pipelineStage.createMany({ data: DEFAULT_STAGES });
}
