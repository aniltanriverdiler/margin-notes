import type { AuthObject } from "@clerk/backend";
import {
  CLERK_BILLING_PLAN_SLUGS,
  PLANS,
  type PlanType,
} from "@/lib/subscription-constants";

/** Same `has()` shape as `auth()` from `@clerk/nextjs/server` / `useAuth()`. */
export type ClerkSessionHas = AuthObject["has"];

/**
 * Resolves the app's plan tier from Clerk session `has()` and user id.
 * Free tier when signed out or when neither paid plan is active.
 */
export function resolvePlanFromHas(
  has: ClerkSessionHas,
  userId: string | null | undefined,
): PlanType {
  if (!userId) return PLANS.FREE;

  // Clerk plan checks are namespaced, e.g. "user:pro" or "org:pro"
  const userPro = `user:${CLERK_BILLING_PLAN_SLUGS.PRO}` as const;
  const userStandard = `user:${CLERK_BILLING_PLAN_SLUGS.STANDARD}` as const;
  const orgPro = `org:${CLERK_BILLING_PLAN_SLUGS.PRO}` as const;
  const orgStandard = `org:${CLERK_BILLING_PLAN_SLUGS.STANDARD}` as const;

  // Prefer user-scoped billing, but allow org-scoped billing too.
  if (has({ plan: userPro }) || has({ plan: orgPro })) return PLANS.PRO;
  if (has({ plan: userStandard }) || has({ plan: orgStandard }))
    return PLANS.STANDARD;
  return PLANS.FREE;
}
