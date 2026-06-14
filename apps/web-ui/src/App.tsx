import { useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  NodeMouseHandler,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./styles.css";

import { apiRequest, clearToken, getToken, login } from "./api";
import CredentialsView from "./CredentialsView";
import ExecutionsView from "./ExecutionsView";
import AdministrationView from "./AdministrationView";

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 100, y: 120 },
    data: {
      label: "Manual Trigger",
      nodeType: "trigger",
    },
  },
];

const initialEdges: Edge[] = [];

type Role = "admin" | "editor" | "viewer";
type ActiveTab = "builder" | "credentials" | "executions" | "administration";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getToken()));
  const [activeTab, setActiveTab] = useState<ActiveTab>("builder");

  const [loginForm, setLoginForm] = useState({
    userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    tenantId: "11111111-1111-1111-1111-111111111111",
    role: "admin" as Role,
  });

  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [statusMessage, setStatusMessage] = useState("");

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleLogin = async () => {
    try {
      setStatusMessage("Signing in...");
      await login(loginForm);
      setIsAuthenticated(true);
      setStatusMessage("Signed in successfully.");
    } catch (error) {
      console.error(error);
      setStatusMessage(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
    setSelectedNode(null);
    setActiveTab("builder");
    setStatusMessage("Signed out.");
  };

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedNode(node);
  };

  const onConnect = (connection: Connection) => {
    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          animated: true,
        },
        currentEdges
      )
    );
  };

  const updateSelectedNodeData = (key: string, value: unknown) => {
    if (!selectedNode) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                [key]: value,
              },
            }
          : node
      )
    );

    setSelectedNode((currentNode) =>
      currentNode
        ? {
            ...currentNode,
            data: {
              ...currentNode.data,
              [key]: value,
            },
          }
        : null
    );
  };

  const addNode = (nodeType: string, label: string) => {
    const id = crypto.randomUUID();

    const defaultConfigByType: Record<string, Record<string, unknown>> = {
      slack: {
        channel: "#general",
        message: "Hello from FlexiBoost",
      },
      stripe: {
        customerEmail: "customer@example.com",
        customerName: "Test Customer",
      },
      google: {
        spreadsheetId: "sheet_test_123",
        range: "Sheet1!A1:C1",
        values: "Name,Email,Status",
      },
      http: {
        method: "GET",
        url: "http://localhost:3000/health",
      },
      trigger: {},
    };

    const newNode: Node = {
      id,
      position: {
        x: 150 + nodes.length * 50,
        y: 150 + nodes.length * 40,
      },
      data: {
        label,
        nodeType,
        ...(defaultConfigByType[nodeType] ?? {}),
      },
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
  };

  const saveWorkflow = async () => {
    try {
      setStatusMessage("Saving workflow...");

      const response = await apiRequest("/workflows", {
        method: "POST",
        body: JSON.stringify({
          name: workflowName,
          definition_json: {
            trigger: "manual",
            nodes,
            edges,
          },
        }),
      });

      setStatusMessage(`Workflow saved successfully: ${response.id}`);
    } catch (error) {
      console.error(error);
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save workflow"
      );
    }
  };

  const renderNodeSpecificFields = () => {
    if (!selectedNode) return null;

    const nodeType = String(selectedNode.data.nodeType ?? "");

    if (nodeType === "trigger") {
      return (
        <p className="muted">Manual trigger does not require configuration.</p>
      );
    }

    if (nodeType === "slack") {
      return (
        <>
          <label>
            Slack Channel
            <input
              value={String(selectedNode.data.channel ?? "")}
              onChange={(event) =>
                updateSelectedNodeData("channel", event.target.value)
              }
            />
          </label>

          <label>
            Message Text
            <textarea
              value={String(selectedNode.data.message ?? "")}
              onChange={(event) =>
                updateSelectedNodeData("message", event.target.value)
              }
            />
          </label>
        </>
      );
    }

    if (nodeType === "stripe") {
      return (
        <>
          <label>
            Customer Email
            <input
              value={String(selectedNode.data.customerEmail ?? "")}
              onChange={(event) =>
                updateSelectedNodeData("customerEmail", event.target.value)
              }
            />
          </label>

          <label>
            Customer Name
            <input
              value={String(selectedNode.data.customerName ?? "")}
              onChange={(event) =>
                updateSelectedNodeData("customerName", event.target.value)
              }
            />
          </label>
        </>
      );
    }

    if (nodeType === "google") {
      return (
        <>
          <label>
            Spreadsheet ID
            <input
              value={String(selectedNode.data.spreadsheetId ?? "")}
              onChange={(event) =>
                updateSelectedNodeData("spreadsheetId", event.target.value)
              }
            />
          </label>

          <label>
            Range
            <input
              value={String(selectedNode.data.range ?? "")}
              onChange={(event) =>
                updateSelectedNodeData("range", event.target.value)
              }
            />
          </label>

          <label>
            Values
            <textarea
              value={String(selectedNode.data.values ?? "")}
              onChange={(event) =>
                updateSelectedNodeData("values", event.target.value)
              }
            />
          </label>
        </>
      );
    }

    if (nodeType === "http") {
      return (
        <>
          <label>
            Method
            <select
              value={String(selectedNode.data.method ?? "GET")}
              onChange={(event) =>
                updateSelectedNodeData("method", event.target.value)
              }
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </label>

          <label>
            URL
            <input
              value={String(selectedNode.data.url ?? "")}
              onChange={(event) =>
                updateSelectedNodeData("url", event.target.value)
              }
            />
          </label>
        </>
      );
    }

    return (
      <p className="muted">No configuration available for this node type.</p>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>FlexiBoost</h1>
          <p>Sign in to manage secure automation workflows.</p>

          <label>
            User ID
            <input
              value={loginForm.userId}
              onChange={(event) =>
                setLoginForm({
                  ...loginForm,
                  userId: event.target.value,
                })
              }
            />
          </label>

          <label>
            Tenant ID
            <input
              value={loginForm.tenantId}
              onChange={(event) =>
                setLoginForm({
                  ...loginForm,
                  tenantId: event.target.value,
                })
              }
            />
          </label>

          <label>
            Role
            <select
              value={loginForm.role}
              onChange={(event) =>
                setLoginForm({
                  ...loginForm,
                  role: event.target.value as Role,
                })
              }
            >
              <option value="admin">admin</option>
              <option value="editor">editor</option>
              <option value="viewer">viewer</option>
            </select>
          </label>

          <button onClick={handleLogin}>Sign In</button>

          {statusMessage && <p className="status-message">{statusMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-page">
      <header className="topbar">
        <div>
          <h1>FlexiBoost</h1>
          <p>Secure Automation Engine</p>
        </div>

        <div className="topbar-actions">
          <button
            className={activeTab === "builder" ? "" : "secondary"}
            onClick={() => setActiveTab("builder")}
          >
            Builder
          </button>

          <button
            className={activeTab === "credentials" ? "" : "secondary"}
            onClick={() => setActiveTab("credentials")}
          >
            Credentials
          </button>

          <button
            className={activeTab === "executions" ? "" : "secondary"}
            onClick={() => setActiveTab("executions")}
          >
            Executions
          </button>

          <button
            className={activeTab === "administration" ? "" : "secondary"}
            onClick={() => setActiveTab("administration")}
          >
            Administration
          </button>

          {activeTab === "builder" && (
            <>
              <input
                value={workflowName}
                onChange={(event) => setWorkflowName(event.target.value)}
                placeholder="Workflow name"
              />

              <button onClick={saveWorkflow}>Save Workflow</button>
            </>
          )}

          <button className="secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {activeTab === "credentials" && (
        <CredentialsView
          tenantId={loginForm.tenantId}
          userId={loginForm.userId}
        />
      )}

      {activeTab === "executions" && <ExecutionsView />}

      {activeTab === "administration" && <AdministrationView />}

      {activeTab === "builder" && (
        <main className="builder-layout">
          <aside className="palette-panel">
            <h2>Node Palette</h2>

            <button onClick={() => addNode("slack", "Slack Message")}>
              + Slack
            </button>

            <button onClick={() => addNode("stripe", "Stripe Customer")}>
              + Stripe
            </button>

            <button onClick={() => addNode("google", "Google Sheets")}>
              + Google Sheets
            </button>

            <button onClick={() => addNode("http", "HTTP Request")}>
              + HTTP
            </button>

            {statusMessage && <p className="status-message">{statusMessage}</p>}
          </aside>

          <section className="canvas-area">
            <ReactFlow
              style={{ width: "100%", height: "100%" }}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </section>

          <aside className="side-panel">
            <h2>Node Configuration</h2>

            {!selectedNode ? (
              <p className="muted">Select a node to configure it.</p>
            ) : (
              <div className="form">
                <label>
                  Node ID
                  <input value={selectedNode.id} disabled />
                </label>

                <label>
                  Node Type
                  <input
                    value={String(selectedNode.data.nodeType ?? "")}
                    disabled
                  />
                </label>

                <label>
                  Label
                  <input
                    value={String(selectedNode.data.label ?? "")}
                    onChange={(event) =>
                      updateSelectedNodeData("label", event.target.value)
                    }
                  />
                </label>

                {renderNodeSpecificFields()}

                <button onClick={() => setSelectedNode(null)}>
                  Close Panel
                </button>
              </div>
            )}
          </aside>
        </main>
      )}
    </div>
  );
}