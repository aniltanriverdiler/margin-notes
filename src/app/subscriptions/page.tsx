import type { Metadata } from "next";
import { SubscriptionPricing } from "@/components/subscriptions/SubscriptionPricing";

export const metadata: Metadata = {
  title: "Pricing | Bookified",
  description:
    "Compare Bookified plans—books, voice sessions, and session length limits.",
};

export default function SubscriptionsPage() {
  return (
    <main className="min-h-screen bg-(--bg-primary) pb-20 pt-[calc(var(--navbar-height)+2rem)]">
      <div className="wrapper">
        <header className="mb-12 text-center">
          <h1 className="font-serif text-3xl text-(--text-primary) md:text-4xl">
            Choose your plan
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-(--text-secondary)">
            Subscribe securely with Clerk Billing. Free tier includes one book
            and a taste of voice sessions—upgrade when you need more.
          </p>
        </header>
        <SubscriptionPricing />
      </div>
    </main>
  );
}
