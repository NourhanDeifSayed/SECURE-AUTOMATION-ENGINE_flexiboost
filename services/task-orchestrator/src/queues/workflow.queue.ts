import { Queue } from "bullmq";

export type WorkflowJobData = {
  tenantId: string;
  workflowId: string;
  requestedBy: string;
};

export const workflowQueue = new Queue<WorkflowJobData>("workflow-execution", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});

export async function enqueueWorkflowExecution(data: WorkflowJobData) {
  return workflowQueue.add(
    "workflow.execute",
    data,
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    }
  );
}