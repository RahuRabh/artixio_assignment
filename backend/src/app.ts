import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { env } from "./lib/env.js";
import { directivesRouter } from "./routes/directives.js";
import { actionItemsRouter } from "./routes/action-items.js";
import { analyticsRouter } from "./routes/analytics.js";
import { filtersRouter } from "./routes/filters.js";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/directives", directivesRouter);
app.use("/api/action-items", actionItemsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/filters", filtersRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Validation failed",
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof Error && error.message.startsWith("Invalid transition")) {
    response.status(400).json({ message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({
    message: "Internal server error"
  });
});

