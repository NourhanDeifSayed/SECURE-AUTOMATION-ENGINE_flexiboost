import "dotenv/config";
import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.routes";
import { workflowsRouter } from "./routes/workflows.routes";
import { webhookRouter } from "./routes/webhook.routes";
import { tenantMiddleware } from "./middleware/tenant.middleware";
import { vaultRouter } from "../../credential-vault/src/vault.routes";
import { connectorsRouter } from "./routes/connectors.routes";
import { oauthRouter } from "./routes/oauth.routes";
import { executionsRouter } from "./routes/executions.routes";
import { adminRouter } from "./routes/admin.routes";
import {
  metricsHandler,
  metricsMiddleware,
} from "./services/metrics.service";

const app = express();

const PORT = Number(process.env.PORT || 3000);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(metricsMiddleware);

app.get("/health", (_req, res) => {
  return res.json({
    status: "ok",
    service: "api-gateway",
  });
});

app.get("/metrics", metricsHandler);

app.use("/auth", authRouter);

app.use("/workflows", tenantMiddleware, workflowsRouter);

app.use("/vault", tenantMiddleware, vaultRouter);

app.use("/executions", tenantMiddleware, executionsRouter);

app.use("/admin", tenantMiddleware, adminRouter);

app.use("/webhooks", webhookRouter);

app.use("/connectors", tenantMiddleware, connectorsRouter);

app.use("/oauth", tenantMiddleware, oauthRouter);

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log(
    `CORS enabled for origin: ${
      process.env.CORS_ORIGIN || "http://localhost:5173"
    }`
  );
});