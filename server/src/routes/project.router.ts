import Router from "express";
import { validateParams } from "../middleware/validate";
import { idParamsSchema } from "../middleware/schemas";
import { listProjects, getProject } from "../controllers/project";

export const projectRouter = Router();

projectRouter.get("/", listProjects);

projectRouter.get("/:id", validateParams(idParamsSchema), getProject);
