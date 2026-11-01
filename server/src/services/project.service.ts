import type { Project } from "../../generated/prisma/client";
import {
  findAllProjects,
  findProjectById,
  CreateProjectWithMessageInput,
  createProjectWithMessage,
} from "../repository/project.repository";
import { generateSlug } from "random-word-slugs";
import { startCodeAgent } from "../temporal/client";

export async function getAllProjects(): Promise<Project[]> {
  return findAllProjects();
}

export async function getProjectById(id: string): Promise<Project | null> {
  return findProjectById(id);
}

export async function createProject(messageContent: string) {
  const name = generateSlug(3, { format: "kebab" });
  const project = await createProjectWithMessage({ name, messageContent });
  await startCodeAgent({
    projectId: project.id,
    prompt: messageContent,
  });
  return project;
}
