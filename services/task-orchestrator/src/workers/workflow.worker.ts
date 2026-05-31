import { Worker } from "bullmq";
import { Pool } from "pg";

const db = new Pool({
  host: "127.0.0.1",
  port: 55432,
  database: "sae",
  user: "app_user",
  password: "app_password",
  ssl: false,
  max: 1,
});

export const workflowWorker = new Worker(
  "workflow-execution",
  async (job) => {
    const { tenantId, workflowId, requestedBy } = job.data;

    console.log("Worker received job:", job.data);

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenantId]
      );

      const workflowResult = await client.query(
        `
        SELECT id, tenant_id, name, status
        FROM workflows
        WHERE id = $1
        `,
        [workflowId]
      );

      if (workflowResult.rows.length === 0) {
        throw new Error("Workflow not found for this tenant");
      }

      await client.query(
        `
        INSERT INTO execution_logs (
          tenant_id,
          workflow_id,
          status,
          ttl_delete_after
        )
        VALUES (
          $1,
          $2,
          'success',
          now() + interval '30 days'
        )
        `,
        [tenantId, workflowId]
      );

      await client.query(
        `
        INSERT INTO audit_log (
          tenant_id,
          actor_user_id,
          action,
          resource_type,
          resource_id
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          tenantId,
          requestedBy,
          "workflow.executed",
          "workflow",
          workflowId,
        ]
      );

      await client.query("COMMIT");

      console.log("Workflow executed successfully:", {
        tenantId,
        workflowId,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Workflow execution failed:", error);
      throw error;
    } finally {
      client.release();
    }
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  }
);