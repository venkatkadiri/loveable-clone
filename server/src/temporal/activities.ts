import { FileCollection, readSandboxTree } from "../lib/sandbox";
import { FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "../lib/prompt";
import { runLlmPrompt } from "../lib/llm";

export { saveResult } from "../repository/message.repository";

export async function createSandbox(projectId: string) {
  return projectId;
}

export async function loadSandboxFiles(
  projectId: string,
): Promise<FileCollection> {
  return readSandboxTree(projectId);
}
export async function generateTitle(summary: string): Promise<string> {
  const title = await runLlmPrompt(FRAGMENT_TITLE_PROMPT, summary);
  return title.trim().replace(/["']/g, "").trim().slice(0, 40) ?? "Untitled";
}

export async function generateResponse(summary: string) {
  const response = await runLlmPrompt(RESPONSE_PROMPT, summary);
  return response.trim();
}
