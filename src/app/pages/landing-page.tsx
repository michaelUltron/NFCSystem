import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import sabiBanner from "../assets/sabi_banner.jpg";
import sabiLogo from "../assets/sabi-logo.png";
import { supabase } from "../lib/supabase";

import {
  Zap,
  Users,
  BarChart3,
  Smartphone,
  Share2,
  CheckCircle,
  ArrowRight,
  Info,
} from "lucide-react";

type PlanSettingRow = {
  id: string;
  plan: "free" | "pro" | "business";
  name: string;
  price: number;
  currency: string;
  paymongo_amount: number;
  is_active: boolean;
};

type LandingPlan = {
  key: "free" | "pro" | "business";
  title: string;
  priceLabel: string;
  suffix: string;
  features: string[];
  buttonLabel: string;
  popular?: boolean;
  isActive: boolean;
};

export function LandingPage() {
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState<LandingPlan[]>([]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("plan_settings")
          .select("id, plan, name, price, currency, paymongo_amount, is_active")
          .order("price", { ascending: true });

        if (error) throw error;

        const rows = (data ?? []) as PlanSettingRow[];
        const settingsMap = new Map(rows.map((row) => [row.plan, row]));

        const builtPlans: LandingPlan[] = [
          {
            key: "free",
            title: settingsMap.get("free")?.name || "Free",
            priceLabel:
              Number(settingsMap.get("free")?.price || 0) === 0
                ? "₱0"
                : `₱${settingsMap.get("free")?.price ?? 0}`,
            suffix: "",
            features: [
              "1 Digital Card",
              "Basic card experience",
              "No analytics",
              "No lead capture",
              "No theme customization",
            ],
            buttonLabel: "Get Started",
            isActive: settingsMap.get("free")?.is_active ?? true,
          },
          {
            key: "pro",
            title: settingsMap.get("pro")?.name || "Pro",
            priceLabel: `₱${settingsMap.get("pro")?.price ?? 0}`,
            suffix: "/30 days",
            features: [
              "Unlimited Digital Cards",
              "Advanced Analytics",
              "Lead Capture",
              "Theme Customization",
              "Growth-focused features",
            ],
            buttonLabel: "Choose Pro",
            popular: true,
            isActive: settingsMap.get("pro")?.is_active ?? true,
          },
          {
            key: "business",
            title: settingsMap.get("business")?.name || "Business",
            priceLabel: `₱${settingsMap.get("business")?.price ?? 0}`,
            suffix: "/30 days",
            features: [
              "Everything in Pro",
              "Unlimited Cards",
              "Lead Capture",
              "Analytics",
              "Ready for teams later",
            ],
            buttonLabel: "Choose Business",
            isActive: settingsMap.get("business")?.is_active ?? true,
          },
        ];

        setPlans(builtPlans);
      } catch (err) {
        setPlans([
          {
            key: "free",
            title: "Free",
            priceLabel: "₱0",
            suffix: "",
            features: [
              "1 Digital Card",
              "Basic card experience",
              "No analytics",
              "No lead capture",
              "No theme customization",
            ],
            buttonLabel: "Get Started",
            isActive: true,
          },
          {
            key: "pro",
            title: "Pro",
            priceLabel: "₱12",
            suffix: "/30 days",
            features: [
              "Unlimited Digital Cards",
              "Advanced Analytics",
              "Lead Capture",
              "Theme Customization",
              "Growth-focused features",
            ],
            buttonLabel: "Choose Pro",
            popular: true,
            isActive: true,
          },
          {
            key: "business",
            title: "Business",
            priceLabel: "₱49",
            suffix: "/30 days",
            features: [
              "Everything in Pro",
              "Unlimited Cards",
              "Lead Capture",
              "Analytics",
              "Ready for teams later",
            ],
            buttonLabel: "Choose Business",
            isActive: true,
          },
        ]);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, []);

  const pricingPlans = useMemo(() => plans, [plans]);

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img
                src={sabiLogo}
                alt="SabiCard"
                className="w-14 h-14 object-contain rounded-lg"
              />
              <div>
                <h2 className="text-2xl font-bold leading-tight">SabiCard</h2>
                <p className="text-sm text-gray-500">
                  Your card tells people who you are
                </p>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Tap. Share. Connect.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transform the way you network with NFC digital business cards.
              Share your contact information instantly with a single tap.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-6 py-3 text-center inline-flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* <a
                href="/order"
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3 text-center"
              >
                Buy NFC Card
              </a> */}
            </div>
          </div>

          <div className="relative">
            <ImageWithFallback
              src={sabiBanner}
              alt="SabiCard NFC Business Card"
              className="rounded-2xl shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose SabiCard?</h2>
            <p className="text-xl text-gray-600">
              Everything you need to network smarter and track your connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Instant Contact Sharing
              </h3>
              <p className="text-gray-600">
                Share your complete contact information with a single tap. No
                app required for recipients.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lead Capture</h3>
              <p className="text-gray-600">
                Capture leads automatically when someone taps your card. Build
                your network effortlessly.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tap Analytics</h3>
              <p className="text-gray-600">
                Track every tap, view detailed analytics, and understand how
                people engage with your card.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Getting started is simple and takes less than 5 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <div className="mb-4">
                <Smartphone className="w-12 h-12 text-indigo-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tap NFC Card</h3>
              <p className="text-gray-600">
                Hold your NFC card near any smartphone to activate
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <div className="mb-4">
                <Share2 className="w-12 h-12 text-indigo-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Profile Opens</h3>
              <p className="text-gray-600">
                Your digital business card opens instantly on their phone
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <div className="mb-4">
                <CheckCircle className="w-12 h-12 text-indigo-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Contact</h3>
              <p className="text-gray-600">
                They save your contact with one click. Connection made!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-10 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Payment Clarification</p>
                <p>
                  Paid plans are currently charged as a
                  <strong> one-time payment for 30 days of access</strong>.
                  There is <strong>no automatic monthly charge yet</strong>.
                </p>
                <p className="mt-1">
                  When the billing period ends, you may renew again through the
                  Plans page inside your account.
                </p>
              </div>
            </div>
          </div>

          {loadingPlans ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p>Loading pricing...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.key}
                  className={`rounded-xl p-8 shadow-md ${
                    plan.popular
                      ? "bg-indigo-600 text-white shadow-lg transform scale-105"
                      : "bg-white"
                  } ${!plan.isActive ? "opacity-60" : ""}`}
                >
                  {plan.popular ? (
                    <div className="text-center mb-2">
                      <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold">
                        POPULAR
                      </span>
                    </div>
                  ) : null}

                  <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.priceLabel}</span>
                    {plan.suffix ? (
                      <span
                        className={
                          plan.popular ? "text-indigo-100" : "text-gray-600"
                        }
                      >
                        {plan.suffix}
                      </span>
                    ) : null}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            plan.popular ? "" : "text-green-500"
                          }`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!plan.isActive ? (
                    <button
                      type="button"
                      disabled
                      className={`block w-full text-center rounded-lg px-6 py-3 cursor-not-allowed ${
                        plan.popular
                          ? "bg-white text-indigo-600"
                          : "border border-gray-300 text-gray-400"
                      }`}
                    >
                      Currently Unavailable
                    </button>
                  ) : (
                    <Link
                      to={plan.key === "free" ? "/register" : "/plans"}
                      className={`block w-full text-center rounded-lg px-6 py-3 ${
                        plan.popular
                          ? "bg-white text-indigo-600 hover:bg-gray-50"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {plan.buttonLabel}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Networking?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join professionals using SabiCard to make better connections
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-8 py-4 text-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}