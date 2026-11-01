import Router from "express";
import { validateBody, validateParams } from "../middleware/validate";
import {
  createMessageBodySchema,
  createProjectBodySchema,
  idParamsSchema,
} from "../middleware/schemas";
import {
  listProjects,
  getProject,
  createProjectHandler,
} from "../controllers/project";
import {
  createProjectMessage,
  listProjectMessages,
} from "../controllers/message";

export const projectRouter = Router();

projectRouter.get("/", listProjects);

projectRouter.get("/:id", validateParams(idParamsSchema), getProject);
projectRouter.get(
  "/:id/messages",
  validateParams(idParamsSchema),
  listProjectMessages,
);

projectRouter.post(
  "/:id/messages",
  validateParams(idParamsSchema),
  validateBody(createMessageBodySchema),
  createProjectMessage,
);
projectRouter.post(
  "/",
  validateBody(createProjectBodySchema),
  createProjectHandler,
);
