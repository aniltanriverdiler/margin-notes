"use client";

import { PricingTable } from "@clerk/nextjs";
import "@/styles/clerk-pricing.css";

const pricingAppearance = {
  variables: {
    colorPrimary: "var(--clerk-pricing-primary)",
    colorDanger: "oklch(0.577 0.245 27.325)",
    colorSuccess: "#7c9a82",
    colorWarning: "#d4a853",
    colorNeutral: "var(--clerk-pricing-muted)",
    colorText: "var(--clerk-pricing-primary)",
    colorTextOnPrimaryBackground: "#ffffff",
    colorTextSecondary: "var(--clerk-pricing-muted)",
    colorBackground: "var(--clerk-pricing-bg)",
    colorInputText: "var(--clerk-pricing-primary)",
    colorInputBackground: "var(--clerk-pricing-accent-bg)",
    colorShimmer: "rgba(33, 42, 59, 0.06)",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-mona-sans), ui-sans-serif, system-ui, sans-serif",
  },
  layout: {
    socialButtonsVariant: "blockButton" as const,
    shimmer: "default" as const,
  },
} as const;

export function SubscriptionPricing() {
  return (
    <div className="subscriptions-pricing-area">
      <PricingTable
        for="user"
        appearance={pricingAppearance}
        ctaPosition="bottom"
        newSubscriptionRedirectUrl="/subscriptions"
        fallback={
          <p className="text-center py-14 text-(--text-secondary)">
            Loading plans…
          </p>
        }
      />
    </div>
  );
}
