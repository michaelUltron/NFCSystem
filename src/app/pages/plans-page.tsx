import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { getMySubscription, getPlanLabel } from "../lib/subscription-service";
import { BadgeCheck, CheckCircle, CreditCard, Info } from "lucide-react";
import { supabase } from "../lib/supabase";

type PlanKey = "free" | "pro" | "business";

type PlanSettingRow = {
  id: string;
  plan: PlanKey;
  name: string;
  price: number;
  currency: string;
  paymongo_amount: number;
  is_active: boolean;
};

type PlanCard = {
  key: PlanKey;
  title: string;
  priceLabel: string;
  subtitle: string;
  features: string[];
  popular?: boolean;
  isActive: boolean;
};

export function PlansPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [checkingOutPlan, setCheckingOutPlan] = useState<PlanKey | null>(null);
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPage = async () => {
    const [subscription, planRows] = await Promise.all([
      getMySubscription(),
      supabase
        .from("plan_settings")
        .select("id, plan, name, price, currency, paymongo_amount, is_active")
        .order("price", { ascending: true }),
    ]);

    setCurrentPlan((subscription?.plan as PlanKey) || "free");

    if (planRows.error) {
      throw planRows.error;
    }

    const settings = (planRows.data ?? []) as PlanSettingRow[];

    const settingsMap = new Map(settings.map((row) => [row.plan, row]));

    const builtPlans: PlanCard[] = [
      {
        key: "free",
        title: settingsMap.get("free")?.name || "Free",
        priceLabel:
          Number(settingsMap.get("free")?.price || 0) === 0
            ? "₱0"
            : `₱${settingsMap.get("free")?.price ?? 0}`,
        subtitle: "Good for getting started",
        features: [
          "1 active card",
          "Basic public card",
          "No analytics",
          "No lead capture",
          "No theme customization",
        ],
        isActive: settingsMap.get("free")?.is_active ?? true,
      },
      {
        key: "pro",
        title: settingsMap.get("pro")?.name || "Pro",
        priceLabel: `₱${settingsMap.get("pro")?.price ?? 0}`,
        subtitle: "Best for individual professionals",
        popular: true,
        features: [
          "Unlimited active cards",
          "Tap analytics",
          "Lead capture",
          "Theme customization",
          "Priority growth features",
        ],
        isActive: settingsMap.get("pro")?.is_active ?? true,
      },
      {
        key: "business",
        title: settingsMap.get("business")?.name || "Business",
        priceLabel: `₱${settingsMap.get("business")?.price ?? 0}`,
        subtitle: "For teams and scaling use",
        features: [
          "Everything in Pro",
          "Unlimited active cards",
          "Lead capture",
          "Analytics",
          "Ready for team tools later",
        ],
        isActive: settingsMap.get("business")?.is_active ?? true,
      },
    ];

    setPlans(builtPlans);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadPage();

        const params = new URLSearchParams(window.location.search);
        const payment = params.get("payment");

        if (payment === "success") {
          setSuccess(
            "Payment completed. Your subscription will update shortly."
          );
        } else if (payment === "cancelled") {
          setError("Payment was cancelled.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load plans.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const handleCheckout = async (plan: Exclude<PlanKey, "free">) => {
    try {
      setCheckingOutPlan(plan);
      setError("");
      setSuccess("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      const response = await fetch("/api/paymongo/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId: user.id,
          email: user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to create checkout session.");
      }

      if (!result.checkoutUrl) {
        throw new Error("No checkout URL returned.");
      }

      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      setError(err.message || "Failed to start checkout.");
    } finally {
      setCheckingOutPlan(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">Plans & Billing</h1>
              <p className="text-gray-600">
                Choose the plan that fits your SabiCard needs
              </p>
            </div>

            {!loading && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Current Plan: {getPlanLabel(currentPlan)}
              </div>
            )}
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-6">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-6">
              {success}
            </div>
          ) : null}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-8">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Payment Information</p>
                <p>
                  Pro and Business plans are currently charged as a
                  <strong> one-time payment for 30 days of access</strong>.
                  There is <strong>no automatic monthly charge yet</strong>.
                </p>
                <p className="mt-1">
                  When your billing period ends, you may renew again through the
                  Plans page.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading plans...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isCurrent = currentPlan === plan.key;
                const isPaidPlan = plan.key === "pro" || plan.key === "business";
                const isCheckingOut = checkingOutPlan === plan.key;

                return (
                  <div
                    key={plan.key}
                    className={`rounded-xl p-8 shadow-md border ${
                      plan.popular
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white border-gray-200"
                    } ${!plan.isActive ? "opacity-60" : ""}`}
                  >
                    {plan.popular ? (
                      <div className="text-center mb-3">
                        <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold">
                          POPULAR
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard
                        className={`w-5 h-5 ${
                          plan.popular ? "text-white" : "text-indigo-600"
                        }`}
                      />
                      <h2 className="text-2xl font-bold">{plan.title}</h2>
                    </div>

                    <div className="mb-2">
                      <span className="text-4xl font-bold">
                        {plan.priceLabel}
                      </span>
                      <span
                        className={`ml-1 ${
                          plan.popular ? "text-indigo-100" : "text-gray-600"
                        }`}
                      >
                        {plan.key === "free" ? "" : "/30 days"}
                      </span>
                    </div>

                    <p
                      className={`mb-6 ${
                        plan.popular ? "text-indigo-100" : "text-gray-600"
                      }`}
                    >
                      {plan.subtitle}
                    </p>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {!plan.isActive ? (
                      <button
                        type="button"
                        disabled
                        className={`w-full rounded-lg px-6 py-3 font-medium cursor-not-allowed ${
                          plan.popular
                            ? "bg-white text-indigo-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        Currently Unavailable
                      </button>
                    ) : isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className={`w-full rounded-lg px-6 py-3 font-medium cursor-not-allowed ${
                          plan.popular
                            ? "bg-white text-indigo-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        Current Plan
                      </button>
                    ) : plan.key === "free" ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-lg px-6 py-3 font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                      >
                        Contact admin to downgrade
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCheckout(plan.key)}
                        disabled={isCheckingOut}
                        className={`w-full rounded-lg px-6 py-3 font-medium ${
                          plan.popular
                            ? "bg-white text-indigo-600 hover:bg-gray-100"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        } disabled:opacity-60`}
                      >
                        {isCheckingOut ? "Redirecting..." : `Choose ${plan.title}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-3">Accepted Payments</h2>
            <p className="text-sm text-gray-600">
              Checkout is powered by PayMongo. Available payment methods depend
              on your PayMongo account and checkout configuration, such as cards,
              GCash, Maya, QR Ph, and other supported channels.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}