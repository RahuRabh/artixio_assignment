import { Router } from "express";
import { getAnalyticsSummary } from "../modules/directives/directive.service.js";

export const analyticsRouter = Router();

analyticsRouter.get("/summary", async (_request, response, next) => {
  try {
    const result = await getAnalyticsSummary();
    response.json(result);
  } catch (error) {
    next(error);
  }
});

