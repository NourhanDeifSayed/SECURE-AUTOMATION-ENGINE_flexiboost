import { Router } from "express";
import { withTenant } from "../db";
import { AuthenticatedRequest } from "../middleware/tenant.middleware";
import {
  encryptToken,
  decryptToken,
  simulateOAuthRefresh,
} from "../services/oauth.service";

export const oauthRouter = Router();

oauthRouter.post("/:provider/connect", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const provider = req.params.provider;

    const {
      external_account_id,
      access_token,
      refresh_token,
      expires_in,
      scopes,
    } = req.body;

    if (!access_token) {
      return res.status(400).json({
        error: "access_token is required",
      });
    }

    const encryptedAccessToken = encryptToken(access_token);
    const encryptedRefreshToken = refresh_token
      ? encryptToken(refresh_token)
      : null;

    const connection = await withTenant(tenantId, async (client) => {
      const result = await client.query(
        `
        INSERT INTO oauth_connections (
          tenant_id,
          provider,
          external_account_id,
          access_token_encrypted,
          refresh_token_encrypted,
          token_iv,
          refresh_token_iv,
          expires_at,
          scopes,
          created_by
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          CASE
            WHEN $8::int IS NULL THEN NULL
            ELSE now() + ($8::int * interval '1 second')
          END,
          $9,
          $10
        )
        RETURNING
          id,
          tenant_id,
          provider,
          external_account_id,
          expires_at,
          scopes,
          created_at,
          updated_at
        `,
        [
          tenantId,
          provider,
          external_account_id ?? null,
          encryptedAccessToken.encrypted,
          encryptedRefreshToken?.encrypted ?? null,
          encryptedAccessToken.iv,
          encryptedRefreshToken?.iv ?? null,
          expires_in ?? null,
          scopes ?? [],
          userId,
        ]
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
          userId,
          "oauth.connected",
          "oauth_connection",
          result.rows[0].id,
        ]
      );

      return result.rows[0];
    });

    return res.status(201).json(connection);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create OAuth connection",
    });
  }
});

oauthRouter.get("/:provider/connections", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;
    const provider = req.params.provider;

    const connections = await withTenant(tenantId, async (client) => {
      const result = await client.query(
        `
        SELECT
          id,
          tenant_id,
          provider,
          external_account_id,
          expires_at,
          scopes,
          created_at,
          updated_at
        FROM oauth_connections
        WHERE provider = $1
        ORDER BY created_at DESC
        `,
        [provider]
      );

      return result.rows;
    });

    return res.json(connections);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to list OAuth connections",
    });
  }
});

oauthRouter.post("/:connectionId/refresh", async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const connectionId = req.params.connectionId;

    const refreshedConnection = await withTenant(tenantId, async (client) => {
      const existingResult = await client.query(
        `
        SELECT
          id,
          provider,
          refresh_token_encrypted,
          refresh_token_iv
        FROM oauth_connections
        WHERE id = $1
        `,
        [connectionId]
      );

      if (existingResult.rows.length === 0) {
        throw new Error("OAuth connection not found for this tenant");
      }

      const existing = existingResult.rows[0];

      if (!existing.refresh_token_encrypted || !existing.refresh_token_iv) {
        throw new Error(
          "OAuth connection does not have a refresh token or refresh token IV"
        );
      }

      const oldRefreshToken = decryptToken(
        existing.refresh_token_encrypted,
        existing.refresh_token_iv
      );

      const newTokens = simulateOAuthRefresh(
        existing.provider,
        oldRefreshToken
      );

      const encryptedAccessToken = encryptToken(newTokens.access_token);
      const encryptedRefreshToken = encryptToken(newTokens.refresh_token);

      const updateResult = await client.query(
        `
        UPDATE oauth_connections
        SET
          access_token_encrypted = $1,
          refresh_token_encrypted = $2,
          token_iv = $3,
          refresh_token_iv = $4,
          expires_at = now() + ($5::int * interval '1 second'),
          updated_at = now()
        WHERE id = $6
        RETURNING
          id,
          tenant_id,
          provider,
          external_account_id,
          expires_at,
          scopes,
          created_at,
          updated_at
        `,
        [
          encryptedAccessToken.encrypted,
          encryptedRefreshToken.encrypted,
          encryptedAccessToken.iv,
          encryptedRefreshToken.iv,
          newTokens.expires_in,
          connectionId,
        ]
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
          userId,
          "oauth.token_refreshed",
          "oauth_connection",
          connectionId,
        ]
      );

      return updateResult.rows[0];
    });

    return res.json({
      message: "OAuth token refreshed",
      connection: refreshedConnection,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to refresh OAuth token",
    });
  }
});