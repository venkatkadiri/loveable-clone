import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
import { env } from "../config/env";
import {
  isTodoPhase,
  isTodoStatus,
  PLAN_KIND,
  type PlanMessage,
  type TodoItem,
  type TodoPhase,
} from "./plan";

export const PHASE_QUESTION_INSTRUCTIONS =
  "Classify this agent task or todo item into the most appropriate development lifecycle phase.";

export const PHASE_CHOICE_CRITERIA = {
  design:
    "System architecture, wireframing, UX/UI design, visual styling concepts, planning, specifications, and layout breakdown",
  build:
    "Implementation, coding, writing components, business logic, state management, features, and bug fixes",
  review:
    "Testing, verification, previewing, code review, quality checks, polishing, export, or summary",
} as const;

let typesafeClient: TypeSafeClient | null = null;

export function isJevConfigured(): boolean {
  const key = env.TYPESAFE_API_KEY || process.env.TYPESAFE_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

export function getTypeSafeClient(): TypeSafeClient {
  const apiKey = env.TYPESAFE_API_KEY || process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No TypeSafe API key configured. Set TYPESAFE_API_KEY in your environment or .env file.",
    );
  }

  if (!typesafeClient) {
    typesafeClient = new TypeSafeClient({ apiKey });
  }

  return typesafeClient;
}

export interface InferPhaseOptions {
  client?: TypeSafeClient;
  model?: string;
}

export async function inferToDoPhase(
  content: string,
  options?: InferPhaseOptions,
): Promise<Exclude<TodoPhase, "cancelled">> {
  const trimmed = content.trim();
  if (!trimmed) {
    return "build";
  }

  if (!options?.client && !isJevConfigured()) {
    console.warn(
      "[Jev] TYPESAFE_API_KEY is not configured. Defaulting phase to 'build'.",
    );
    return "build";
  }

  try {
    const client = options?.client ?? getTypeSafeClient();
    const response = await client.systemOne({
      state: { task: trimmed },
      model: options?.model,
      questions: {
        phase: choice(PHASE_QUESTION_INSTRUCTIONS, PHASE_CHOICE_CRITERIA),
      },
    });

    const chosen = response.answers.phase.choice;
    if (chosen === "design" || chosen === "build" || chosen === "review") {
      return chosen;
    }
  } catch (error) {
    console.error("[Jev] Failed to classify task phase:", error);
  }

  return "build";
}

export async function normalizeToDoWithJev(
  value: unknown,
  options?: InferPhaseOptions,
): Promise<TodoItem | null> {
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

  const resolvedPhase = isTodoPhase(phase)
    ? phase
    : await inferToDoPhase(content, options);

  return {
    content,
    status: isTodoStatus(status) ? status : "pending",
    phase: resolvedPhase,
  };
}

export async function parseTodosWithJev(
  value: unknown,
  options?: InferPhaseOptions,
): Promise<TodoItem[]> {
  if (!Array.isArray(value)) {
    return [];
  }

  const todos = await Promise.all(
    value.map((item) => normalizeToDoWithJev(item, options)),
  );
  return todos.filter((item): item is TodoItem => Boolean(item));
}

export async function parsePlanMessageWithJev(
  content: string,
  options?: InferPhaseOptions,
): Promise<TodoItem[] | null> {
  let parsed: Partial<PlanMessage>;

  try {
    parsed = JSON.parse(content) as Partial<PlanMessage>;
  } catch {
    return null;
  }

  if (parsed.kind !== PLAN_KIND) {
    return null;
  }

  const todos = await parseTodosWithJev(parsed.todos, options);
  return todos.length > 0 ? todos : null;
}
