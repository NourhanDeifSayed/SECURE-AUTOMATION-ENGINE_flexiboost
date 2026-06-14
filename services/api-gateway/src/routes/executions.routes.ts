import { Router } from "express";
import { withTenant } from "../db";
import { AuthenticatedRequest } from "../middleware/tenant.middleware";

export const executionsRouter = Router();

executionsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;

    const executions = await withTenant(tenantId, async (client) => {
      const result = await client.query(
        `
        SELECT
          id,
          tenant_id,
          workflow_id,
          status,
          started_at,
          completed_at,
          error_detail,
          ttl_delete_after
        FROM execution_logs
        ORDER BY started_at DESC
        `
      );

      return result.rows;
    });

    return res.json(executions);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch executions",
    });
  }
});

executionsRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;
    const executionId = req.params.id;

    const execution = await withTenant(tenantId, async (client) => {
      const result = await client.query(
        `
        SELECT
          id,
          tenant_id,
          workflow_id,
          status,
          started_at,
          completed_at,
          error_detail,
          ttl_delete_after
        FROM execution_logs
        WHERE id = $1
        `,
        [executionId]
      );

      return result.rows[0] ?? null;
    });

    if (!execution) {
      return res.status(404).json({
        error: "Execution not found",
      });
    }

    return res.json(execution);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch execution",
    });
  }
});