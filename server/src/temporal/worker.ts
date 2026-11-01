import path from "node:path";
import { NativeConnection, Worker } from "@temporalio/worker";
import { env } from "../config/env";
import { retryWithExponentialBackoff } from "../utils/retry";
import * as activities from "./activities";

export async function Connect(): Promise<NativeConnection> {
  return retryWithExponentialBackoff(
    () =>
      NativeConnection.connect({
        address: env.TEMPORAL_ADDRESS,
      }),
    { label: "Temporal worker connect" },
  );
}

export async function main(): Promise<void> {
  const connection = await Connect();

  const worker = await Worker.create({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
    workflowsPath: path.resolve(process.cwd(), "src/temporal/workflows.ts"),
    activities: activities,
  });

  console.log(
    `Temporal worker listening on task queue "${env.TEMPORAL_TASK_QUEUE}" (${env.TEMPORAL_ADDRESS})`,
  );
  await worker.run();
}

if (process.argv[1] && process.argv[1].endsWith("src/temporal/worker.ts")) {
  main().catch((err) => {
    console.error("Temporal worker failed:", err);
    process.exit(1);
  });
}
