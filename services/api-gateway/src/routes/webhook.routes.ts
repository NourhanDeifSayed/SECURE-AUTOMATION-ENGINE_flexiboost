import { Router, Request, Response } from "express";
import crypto from "crypto";
import Redis from "ioredis";

export const webhookRouter = Router();

const WEBHOOK_SECRET = "phase2-webhook-secret";
const REPLAY_TTL_SECONDS = 10 * 60;

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

webhookRouter.post("/test", async (req: Request, res: Response) => {
  try {
    const signature = req.header("x-signature");

    if (!signature) {
      return res.status(401).json({
        error: "Missing signature",
      });
    }

    const payload = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    const webhookId = req.body.id;

    if (!webhookId) {
      return res.status(400).json({
        error: "Webhook id is required",
      });
    }

    const replayKey = `webhook:replay:${webhookId}`;

    const wasStored = await redis.set(
      replayKey,
      "1",
      "EX",
      REPLAY_TTL_SECONDS,
      "NX"
    );

    if (wasStored !== "OK") {
      return res.status(409).json({
        error: "Duplicate webhook rejected",
      });
    }

    return res.json({
      status: "accepted",
      verified: true,
      replayProtected: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Webhook processing failed",
    });
  }
});