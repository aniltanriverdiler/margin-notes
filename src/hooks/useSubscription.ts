"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import {
  PLANS,
  PLAN_LIMITS,
  type PlanType,
} from "@/lib/subscription-constants";
import {
  resolvePlanFromHas,
  type ClerkSessionHas,
} from "@/lib/subscription-plan";

export type UseSubscriptionResult =
  | {
      isLoaded: false;
      plan: PlanType;
      limits: (typeof PLAN_LIMITS)[PlanType];
      has: ClerkSessionHas | undefined;
    }
  | {
      isLoaded: true;
      plan: PlanType;
      limits: (typeof PLAN_LIMITS)[PlanType];
      has: ClerkSessionHas;
    };

// Client-side plan + limits using Clerk `useAuth().has({ plan })`, aligned with `getUserPlan()` on the server.
export function useSubscription(): UseSubscriptionResult {
  const { has, userId, isLoaded: isAuthLoaded } = useAuth();

  return useMemo(() => {
    if (!isAuthLoaded) {
      return {
        isLoaded: false,
        plan: PLANS.FREE,
        limits: PLAN_LIMITS[PLANS.FREE],
        has: has as ClerkSessionHas | undefined,
      };
    }

    const plan = resolvePlanFromHas(has, userId);

    return {
      isLoaded: true,
      plan,
      limits: PLAN_LIMITS[plan],
      has,
    };
  }, [isAuthLoaded, has, userId]);
}
