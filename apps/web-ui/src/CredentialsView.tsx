import { useEffect, useState } from "react";
import { apiRequest } from "./api";

type Credential = {
  id: string;
  tenant_id: string;
  service_name: string;
  created_at: string;
  rotated_at?: string | null;
};

type CredentialsViewProps = {
  tenantId: string;
  userId: string;
};

export default function CredentialsView({
  tenantId,
  userId,
}: CredentialsViewProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [serviceName, setServiceName] = useState("");
  const [secret, setSecret] = useState("");
  const [rotateSecret, setRotateSecret] = useState("");
  const [selectedCredentialId, setSelectedCredentialId] = useState("");
  const [message, setMessage] = useState("");

  const loadCredentials = async () => {
    try {
      setMessage("Loading credentials...");

      const data = await apiRequest(`/vault?tenant_id=${tenantId}`);

      setCredentials(data);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to load credentials"
      );
    }
  };

  const addCredential = async () => {
    try {
      if (!serviceName || !secret) {
        setMessage("Service name and secret are required.");
        return;
      }

      setMessage("Saving credential...");

      await apiRequest("/vault", {
        method: "POST",
        body: JSON.stringify({
          tenant_id: tenantId,
          service_name: serviceName,
          secret,
        }),
      });

      setServiceName("");
      setSecret("");
      setMessage("Credential saved successfully. Secret was not displayed.");

      await loadCredentials();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to save credential"
      );
    }
  };

  const deleteCredential = async (credentialId: string) => {
    try {
      setMessage("Deleting credential...");

      await apiRequest(`/vault/${credentialId}`, {
        method: "DELETE",
        body: JSON.stringify({
          tenant_id: tenantId,
        }),
      });

      setMessage("Credential deleted successfully.");
      await loadCredentials();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to delete credential"
      );
    }
  };

  const testCredential = async (credentialId: string) => {
    try {
      setMessage("Testing credential...");

      const result = await apiRequest(`/vault/${credentialId}/test`, {
        method: "POST",
        body: JSON.stringify({
          tenant_id: tenantId,
        }),
      });

      setMessage(result.message);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Credential test failed"
      );
    }
  };

  const rotateCredential = async () => {
    try {
      if (!selectedCredentialId || !rotateSecret) {
        setMessage("Select a credential and enter a new secret.");
        return;
      }

      setMessage("Rotating credential...");

      await apiRequest(`/vault/${selectedCredentialId}/rotate`, {
        method: "POST",
        body: JSON.stringify({
          tenant_id: tenantId,
          user_id: userId,
          new_secret: rotateSecret,
        }),
      });

      setRotateSecret("");
      setSelectedCredentialId("");
      setMessage("Credential rotated successfully. Secret was not displayed.");

      await loadCredentials();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to rotate credential"
      );
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  return (
    <div className="credentials-page">
      <section className="credentials-card">
        <h2>Add Credential</h2>

        <label>
          Service Name
          <input
            value={serviceName}
            onChange={(event) => setServiceName(event.target.value)}
            placeholder="slack-token"
          />
        </label>

        <label>
          Secret
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Enter secret"
          />
        </label>

        <button onClick={addCredential}>Save Credential</button>
      </section>

      <section className="credentials-card">
        <h2>Rotate Credential</h2>

        <label>
          Credential
          <select
            value={selectedCredentialId}
            onChange={(event) => setSelectedCredentialId(event.target.value)}
          >
            <option value="">Select credential</option>
            {credentials.map((credential) => (
              <option key={credential.id} value={credential.id}>
                {credential.service_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          New Secret
          <input
            type="password"
            value={rotateSecret}
            onChange={(event) => setRotateSecret(event.target.value)}
            placeholder="Enter new secret"
          />
        </label>

        <button onClick={rotateCredential}>Rotate Credential</button>
      </section>

      <section className="credentials-card credentials-list">
        <div className="section-header">
          <h2>Stored Credentials</h2>
          <button onClick={loadCredentials}>Refresh</button>
        </div>

        {credentials.length === 0 ? (
          <p className="muted">No credentials found.</p>
        ) : (
          credentials.map((credential) => (
            <div className="credential-row" key={credential.id}>
              <div>
                <strong>{credential.service_name}</strong>
                <p>ID: {credential.id}</p>
                <p>Created: {new Date(credential.created_at).toLocaleString()}</p>
                <p>
                  Rotated:{" "}
                  {credential.rotated_at
                    ? new Date(credential.rotated_at).toLocaleString()
                    : "Never"}
                </p>
                <p className="muted">Secret: hidden</p>
              </div>

              <div className="credential-actions">
                <button onClick={() => testCredential(credential.id)}>
                  Test
                </button>
                <button
                  className="danger"
                  onClick={() => deleteCredential(credential.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {message && <p className="status-message">{message}</p>}
    </div>
  );
}