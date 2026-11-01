import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";

export async function pingWorkflow(name: string): Promise<string> {
  return `Hello, ${name}!`;
}
const { createSandbox, saveResult, generateTitle, generateResponse } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "10 minutes",
    retry: {
      maximumAttempts: 3,
    },
  });

export interface CodeAgentInput {
  projectId: string;
  prompt: string;
}

export async function codeAgentWorkflow(input: CodeAgentInput) {
  const sandboxUrl = await createSandbox(input.projectId);
  const summary = input.prompt.trim() || "Build a useful product prototype";
  const title = await generateTitle(summary);
  const response = await generateResponse(summary);
  await saveResult({
    projectId: input.projectId,
    content: response,
    title: title,
    sandboxUrl: sandboxUrl,
    files: {
      "src/App.tsx": `export default function App() {
  return <h1>Placeholder generated app</h1>;
}
`,
    },
  });

  return {
    files: null,
  };
}
