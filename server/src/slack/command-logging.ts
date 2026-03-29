import type { Request, Response } from "express";

import { config } from "../config";
import { logger } from "../logger";

const slackLogger = logger.child({ subsystem: "slack" });

const redactSlackFormBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object") {
    return { _note: "body missing or not an object", type: typeof body };
  }

  const record = { ...(body as Record<string, unknown>) };

  if (typeof record.token === "string") {
    record.token = "[REDACTED]";
  }
  if (typeof record.response_url === "string") {
    record.response_url = "[REDACTED]";
  }
  if (typeof record.trigger_id === "string") {
    record.trigger_id = "[REDACTED]";
  }

  return record;
};

const sanitizeSlackHeaders = (req: Request): Record<string, string | string[] | undefined> => {
  const sig = req.headers["x-slack-signature"];
  const sigStr = typeof sig === "string" ? `${sig.slice(0, 22)}…(len=${sig.length})` : undefined;

  return {
    host: req.headers.host,
    "content-type": req.headers["content-type"],
    "content-length": req.headers["content-length"],
    "x-slack-request-timestamp": req.headers["x-slack-request-timestamp"],
    "x-slack-signature": sigStr,
    "user-agent": req.headers["user-agent"],
    "x-forwarded-for": req.headers["x-forwarded-for"],
    "x-forwarded-proto": req.headers["x-forwarded-proto"],
    "cf-ray": req.headers["cf-ray"],
    "cf-connecting-ip": req.headers["cf-connecting-ip"],
  };
};

const redactUrlEncodedRaw = (raw: string): string =>
  raw
    .replace(/(token=)[^&]*/gi, "$1[REDACTED]")
    .replace(/(response_url=)[^&]*/gi, "$1[REDACTED]")
    .replace(/(trigger_id=)[^&]*/gi, "$1[REDACTED]");

const getRawBodyMeta = (req: Request): { length: number; preview: string | undefined } => {
  const raw = (req as Request & { rawBody?: string }).rawBody;
  if (!raw) {
    return { length: 0, preview: undefined };
  }

  const preview =
    config.SLACK_VERBOSE_LOGGING && raw.length > 0
      ? (() => {
          const safe = redactUrlEncodedRaw(raw);
          return safe.length > 800 ? `${safe.slice(0, 800)}…(+${safe.length - 800} chars)` : safe;
        })()
      : undefined;

  return { length: raw.length, preview };
};

export const logSlackCommandInbound = (req: Request): void => {
  const body = redactSlackFormBody(req.body);
  const text = typeof (req.body as { text?: string })?.text === "string" ? (req.body as { text: string }).text : "";
  const rawMeta = getRawBodyMeta(req);

  slackLogger.info(
    {
      event: "slack_command_inbound",
      method: req.method,
      path: req.path,
      url: req.originalUrl ?? req.url,
      headers: sanitizeSlackHeaders(req),
      remoteAddress: req.socket?.remoteAddress,
      rawBodyLength: rawMeta.length,
      ...(config.SLACK_VERBOSE_LOGGING && rawMeta.preview
        ? { rawBodyPreview: rawMeta.preview }
        : {}),
      formBodyRedacted: body,
      textField: text,
      textLength: text.length,
      ...(config.SLACK_VERBOSE_LOGGING && text.length > 0
        ? {
            textCodeUnits: [...text].length,
            textCharCodes: [...text].slice(0, 120).map((ch) => ch.codePointAt(0)),
            textCharCodesTruncated: [...text].length > 120,
          }
        : {}),
    },
    "Slack slash command inbound",
  );
};

export const logSlackSignatureRejected = (req: Request): void => {
  const rawMeta = getRawBodyMeta(req);
  slackLogger.warn(
    {
      event: "slack_signature_rejected",
      path: req.path,
      headers: sanitizeSlackHeaders(req),
      rawBodyLength: rawMeta.length,
      formBodyRedacted: redactSlackFormBody(req.body),
    },
    "Slack request signature verification failed",
  );
};

export const sendSlackCommandJson = (res: Response, payload: unknown): void => {
  const serialized = JSON.stringify(payload);
  slackLogger.info(
    {
      event: "slack_command_response",
      response: payload,
      responseJson: config.SLACK_VERBOSE_LOGGING ? serialized : "[set SLACK_VERBOSE_LOGGING=true for full JSON]",
      responseBytes: Buffer.byteLength(serialized, "utf8"),
    },
    "Slack slash command response",
  );
  res.status(200).json(payload);
};

export const logSlackCommandError = (
  error: unknown,
  context: { command?: string; text?: string; userId?: string },
): void => {
  if (error instanceof Error) {
    slackLogger.error(
      {
        event: "slack_command_error",
        err: { message: error.message, stack: error.stack, name: error.name },
        ...context,
      },
      "Slack slash command handler error",
    );
    return;
  }

  slackLogger.error(
    {
      event: "slack_command_error",
      err: error,
      ...context,
    },
    "Slack slash command handler error (non-Error)",
  );
};

export const logKudosParsed = (parsed: {
  receiverSlackUserId: string;
  points: number;
  message: string;
}): void => {
  slackLogger.info(
    {
      event: "kudos_command_parsed",
      receiverSlackUserId: parsed.receiverSlackUserId,
      points: parsed.points,
      message: parsed.message,
      messageLength: parsed.message.length,
    },
    "/kudos text parsed successfully",
  );
};

export const logSlackAppValidation = (message: string, context: { command?: string; text?: string }): void => {
  slackLogger.warn(
    {
      event: "slack_command_validation",
      validationMessage: message,
      ...context,
    },
    "Slack slash command validation / business rule",
  );
};
