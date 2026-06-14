import { useEffect, useState } from "react";
import { apiRequest } from "./api";

type ExecutionLog = {
  id: string;
  tenant_id: string;
  workflow_id: string;
  status: "queued" | "running" | "success" | "failed";
  started_at: string;
  completed_at?: string | null;
  error_detail?: string | null;
  ttl_delete_after?: string | null;
};

export default function ExecutionsView() {
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [selectedExecution, setSelectedExecution] =
    useState<ExecutionLog | null>(null);
  const [message, setMessage] = useState("");

  const loadExecutions = async () => {
    try {
      setMessage("Loading executions...");

      const data = await apiRequest("/executions");

      setExecutions(data);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to load executions"
      );
    }
  };

  const loadExecutionDetails = async (executionId: string) => {
    try {
      setMessage("Loading execution details...");

      const data = await apiRequest(`/executions/${executionId}`);

      setSelectedExecution(data);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to load execution"
      );
    }
  };

  useEffect(() => {
    loadExecutions();
  }, []);

  return (
    <div className="executions-page">
      <section className="executions-card">
        <div className="section-header">
          <h2>Execution History</h2>
          <button onClick={loadExecutions}>Refresh</button>
        </div>

        {message && <p className="status-message">{message}</p>}

        {executions.length === 0 ? (
          <p className="muted">No executions found.</p>
        ) : (
          <div className="execution-list">
            {executions.map((execution) => (
              <div className="execution-row" key={execution.id}>
                <div>
                  <strong>{execution.status.toUpperCase()}</strong>
                  <p>Execution ID: {execution.id}</p>
                  <p>Workflow ID: {execution.workflow_id}</p>
                  <p>
                    Started:{" "}
                    {new Date(execution.started_at).toLocaleString()}
                  </p>
                  <p>
                    Completed:{" "}
                    {execution.completed_at
                      ? new Date(execution.completed_at).toLocaleString()
                      : "Not completed"}
                  </p>
                </div>

                <button onClick={() => loadExecutionDetails(execution.id)}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="executions-card">
        <h2>Execution Details</h2>

        {!selectedExecution ? (
          <p className="muted">Select an execution to view details.</p>
        ) : (
          <div className="details-panel">
            <label>
              Execution ID
              <input value={selectedExecution.id} disabled />
            </label>

            <label>
              Workflow ID
              <input value={selectedExecution.workflow_id} disabled />
            </label>

            <label>
              Status
              <input value={selectedExecution.status} disabled />
            </label>

            <label>
              Started At
              <input
                value={new Date(
                  selectedExecution.started_at
                ).toLocaleString()}
                disabled
              />
            </label>

            <label>
              Completed At
              <input
                value={
                  selectedExecution.completed_at
                    ? new Date(
                        selectedExecution.completed_at
                      ).toLocaleString()
                    : "Not completed"
                }
                disabled
              />
            </label>

            <label>
              Error Detail
              <textarea
                value={selectedExecution.error_detail ?? "No error"}
                disabled
              />
            </label>

            <label>
              TTL Delete After
              <input
                value={
                  selectedExecution.ttl_delete_after
                    ? new Date(
                        selectedExecution.ttl_delete_after
                      ).toLocaleString()
                    : "Not set"
                }
                disabled
              />
            </label>
          </div>
        )}
      </section>
    </div>
  );
}