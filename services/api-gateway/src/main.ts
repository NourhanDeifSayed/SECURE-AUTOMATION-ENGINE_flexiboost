import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.routes";
import { workflowsRouter } from "./routes/workflows.routes";
import { tenantMiddleware } from "./middleware/tenant.middleware";

const app = express();

const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  return res.json({
    status: "ok",
    service: "api-gateway",
  });
});

app.use("/auth", authRouter);
app.use("/workflows", tenantMiddleware, workflowsRouter);

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});