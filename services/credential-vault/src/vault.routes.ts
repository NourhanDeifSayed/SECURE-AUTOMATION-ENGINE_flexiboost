import { Router, Request, Response } from "express";
import { encryptCredential, decryptCredential } from "./vault.service";
import { Pool } from "pg";

const db = new Pool({
  host: "127.0.0.1",
  port: 55432,
  database: "sae",
  user: "app_user",
  password: "app_password",
  ssl: false,
});

export const vaultRouter = Router();

vaultRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { service_name, secret, tenant_id } = req.body;

    if (!service_name || !secret || !tenant_id) {
      return res.status(400).json({
        error: "service_name, secret and tenant_id are required",
      });
    }

    const { encrypted_payload, iv } = encryptCredential(secret);

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenant_id]
      );

      const result = await client.query(
        `INSERT INTO credential_vault
          (tenant_id, service_name, encrypted_payload, iv, kms_key_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, tenant_id, service_name, created_at`,
        [tenant_id, service_name, encrypted_payload, iv, "local-dev-key"]
      );

      await client.query("COMMIT");

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save credential" });
  }
});

vaultRouter.get("/", async (req: Request, res: Response) => {
  try {
    const tenant_id = req.query.tenant_id as string;

    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenant_id]
      );

      const result = await client.query(
        `SELECT id, tenant_id, service_name, created_at, rotated_at
         FROM credential_vault
         ORDER BY created_at DESC`
      );

      await client.query("COMMIT");

      return res.json(result.rows);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch credentials" });
  }
});

vaultRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const tenant_id = req.query.tenant_id as string;
    const credentialId = req.params.id;

    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenant_id]
      );

      const result = await client.query(
        `SELECT id, tenant_id, service_name, encrypted_payload, iv, created_at, rotated_at
         FROM credential_vault
         WHERE id = $1`,
        [credentialId]
      );

      if (result.rows.length === 0) {
        await client.query("COMMIT");
        return res.status(404).json({ error: "Credential not found" });
      }

      const credential = result.rows[0];

      const secret = decryptCredential(
        credential.encrypted_payload,
        credential.iv
      );

      await client.query("COMMIT");

      return res.json({
        id: credential.id,
        tenant_id: credential.tenant_id,
        service_name: credential.service_name,
        secret,
        created_at: credential.created_at,
        rotated_at: credential.rotated_at,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to decrypt credential" });
  }
});

vaultRouter.post("/:id/rotate", async (req: Request, res: Response) => {
  try {
    const { tenant_id, new_secret, user_id } = req.body;
    const credentialId = req.params.id;

    if (!tenant_id || !new_secret) {
      return res.status(400).json({
        error: "tenant_id and new_secret are required",
      });
    }

    const { encrypted_payload, iv } = encryptCredential(new_secret);

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenant_id]
      );

      const result = await client.query(
        `UPDATE credential_vault
         SET encrypted_payload = $1,
             iv = $2,
             rotated_at = NOW()
         WHERE id = $3
         RETURNING id, tenant_id, service_name, rotated_at`,
        [encrypted_payload, iv, credentialId]
      );

      if (result.rows.length === 0) {
        await client.query("COMMIT");
        return res.status(404).json({
          error: "Credential not found",
        });
      }

      await client.query(
        `INSERT INTO credential_rotation_audit
          (credential_id, tenant_id, rotated_by)
         VALUES ($1, $2, $3)`,
        [credentialId, tenant_id, user_id || null]
      );

      await client.query("COMMIT");

      return res.json({
        message: "Credential rotated successfully",
        credential: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to rotate credential",
    });
  }
});

vaultRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.body;
    const credentialId = req.params.id;

    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenant_id]
      );

      await client.query(
        `DELETE FROM credential_vault WHERE id = $1`,
        [credentialId]
      );

      await client.query("COMMIT");

      return res.json({ message: "Credential deleted successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete credential" });
  }
});