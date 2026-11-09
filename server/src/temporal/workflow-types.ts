import { TodoItem } from "../lib/plan";

export interface WorkflowAgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface WorkflowPipelineState {
  todos: TodoItem[];
  thread: WorkflowAgentMessage[];
  files: Record<string, string>;
  designNotes: string;
  builderNotes: string;
  reveiwNotes: string;
  summary: string;
  planMessageId?: string;
}

export function emptyPipelineState(
  thread: WorkflowAgentMessage[],
): WorkflowPipelineState {
  return {
    todos: [],
    thread: thread,
    files: {},
    designNotes: "",
    builderNotes: "",
    reveiwNotes: "",
    summary: "",
  };
}
