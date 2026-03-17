import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  getMySubscription,
  getPlanLabel,
} from "../lib/subscription-service";
import { BadgeCheck, CheckCircle, CreditCard } from "lucide-react";
import { supabase } from "../lib/supabase";

type PlanKey = "free" | "pro" | "business";

const plans: {
  key: PlanKey;
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    key: "free",
    title: "Free",
    price: "₱0",
    subtitle: "Good for getting started",
    features: [
      "1 active card",
      "Basic public card",
      "No analytics",
      "No lead capture",
      "No theme customization",
    ],
  },
  {
    key: "pro",
    title: "Pro",
    price: "₱12",
    subtitle: "Best for individual professionals",
    popular: true,
    features: [
      "Unlimited active cards",
      "Tap analytics",
      "Lead capture",
      "Theme customization",
      "Priority growth features",
    ],
  },
  {
    key: "business",
    title: "Business",
    price: "₱49",
    subtitle: "For teams and scaling use",
    features: [
      "Everything in Pro",
      "Unlimited active cards",
      "Lead capture",
      "Analytics",
      "Ready for team tools later",
    ],
  },
];

export function PlansPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [checkingOutPlan, setCheckingOutPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPlan = async () => {
    const subscription = await getMySubscription();
    setCurrentPlan((subscription?.plan as PlanKey) || "free");
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadPlan();

        const params = new URLSearchParams(window.location.search);
        const payment = params.get("payment");

        if (payment === "success") {
          setSuccess("Payment completed. Your subscription will update shortly.");
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
                    }`}
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
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span
                        className={`ml-1 ${
                          plan.popular ? "text-indigo-100" : "text-gray-600"
                        }`}
                      >
                        /month
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

                    {isCurrent ? (
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
            <h2 className="text-xl font-semibold mb-3">Payment Methods</h2>
            <p className="text-sm text-gray-600">
              Checkout is powered by PayMongo. Available payment methods depend on
              your PayMongo account and checkout configuration.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}