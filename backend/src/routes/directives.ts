import { Router } from "express";
import { listDirectives } from "../modules/directives/directive.service.js";

export const directivesRouter = Router();

directivesRouter.get("/", async (request, response, next) => {
  try {
    const result = await listDirectives(request.query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

