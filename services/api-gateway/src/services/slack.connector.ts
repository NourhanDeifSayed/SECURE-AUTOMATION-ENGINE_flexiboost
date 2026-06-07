import { PoolClient } from "pg";
import { decryptToken } from "./oauth.service";

export type SlackMessageInput = {
  connectionId: string;
  channel: string;
  text: string;
};

export async function sendSlackMessage(
  client: PoolClient,
  tenantId: string,
  input: SlackMessageInput
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
      AND provider = 'slack'
      AND tenant_id = $2
    `,
    [input.connectionId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new Error("Slack OAuth connection not found for this tenant");
  }

  const connection = result.rows[0];

  const accessToken = decryptToken(
    connection.access_token_encrypted,
    connection.token_iv
  );

  if (!accessToken) {
    throw new Error("Failed to decrypt Slack access token");
  }

  return {
    provider: "slack",
    connectionId: connection.id,
    channel: input.channel,
    text: input.text,
    simulated: true,
    status: "message_sent",
  };
}