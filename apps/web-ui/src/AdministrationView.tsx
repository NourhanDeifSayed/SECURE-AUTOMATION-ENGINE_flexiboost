import { useEffect, useState } from "react";
import { apiRequest } from "./api";

type Tenant = {
  id: string;
  name: string;
  plan_tier: string;
  data_region: string;
  created_at: string;
};

type Member = {
  id: string;
  tenant_id: string;
  email_hash: string;
  role: "admin" | "editor" | "viewer";
  mfa_enabled: boolean;
  created_at: string;
  last_login_at?: string | null;
};

type TtlSettings = {
  credentialTtlDays: number;
  executionLogTtlDays: number;
  auditLogTtlDays: number;
};

export default function AdministrationView() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ttlSettings, setTtlSettings] = useState<TtlSettings>({
    credentialTtlDays: 90,
    executionLogTtlDays: 30,
    auditLogTtlDays: 365,
  });
  const [message, setMessage] = useState("");

  const loadAdminData = async () => {
    try {
      setMessage("Loading administration data...");

      const data = await apiRequest("/admin/tenant");

      setTenant(data.tenant);
      setMembers(data.members ?? []);
      setTtlSettings(data.ttlSettings);

      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load administration data"
      );
    }
  };

  const updateTtlSettings = async () => {
    try {
      setMessage("Saving TTL settings...");

      const data = await apiRequest("/admin/ttl-settings", {
        method: "PATCH",
        body: JSON.stringify(ttlSettings),
      });

      setTtlSettings(data.ttlSettings);
      setMessage("TTL settings updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to update TTL settings"
      );
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="admin-page">
      <section className="admin-card">
        <div className="section-header">
          <h2>Tenant Overview</h2>
          <button onClick={loadAdminData}>Refresh</button>
        </div>

        {!tenant ? (
          <p className="muted">No tenant data loaded.</p>
        ) : (
          <div className="details-panel">
            <label>
              Tenant ID
              <input value={tenant.id} disabled />
            </label>

            <label>
              Tenant Name
              <input value={tenant.name} disabled />
            </label>

            <label>
              Plan Tier
              <input value={tenant.plan_tier} disabled />
            </label>

            <label>
              Data Region
              <input value={tenant.data_region} disabled />
            </label>

            <label>
              Created At
              <input
                value={new Date(tenant.created_at).toLocaleString()}
                disabled
              />
            </label>
          </div>
        )}
      </section>

      <section className="admin-card">
        <h2>TTL Settings</h2>

        <div className="details-panel">
          <label>
            Credential TTL Days
            <input
              type="number"
              value={ttlSettings.credentialTtlDays}
              onChange={(event) =>
                setTtlSettings({
                  ...ttlSettings,
                  credentialTtlDays: Number(event.target.value),
                })
              }
            />
          </label>

          <label>
            Execution Log TTL Days
            <input
              type="number"
              value={ttlSettings.executionLogTtlDays}
              onChange={(event) =>
                setTtlSettings({
                  ...ttlSettings,
                  executionLogTtlDays: Number(event.target.value),
                })
              }
            />
          </label>

          <label>
            Audit Log TTL Days
            <input
              type="number"
              value={ttlSettings.auditLogTtlDays}
              onChange={(event) =>
                setTtlSettings({
                  ...ttlSettings,
                  auditLogTtlDays: Number(event.target.value),
                })
              }
            />
          </label>

          <button onClick={updateTtlSettings}>Save TTL Settings</button>
        </div>
      </section>

      <section className="admin-card admin-members">
        <h2>Team Members</h2>

        {members.length === 0 ? (
          <p className="muted">No team members found.</p>
        ) : (
          members.map((member) => (
            <div className="member-row" key={member.id}>
              <div>
                <strong>{member.role.toUpperCase()}</strong>
                <p>User ID: {member.id}</p>
                <p>Email Hash: {member.email_hash}</p>
                <p>MFA: {member.mfa_enabled ? "Enabled" : "Disabled"}</p>
                <p>
                  Created: {new Date(member.created_at).toLocaleString()}
                </p>
                <p>
                  Last Login:{" "}
                  {member.last_login_at
                    ? new Date(member.last_login_at).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          ))
        )}
      </section>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
}