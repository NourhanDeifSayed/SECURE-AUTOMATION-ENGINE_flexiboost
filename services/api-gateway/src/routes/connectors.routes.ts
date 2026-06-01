import { Router, Request, Response } from "express";

export const connectorsRouter = Router();

const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE"];

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