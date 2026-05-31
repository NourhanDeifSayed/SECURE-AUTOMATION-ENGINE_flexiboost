import { Router } from "express";
import { withTenant } from "../db";
import { AuthenticatedRequest } from "../middleware/tenant.middleware";
import { enqueueWorkflowExecution } from "../../../task-orchestrator/src/queues/workflow.queue";

export const workflowsRouter = Router();

workflowsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;

    const workflows = await withTenant(tenantId, async (client) => {
      const result = await client.query(
        "SELECT * FROM workflows ORDER BY created_at DESC"
      );

      return result.rows;
    });

    return res.json(workflows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch workflows",
    });
  }
});

workflowsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;

    const { name, definition_json } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "name is required",
      });
    }

    const workflow = await withTenant(tenantId, async (client) => {
      const result = await client.query(
        `
        INSERT INTO workflows (
          tenant_id,
          name,
          definition_json,
          status,
          created_by
        )
        VALUES ($1, $2, $3, 'draft', $4)
        RETURNING *
        `,
        [tenantId, name, definition_json ?? {}, userId]
      );

      const createdWorkflow = result.rows[0];

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
          userId,
          "workflow.created",
          "workflow",
          createdWorkflow.id,
        ]
      );

      return createdWorkflow;
    });

    return res.status(201).json(workflow);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to create workflow",
    });
  }
});

workflowsRouter.post("/:workflowId/run", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const workflowId = req.params.workflowId;

    const job = await enqueueWorkflowExecution({
      tenantId,
      workflowId,
      requestedBy: userId,
    });

    return res.status(202).json({
      message: "Workflow execution queued",
      jobId: job.id,
      tenantId,
      workflowId,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to queue workflow execution",
    });
  }
});