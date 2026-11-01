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
    workflowsPath: require.resolve("./workflows"),
    activities: activities,
  });

  console.log(
    `Temporal worker listening on task queue "${env.TEMPORAL_TASK_QUEUE}" (${env.TEMPORAL_ADDRESS})`,
  );
  worker.run().catch((err) => {
    console.error("Temporal worker failed:", err);
    process.exit(1);
  });
}
