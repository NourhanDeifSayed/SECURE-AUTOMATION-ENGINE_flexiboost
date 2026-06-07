import { Router, Request, Response } from "express";
import { withTenant } from "../db";
import { AuthenticatedRequest } from "../middleware/tenant.middleware";
import { sendSlackMessage } from "../services/slack.connector";
import { createStripeCustomer } from "../services/stripe.connector";
import { appendGoogleSheetRow } from "../services/google.connector";

export const connectorsRouter = Router();

const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE"];

/*
 * Existing HTTP Connector
 */
connectorsRouter.post("/http/test", async (req: Request, res: Response) => {
  try {
    const { method, url, headers, body } = req.body;

    if (!method || !url) {
      return res.status(400).json({
        error: "method and url are required",
      });
    }

    const normalizedMethod = String(method).toUpperCase();

    if (!ALLOWED_METHODS.includes(normalizedMethod)) {
      return res.status(400).json({
        error: "Unsupported HTTP method",
      });
    }

    const response = await fetch(url, {
      method: normalizedMethod,
      headers: headers || {},
      body:
        normalizedMethod === "GET" || normalizedMethod === "DELETE"
          ? undefined
          : body
          ? JSON.stringify(body)
          : undefined,
    });

    const responseText = await response.text();

    return res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseBody: responseText,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "HTTP connector request failed",
    });
  }
});

/*
 * Slack Connector
 */
connectorsRouter.post(
  "/slack/message",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;

      const { connectionId, channel, text } = req.body;

      if (!connectionId || !channel || !text) {
        return res.status(400).json({
          error: "connectionId, channel and text are required",
        });
      }

      const result = await withTenant(tenantId, async (client) => {
        return sendSlackMessage(client, tenantId, {
          connectionId,
          channel,
          text,
        });
      });

      return res.json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Slack connector failed",
      });
    }
  }
);

/*
 * Stripe Connector
 */
connectorsRouter.post(
  "/stripe/customers",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;

      const { connectionId, email, name } = req.body;

      if (!connectionId || !email) {
        return res.status(400).json({
          error: "connectionId and email are required",
        });
      }

      const result = await withTenant(tenantId, async (client) => {
        return createStripeCustomer(client, tenantId, {
          connectionId,
          email,
          name,
        });
      });

      return res.json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Stripe connector failed",
      });
    }
  }
);

/*
 * Google Workspace Connector - Sheets Append
 */
connectorsRouter.post(
  "/google/sheets/append",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;

      const { connectionId, spreadsheetId, range, values } = req.body;

      if (!connectionId || !spreadsheetId || !range || !values) {
        return res.status(400).json({
          error: "connectionId, spreadsheetId, range and values are required",
        });
      }

      if (!Array.isArray(values)) {
        return res.status(400).json({
          error: "values must be a 2D array",
        });
      }

      const result = await withTenant(tenantId, async (client) => {
        return appendGoogleSheetRow(client, tenantId, {
          connectionId,
          spreadsheetId,
          range,
          values,
        });
      });

      return res.json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Google Sheets connector failed",
      });
    }
  }
);