export const PLANS = {
  FREE: "free",
  STANDARD: "standard",
  PRO: "pro",
} as const;

/** Clerk Dashboard billing plan slugs (paid tiers). */
export const CLERK_BILLING_PLAN_SLUGS = {
  STANDARD: "standard",
  PRO: "pro",
} as const;

export type ClerkBillingPlanSlug =
  (typeof CLERK_BILLING_PLAN_SLUGS)[keyof typeof CLERK_BILLING_PLAN_SLUGS];

export type PlanType = (typeof PLANS)[keyof typeof PLANS];

export interface PlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number;
  maxDurationPerSession: number; // in minutes
  hasSessionHistory: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  [PLANS.FREE]: {
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxDurationPerSession: 5,
    hasSessionHistory: false,
  },
  [PLANS.STANDARD]: {
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxDurationPerSession: 15,
    hasSessionHistory: true,
  },
  [PLANS.PRO]: {
    maxBooks: 100,
    maxSessionsPerMonth: Infinity,
    maxDurationPerSession: 60,
    hasSessionHistory: true,
  },
};

export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};
