import { PoolClient } from "pg";
import { decryptToken } from "./oauth.service";

export type StripeCustomerInput = {
  connectionId: string;
  email: string;
  name?: string;
};

export async function createStripeCustomer(
  client: PoolClient,
  tenantId: string,
  input: StripeCustomerInput
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
      AND provider = 'stripe'
      AND tenant_id = $2
    `,
    [input.connectionId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new Error("Stripe OAuth connection not found for this tenant");
  }

  const connection = result.rows[0];

  const accessToken = decryptToken(
    connection.access_token_encrypted,
    connection.token_iv
  );

  if (!accessToken) {
    throw new Error("Failed to decrypt Stripe access token");
  }

  return {
    provider: "stripe",
    connectionId: connection.id,
    simulated: true,
    status: "customer_created",
    customer: {
      id: `cus_simulated_${Date.now()}`,
      email: input.email,
      name: input.name ?? null,
    },
  };
}