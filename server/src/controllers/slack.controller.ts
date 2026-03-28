import type { Request, Response } from "express";

import {
  formatBalanceMessage,
  formatKudosErrorMessage,
  formatKudosSuccessMessage,
  formatLeaderboardMessage,
  formatStatsMessage,
} from "../slack/messages";
import { parseKudosCommand } from "../slack/parser";
import { giveKudos } from "../services/kudos.service";
import { getLeaderboard, getUserStatsBySlackId } from "../services/stats.service";
import type { SlackCommandPayload } from "../types/slack";
import { AppError } from "../utils/errors";

const parseLeaderboardLimit = (text: string): number => {
  if (!text) {
    return 10;
  }
  const parsed = Number(text.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 10;
  }
  return Math.min(parsed, 25);
};

const respondEphemeral = (res: Response, text: string) =>
  res.status(200).json({
    response_type: "ephemeral",
    text,
  });

export const handleSlackCommand = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body as SlackCommandPayload;

  try {
    switch (payload.command) {
      case "/kudos": {
        const parsed = parseKudosCommand(payload.text ?? "");
        const result = await giveKudos({
          giverSlackUserId: payload.user_id,
          giverDisplayName: payload.user_name,
          receiverSlackUserId: parsed.receiverSlackUserId,
          points: parsed.points,
          message: parsed.message,
        });
        res.status(200).json({
          response_type: "in_channel",
          text: formatKudosSuccessMessage(result),
        });
        return;
      }
      case "/kudos-balance": {
        const stats = await getUserStatsBySlackId(payload.user_id);
        respondEphemeral(res, formatBalanceMessage(stats.displayName, stats.remainingBalance));
        return;
      }
      case "/kudos-stats": {
        const stats = await getUserStatsBySlackId(payload.user_id);
        respondEphemeral(
          res,
          formatStatsMessage(
            stats.displayName,
            stats.totalGiven,
            stats.totalReceived,
            stats.remainingBalance,
          ),
        );
        return;
      }
      case "/kudos-leaderboard": {
        const limit = parseLeaderboardLimit(payload.text ?? "");
        const data = await getLeaderboard(limit);
        res.status(200).json({
          response_type: "ephemeral",
          text: formatLeaderboardMessage(data.topGivers, data.topReceivers),
        });
        return;
      }
      default: {
        throw new AppError(`Unsupported command: ${payload.command}`, 400);
      }
    }
  } catch (error) {
    if (error instanceof AppError) {
      respondEphemeral(res, formatKudosErrorMessage(error.message));
      return;
    }
    respondEphemeral(res, formatKudosErrorMessage("Unexpected error while processing command."));
  }
};
