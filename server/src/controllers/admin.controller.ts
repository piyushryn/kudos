import type { Request, Response } from "express";

import { config } from "../config";
import { runMonthlyBalanceProvisioning } from "../jobs/monthly-reset";

export const runMonthlyResetHandler = async (_req: Request, res: Response): Promise<void> => {
  if (!config.ENABLE_MANUAL_MONTHLY_RESET) {
    res.status(403).json({ error: "Manual reset disabled." });
    return;
  }

  await runMonthlyBalanceProvisioning();
  res.status(200).json({ ok: true });
};
