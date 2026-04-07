import { auth } from "@clerk/nextjs/server";
import { PLAN_LIMITS, type PlanType } from "@/lib/subscription-constants";
import { resolvePlanFromHas } from "@/lib/subscription-plan";

export const getUserPlan = async (): Promise<PlanType> => {
  const { has, userId } = await auth();
  return resolvePlanFromHas(has, userId);
};

export const getPlanLimits = async () => {
  const plan = await getUserPlan();
  return PLAN_LIMITS[plan];
};
