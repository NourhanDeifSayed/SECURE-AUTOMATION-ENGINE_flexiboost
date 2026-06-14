import client from "prom-client";
import { Request, Response, NextFunction } from "express";

client.collectDefaultMetrics();

export const httpRequestCounter = new client.Counter({
  name: "flexiboost_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const authFailureCounter = new client.Counter({
  name: "flexiboost_auth_failures_total",
  help: "Total number of authentication failures",
});

export const workflowExecutionCounter = new client.Counter({
  name: "flexiboost_workflow_executions_total",
  help: "Total number of workflow execution requests",
  labelNames: ["status"],
});

export const requestDurationHistogram = new client.Histogram({
  name: "flexiboost_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const end = requestDurationHistogram.startTimer();

  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });

    end({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      authFailureCounter.inc();
    }
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response) {
  res.set("Content-Type", client.register.contentType);
  return res.end(await client.register.metrics());
}