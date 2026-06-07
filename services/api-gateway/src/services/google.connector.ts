import { PoolClient } from "pg";
import { decryptToken } from "./oauth.service";

export type GoogleSheetsAppendInput = {
  connectionId: string;
  spreadsheetId: string;
  range: string;
  values: string[][];
};

export async function appendGoogleSheetRow(
  client: PoolClient,
  tenantId: string,
  input: GoogleSheetsAppendInput
) {
  const result = await client.query(
    `
    SELECT
      id,
      provider,
      access_token_encrypted,
      token_iv,
      scopes
    FROM oauth_connections
    WHERE id = $1
      AND provider = 'google'
      AND tenant_id = $2
    `,
    [input.connectionId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new Error("Google OAuth connection not found for this tenant");
  }

  const connection = result.rows[0];

  const accessToken = decryptToken(
    connection.access_token_encrypted,
    connection.token_iv
  );

  if (!accessToken) {
    throw new Error("Failed to decrypt Google access token");
  }

  return {
    provider: "google",
    service: "sheets",
    connectionId: connection.id,
    spreadsheetId: input.spreadsheetId,
    range: input.range,
    values: input.values,
    simulated: true,
    status: "row_appended",
  };
}