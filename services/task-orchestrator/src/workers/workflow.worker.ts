import { Worker } from "bullmq";
import { Pool } from "pg";
import fs from "fs";

function readSecretFile(path?: string) {
  if (!path) return undefined;

  try {
    return fs.readFileSync(path, "utf8").trim();
  } catch {
    return undefined;
  }
}

const db = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 15432),
  database: process.env.DB_NAME || "sae",
  user: process.env.DB_USER || "app_user",
  password:
    readSecretFile(process.env.DB_PASSWORD_FILE) ||
    process.env.DB_PASSWORD ||
    "app_password",
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
          started_at,
          completed_at,
          ttl_delete_after
        )
        VALUES (
          $1,
          $2,
          'success',
          now(),
          now(),
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
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
    },
  }
);