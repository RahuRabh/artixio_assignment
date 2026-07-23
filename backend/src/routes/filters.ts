import { Router } from "express";
import { getFilterOptions } from "../modules/directives/directive.service.js";

export const filtersRouter = Router();

filtersRouter.get("/", async (_request, response, next) => {
  try {
    const result = await getFilterOptions();
    response.json(result);
  } catch (error) {
    next(error);
  }
});

