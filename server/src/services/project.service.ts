import type { Project } from "../../generated/prisma/client";
import {
  findAllProjects,
  findProjectById,
  CreateProjectWithMessageInput,
  createProjectWithMessage,
} from "../repository/project.repository";

export async function getAllProjects(): Promise<Project[]> {
  return findAllProjects();
}

export async function getProjectById(id: string): Promise<Project | null> {
  return findProjectById(id);
}

export async function createProject(
  input: string | CreateProjectWithMessageInput,
): Promise<Project> {
  const payload =
    typeof input === "string"
      ? {
          name: input.trim().slice(0, 40) || "Untitled project",
          messageContent: input.trim(),
        }
      : input;

  return createProjectWithMessage(payload);
}
