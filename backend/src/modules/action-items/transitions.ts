import { allowedStatusTransitions, actionStatusUpdateBodySchema } from "@artixio/shared";
import type { ActionStatus } from "@artixio/shared";
import { z } from "zod";

export const actionItemStatusParamsSchema = z.object({
  id: z.string().min(1)
});

export const actionItemStatusBodySchema = actionStatusUpdateBodySchema;

export function assertValidStatusTransition(currentStatus: ActionStatus, nextStatus: ActionStatus) {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!allowedStatusTransitions[currentStatus].includes(nextStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${nextStatus}`);
  }
}

