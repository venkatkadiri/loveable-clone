import Router from "express";
import { validateBody, validateParams } from "../middleware/validate";
import { createMessageBodySchema, idParamsSchema } from "../middleware/schemas";
import { listProjects, getProject } from "../controllers/project";
import { createProjectMessage } from "../controllers/message";

export const projectRouter = Router();

projectRouter.get("/", listProjects);

projectRouter.get("/:id", validateParams(idParamsSchema), getProject);

projectRouter.post(
  "/:id/messages",
  validateParams(idParamsSchema),
  validateBody(createMessageBodySchema),
  createProjectMessage,
);
