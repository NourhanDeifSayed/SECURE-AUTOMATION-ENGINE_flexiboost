import { Router } from "express";
import { withTenant } from "../db";
import { AuthenticatedRequest } from "../middleware/tenant.middleware";

export const adminRouter = Router();

adminRouter.get("/tenant", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;

    const data = await withTenant(tenantId, async (client) => {
      const tenantResult = await client.query(
        `
        SELECT id, name, plan_tier, data_region, created_at
        FROM tenants
        WHERE id = $1
        `,
        [tenantId]
      );

      const usersResult = await client.query(
        `
        SELECT id, tenant_id, email_hash, role, mfa_enabled, created_at, last_login_at
        FROM users
        ORDER BY created_at DESC
        `
      );

      const settingsResult = await client.query(
        `
        INSERT INTO tenant_settings (tenant_id)
        VALUES ($1)
        ON CONFLICT (tenant_id) DO NOTHING
        RETURNING tenant_id
        `,
        [tenantId]
      );

      const ttlResult = await client.query(
        `
        SELECT
          credential_ttl_days,
          execution_log_ttl_days,
          audit_log_ttl_days
        FROM tenant_settings
        WHERE tenant_id = $1
        `,
        [tenantId]
      );

      const ttl = ttlResult.rows[0];

      return {
        tenant: tenantResult.rows[0],
        members: usersResult.rows,
        ttlSettings: {
          credentialTtlDays: ttl.credential_ttl_days,
          executionLogTtlDays: ttl.execution_log_ttl_days,
          auditLogTtlDays: ttl.audit_log_ttl_days,
        },
      };
    });

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch tenant administration data",
    });
  }
});

adminRouter.patch("/ttl-settings", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;

    const { credentialTtlDays, executionLogTtlDays, auditLogTtlDays } =
      req.body;

    if (
      credentialTtlDays === undefined ||
      executionLogTtlDays === undefined ||
      auditLogTtlDays === undefined
    ) {
      return res.status(400).json({
        error:
          "credentialTtlDays, executionLogTtlDays and auditLogTtlDays are required",
      });
    }

    const ttlSettings = await withTenant(tenantId, async (client) => {
      const result = await client.query(
        `
        INSERT INTO tenant_settings (
          tenant_id,
          credential_ttl_days,
          execution_log_ttl_days,
          audit_log_ttl_days,
          updated_at
        )
        VALUES ($1, $2, $3, $4, now())
        ON CONFLICT (tenant_id)
        DO UPDATE SET
          credential_ttl_days = EXCLUDED.credential_ttl_days,
          execution_log_ttl_days = EXCLUDED.execution_log_ttl_days,
          audit_log_ttl_days = EXCLUDED.audit_log_ttl_days,
          updated_at = now()
        RETURNING
          credential_ttl_days,
          execution_log_ttl_days,
          audit_log_ttl_days
        `,
        [tenantId, credentialTtlDays, executionLogTtlDays, auditLogTtlDays]
      );

      const row = result.rows[0];

      return {
        credentialTtlDays: row.credential_ttl_days,
        executionLogTtlDays: row.execution_log_ttl_days,
        auditLogTtlDays: row.audit_log_ttl_days,
      };
    });

    return res.json({
      message: "TTL settings updated",
      ttlSettings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to update TTL settings",
    });
  }
});