import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { actionItemStatusBodySchema, actionItemStatusParamsSchema, assertValidStatusTransition } from "../modules/action-items/transitions.js";
import { updateActionItemStatus } from "../modules/directives/directive.service.js";

export const actionItemsRouter = Router();

actionItemsRouter.patch("/:id/status", async (request, response, next) => {
  try {
    const { id } = actionItemStatusParamsSchema.parse(request.params);
    const { status } = actionItemStatusBodySchema.parse(request.body);
    const existing = await prisma.actionItem.findUniqueOrThrow({ where: { id } });

    assertValidStatusTransition(existing.status, status);

    const result = await updateActionItemStatus(id, status);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

