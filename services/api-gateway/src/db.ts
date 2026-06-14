import { Pool, PoolClient } from "pg";

export const pool = new Pool({
  host: "127.0.0.1",
  port: 15432,
  database: "sae",
  user: "app_user",
  password: "app_password",
  ssl: false,
  max: 1,
});


export async function withTenant<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "SELECT set_config('app.current_tenant_id', $1, true)",
      [tenantId]
    );

    const result = await callback(client);

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}