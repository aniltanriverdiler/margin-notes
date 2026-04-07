"use server";

import { auth } from "@clerk/nextjs/server";
import { EndSessionResult, StartSessionResult } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import {
  getCurrentBillingPeriodStart,
  PLAN_LIMITS,
} from "@/lib/subscription-constants";
import { getUserPlan } from "@/lib/subscription.server";

// Start a voice session action
export const startVoiceSession = async (
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    await connectToDatabase();

    const { userId } = await auth();
    if (!userId || userId !== clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const plan = await getUserPlan();
    const limits = PLAN_LIMITS[plan];
    const billingPeriodStart = getCurrentBillingPeriodStart();

    const sessionCount = await VoiceSession.countDocuments({
      clerkId,
      billingPeriodStart,
    });

    const monthlyCap = limits.maxSessionsPerMonth;
    if (Number.isFinite(monthlyCap) && sessionCount >= monthlyCap) {
      return {
        success: false,
        error: `You have reached the monthly session limit for your ${plan} plan (${monthlyCap}). Please upgrade for more sessions.`,
        isBillingError: true,
      };
    }

    const session = await VoiceSession.create({
      clerkId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart,
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: limits.maxDurationPerSession,
    };
  } catch (e) {
    console.error("Error starting voice session", e);
    return {
      success: false,
      error: "Failed to start voice session. Please try again later.",
    };
  }
};

// End a voice session action
export const endVoiceSession = async (
  sessionId: string,
  durationSeconds: number,
): Promise<EndSessionResult> => {
  try {
    await connectToDatabase();

    const result = await VoiceSession.findByIdAndUpdate(sessionId, {
      endedAt: new Date(),
      durationSeconds,
    });

    if (!result) return { success: false, error: "Voice session not found" };

    return { success: true };
  } catch (e) {
    console.error("Error ending voice session", e);
    return {
      success: false,
      error: "Failed to end voice session. Please try again later.",
    };
  }
};
