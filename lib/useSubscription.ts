"use client";

import { useCallback, useEffect, useState } from "react";
import { getOwnerToken } from "@/lib/ownerToken";
import { PLAN_LIMITS } from "@/lib/plans";
import type { UsageSnapshot } from "@/lib/usage";

type UsageData = UsageSnapshot;

type SubscriptionState = {
  plan: "free" | "pro";
  usage: UsageData;
  limits: (typeof PLAN_LIMITS)["free"];
  loading: boolean;
  isPro: boolean;
};

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    usage: {
      debriefs: 0,
      chatMessages: 0,
      shareLinks: 0,
      emailSends: 0,
    },
    limits: PLAN_LIMITS.free,
    loading: true,
    isPro: false,
  });

  const ownerToken = typeof window !== "undefined" ? getOwnerToken() : "";

  const fetchStatus = useCallback(async () => {
    if (!ownerToken) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    try {
      const res = await fetch(
        `/api/subscription/status?ownerToken=${encodeURIComponent(ownerToken)}`
      );
      const data = (await res.json()) as {
        plan?: string;
        usage?: UsageData;
        error?: string;
      };
      if (!res.ok || !data.plan) {
        setState((s) => ({
          ...s,
          loading: false,
          plan: "free",
          limits: PLAN_LIMITS.free,
          isPro: false,
        }));
        return;
      }
      const plan = data.plan === "pro" ? "pro" : "free";
      setState({
        plan,
        usage: data.usage ?? {
          debriefs: 0,
          chatMessages: 0,
          shareLinks: 0,
          emailSends: 0,
        },
        limits: PLAN_LIMITS[plan],
        loading: false,
        isPro: plan === "pro",
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [ownerToken]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      void fetchStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("upgrade_cancelled") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchStatus]);

  const upgrade = useCallback(
    async (email?: string) => {
      if (!ownerToken) return;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerToken, email }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }
      window.location.href = data.url;
    },
    [ownerToken]
  );

  const manageSubscription = useCallback(async () => {
    if (!ownerToken) return;
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerToken }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Could not open billing portal.");
    }
    window.location.href = data.url;
  }, [ownerToken]);

  return { ...state, upgrade, manageSubscription, refresh: fetchStatus };
}
