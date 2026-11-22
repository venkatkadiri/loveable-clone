import { inferToDoPhase, type InferPhaseOptions } from "./jev";

export type TodoStatus = "pending" | "in_progress" | "completed" | "canceled";

export interface TodoItem {
  content: string;
  status: TodoStatus;
  phase: TodoPhase;
}

export const PLAN_KIND = "plan";

export interface PlanActivity {
  agent: string;
  details: string;
}
export interface PlanMessage {
  todos: TodoItem[];
  kind: typeof PLAN_KIND;
  activity?: PlanActivity;
}
export const statuses: readonly TodoStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "canceled",
];
export type TodoPhase = "design" | "build" | "review" | "cancelled";

export const PHASES: readonly TodoPhase[] = [
  "design",
  "build",
  "review",
  "cancelled",
];

const PHASE_INDEX: Record<TodoPhase, number> = {
  design: 0,
  build: 1,
  review: 2,
  cancelled: 3,
};

export function isTodoPhase(value: unknown): value is TodoPhase {
  return (
    typeof value === "string" && (PHASES as readonly string[]).includes(value)
  );
}

export async function parsePhase(
  value: unknown,
  content: string,
  options?: InferPhaseOptions,
): Promise<TodoPhase> {
  if (isTodoPhase(value)) {
    return value;
  }

  return inferToDoPhase(content, options);
}

const STATUS_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = {
  // graph edges
  pending: ["in_progress"],
  in_progress: ["completed", "canceled"],
  completed: [],
  canceled: [],
};

export function canTransitionStatus(from: TodoStatus, to: TodoStatus): boolean {
  if (from === to) return true;

  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionStatus(from: TodoStatus, to: TodoStatus): TodoStatus {
  if (canTransitionStatus(from, to)) {
    return to;
  }

  throw new Error(`Cannot transition from ${from} to ${to}`);
}

function applyStatus(todo: TodoItem, to: TodoStatus): TodoItem {
  const status = transitionStatus(todo.status, to);
  return {
    ...todo,
    status,
  };
}

const TOOL_NAME_TO_PHASE: Record<string, TodoPhase> = {
  design_app: "design",
  build_ui: "build",
  review_app: "review",
  cancelled: "cancelled",
};

export function phaseForToolName(toolName: string): TodoPhase | null {
  if (toolName in TOOL_NAME_TO_PHASE) {
    return TOOL_NAME_TO_PHASE[toolName];
  }
  return null;
}

export function updateTodoStatusForSubagent(
  todos: TodoItem[],
  toolName: string,
  stage: "start" | "complete" | "cancel",
): TodoItem[] {
  const pipelinePhase = phaseForToolName(toolName);
  if (!pipelinePhase) return todos;

  const currentPhaseIndex = PHASE_INDEX[pipelinePhase];
  let markedCurrent = false;

  return todos.map((todo) => {
    const todoIndex = PHASE_INDEX[todo.phase];
    if (todoIndex < currentPhaseIndex) {
      return applyStatus(todo, "completed");
    }

    if (todoIndex > currentPhaseIndex) {
      if (todo.status === "in_progress") {
        return applyStatus(todo, "pending");
      }
      return todo;
    }
    if (stage === "complete") {
      return applyStatus(todo, "completed");
    }
    if (!markedCurrent && todo.status !== "completed") {
      markedCurrent = true;
      return applyStatus(todo, "in_progress");
    }

    if (todo.status === "in_progress") {
      return applyStatus(todo, "pending");
    }
    return todo;
  });
}

export function isTodoStatus(value: unknown): value is TodoStatus {
  return (
    typeof value === "string" && (statuses as readonly string[]).includes(value)
  );
}

export function normalizeToDo(
  value: unknown,
  defaultPhase: TodoPhase = "build",
): TodoItem | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const { content, status, phase } = value as {
    content?: unknown;
    status?: unknown;
    phase?: unknown;
  };

  if (typeof content !== "string" || content.trim() === "") {
    return null;
  }

  return {
    content,
    status: isTodoStatus(status) ? status : "pending",
    phase: isTodoPhase(phase) ? phase : defaultPhase,
  };
}

export function parseTodos(value: unknown): TodoItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeToDo(item))
    .filter((item): item is TodoItem => Boolean(item));
}

export function formatPlanForAgent(todos: TodoItem[]): string {
  const planLines = todos.map(
    (todo, index) => `${index + 1}. [${todo.status}] ${todo.content}`,
  );

  const footer =
    "Follow this plan in order. Update it with write_todos as you complete steps.";

  return ["Current plan:", ...planLines, "", footer].join("\n");
}

export function parsePlanMessage(content: string): TodoItem[] | null {
  let parsed: Partial<PlanMessage>;

  try {
    parsed = JSON.parse(content) as Partial<PlanMessage>;
  } catch {
    return null;
  }

  if (parsed.kind !== PLAN_KIND) {
    return null;
  }

  const todos = parseTodos(parsed.todos);
  return todos.length > 0 ? todos : null;
}

// Re-export Jev integration for unified access
export * from "./jev";
