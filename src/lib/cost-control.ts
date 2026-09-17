import { z } from 'zod';

export const aiCostRecordSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative(),
});

export const DEFAULT_AI_BUDGET_USD = 5;
export const DEFAULT_MONTHLY_AI_REQUESTS = 50;

export function shouldBlockAiSpend(args: {
  monthlySpendUsd: number;
  monthlyRequests: number;
  budgetUsd: number;
  requestLimit: number;
}) {
  return (
    args.monthlySpendUsd >= args.budgetUsd ||
    args.monthlyRequests >= args.requestLimit
  );
}

export function chooseAiMode(args: {
  monthlySpendUsd: number;
  budgetUsd: number;
  monthlyRequests: number;
  requestLimit: number;
}) {
  if (shouldBlockAiSpend(args)) return 'blocked' as const;
  const budgetRatio = args.budgetUsd > 0 ? args.monthlySpendUsd / args.budgetUsd : 1;
  const requestRatio = args.requestLimit > 0 ? args.monthlyRequests / args.requestLimit : 1;
  return Math.max(budgetRatio, requestRatio) >= 0.8 ? 'economy' as const : 'normal' as const;
}
