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
  X,
  ShieldCheck,
  FileText,
  Building2,
  Store,
  CreditCard,
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

type ModalType = "privacy" | "terms" | null;

export function LandingPage() {
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState<LandingPlan[]>([]);
  const [openModal, setOpenModal] = useState<ModalType>(null);

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
                ? "\u20b10"
                : `\u20b1${settingsMap.get("free")?.price ?? 0}`,
            suffix: "",
            features: [
              "1 Digital Card",
              "Basic card experience",
              "Basic profile sharing",
              "7-day analytics trial",
              "7-day lead capture trial",
            ],
            buttonLabel: "Get Started",
            isActive: settingsMap.get("free")?.is_active ?? true,
          },
          {
            key: "pro",
            title: settingsMap.get("pro")?.name || "Pro",
            priceLabel: `\u20b1${settingsMap.get("pro")?.price ?? 0}`,
            suffix: "/30 days",
            features: [
              "Unlimited Digital Cards",
              "Advanced analytics",
              "Lead capture",
              "Theme customization",
              "Better personal branding tools",
            ],
            buttonLabel: "Choose Pro",
            popular: true,
            isActive: settingsMap.get("pro")?.is_active ?? true,
          },
          {
            key: "business",
            title: settingsMap.get("business")?.name || "Business",
            priceLabel: `\u20b1${settingsMap.get("business")?.price ?? 0}`,
            suffix: "/30 days",
            features: [
              "Everything in Pro",
              "Shared business card inventory",
              "Organization branding",
              "Team invites and card assignment",
              "Business-ready lead capture and analytics",
            ],
            buttonLabel: "Choose Business",
            isActive: settingsMap.get("business")?.is_active ?? true,
          },
        ];

        setPlans(builtPlans);
      } catch {
        setPlans([
          {
            key: "free",
            title: "Free",
            priceLabel: "\u20b10",
            suffix: "",
            features: [
              "1 Digital Card",
              "Basic card experience",
              "Basic profile sharing",
              "7-day analytics trial",
              "7-day lead capture trial",
            ],
            buttonLabel: "Get Started",
            isActive: true,
          },
          {
            key: "pro",
            title: "Pro",
            priceLabel: "\u20b112",
            suffix: "/30 days",
            features: [
              "Unlimited Digital Cards",
              "Advanced analytics",
              "Lead capture",
              "Theme customization",
              "Better personal branding tools",
            ],
            buttonLabel: "Choose Pro",
            popular: true,
            isActive: true,
          },
          {
            key: "business",
            title: "Business",
            priceLabel: "\u20b149",
            suffix: "/30 days",
            features: [
              "Everything in Pro",
              "Shared business card inventory",
              "Organization branding",
              "Team invites and card assignment",
              "Business-ready lead capture and analytics",
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

  const closeModal = () => setOpenModal(null);

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 mb-6">
              <CreditCard className="h-4 w-4" />
              NFC digital business cards for professionals, teams, and sellers
            </div>

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
              Your NFC Business Card, Ready in One Tap
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Create a digital profile, activate your NFC card, capture leads,
              and track engagement. Recipients can open your card instantly with
              no app required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="bg-cyan-600 text-white hover:bg-cyan-700 rounded-lg px-6 py-3 text-center inline-flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="/order"
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3 text-center"
              >
                Buy NFC Card
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 text-sm text-gray-600">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                No app required for recipients
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                Secure account-based activation
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                Works with 13.56 MHz NFC cards
              </div>
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

      <section className="border-y border-gray-100 bg-white py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="w-11 h-11 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5 text-cyan-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Professionals</h3>
              <p className="text-gray-600">
                Share your profile, links, contact details, and social accounts
                from one tap-ready digital card.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-6">
              <div className="w-11 h-11 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-cyan-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Businesses</h3>
              <p className="text-gray-600">
                Manage team cards, organization branding, leads, analytics, and
                business-ready card inventory.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-6">
              <div className="w-11 h-11 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Store className="w-5 h-5 text-cyan-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For NFC Sellers</h3>
              <p className="text-gray-600 mb-4">
                Register NFC cards with credits, encode tap URLs, and monitor
                customer activations from a seller dashboard.
              </p>
              <a
                href="mailto:info@sabicard.app?subject=SabiCard%20Seller%20Pilot"
                className="inline-flex items-center gap-2 text-cyan-700 font-medium hover:text-cyan-800"
              >
                Ask about seller pilot
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

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
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-cyan-700" />
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
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-cyan-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lead Capture</h3>
              <p className="text-gray-600">
                Capture leads automatically when someone taps your card. Build
                your network effortlessly.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-cyan-700" />
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

      <section id="how-it-works" className="py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              From card activation to sharing, the flow is built to be simple
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                1
              </div>
              <div className="mb-4">
                <CreditCard className="w-10 h-10 text-cyan-700 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Get a Card</h3>
              <p className="text-gray-600">
                Buy, receive, or issue a SabiCard-compatible NFC card
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                2
              </div>
              <div className="mb-4">
                <Smartphone className="w-10 h-10 text-cyan-700 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tap or Scan</h3>
              <p className="text-gray-600">
                Open the activation page from NFC or a tap link
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                3
              </div>
              <div className="mb-4">
                <CheckCircle className="w-10 h-10 text-cyan-700 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Activate</h3>
              <p className="text-gray-600">
                Create or sign in to your account and claim the card
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                4
              </div>
              <div className="mb-4">
                <Share2 className="w-10 h-10 text-cyan-700 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Share</h3>
              <p className="text-gray-600">
                Your public digital card opens instantly for contacts
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                5
              </div>
              <div className="mb-4">
                <BarChart3 className="w-10 h-10 text-cyan-700 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track</h3>
              <p className="text-gray-600">
                Monitor taps, leads, and engagement from your dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-gray-50 py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 mb-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-cyan-700 mt-0.5" />
              <div className="text-sm text-cyan-950">
                <p className="font-semibold mb-1">Seller pilot available</p>
                <p>
                  Approved NFC sellers can register cards using seller credits
                  and monitor customer activations. Email{" "}
                  <a className="font-semibold underline" href="mailto:info@sabicard.app">
                    info@sabicard.app
                  </a>{" "}
                  to ask about the pilot program.
                </p>
              </div>
            </div>
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

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Networking?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join professionals, teams, and NFC sellers using SabiCard to make
            better connections
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-cyan-600 text-white hover:bg-cyan-700 rounded-lg px-8 py-4 text-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm text-gray-500">
            By using SabiCard, you agree to our Privacy Policy and Terms of Use.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setOpenModal("privacy")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ShieldCheck className="w-4 h-4" />
              Privacy Policy
            </button>

            <button
              type="button"
              onClick={() => setOpenModal("terms")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FileText className="w-4 h-4" />
              Terms of Use
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {openModal === "privacy" ? (
        <PolicyModal
          title="Privacy Policy"
          onClose={closeModal}
        >
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              SabiCard respects your privacy and is committed to protecting personal data in accordance with applicable Philippine law, including the Data Privacy Act of 2012 and its implementing rules and regulations. 
            </p>

            <div>
              <h3 className="font-semibold mb-1">1. Information We Collect</h3>
              <p>
                We may collect account information such as your name, email address, phone number, username, company, job title, profile photo, website, social links, and other profile details you choose to publish through your digital card. For paid plans, we may also process billing and transaction records through payment providers. If lead capture is enabled, we may collect visitor-submitted names, emails, phone numbers, company details, and messages.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">2. How We Use Information</h3>
              <p>
                We use personal data to create and manage user accounts, activate and manage NFC cards, display public digital card profiles, process plan purchases, support analytics, enable team and business features, generate QR codes, capture leads, detect misuse, enforce our platform rules, and improve our services. We may also use contact information for service notices, security alerts, billing reminders, and product-related communications.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">3. Public Profile Information</h3>
              <p>
                Information you choose to publish on your digital card may be visible to anyone who taps your NFC card, scans your QR code, or accesses your public card link. You are responsible for the accuracy and appropriateness of content you choose to make public.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">4. Legal Basis and Consent</h3>
              <p>
                Where required, SabiCard processes personal data on the basis of consent, contractual necessity, legal obligation, and our legitimate business interests, including platform security, fraud prevention, service continuity, and customer support, subject to applicable Philippine law and valid-consent standards recognized by the National Privacy Commission. 
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">5. Sharing of Information</h3>
              <p>
                We may share data with service providers that support payment processing, hosting, cloud storage, analytics, communications, and platform operations, but only to the extent reasonably necessary for the service. We may also disclose information where required by law, lawful order, regulation, subpoena, government request, or to protect SabiCard, our users, or the public from fraud, abuse, security threats, or legal claims.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">6. Business and Team Accounts</h3>
              <p>
                If your account is managed under a Business plan, the business owner or authorized administrators may manage branding, card assignment, business inventory, team invitations, and related organization-level settings. In such cases, certain profile and card-management actions may be controlled by the organization rather than the individual member.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">7. Data Retention</h3>
              <p>
                We retain information for as long as reasonably necessary for account administration, transaction documentation, customer support, fraud prevention, legal compliance, dispute resolution, and enforcement of our agreements. We may retain backup, archived, or security-related records for a longer period where reasonably required.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">8. Security</h3>
              <p>
                We use reasonable administrative, organizational, physical, and technical safeguards to protect data. However, no system is completely secure, and SabiCard does not warrant that access to the platform will always be uninterrupted, timely, secure, or error-free.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">9. Your Rights</h3>
              <p>
                Subject to applicable law, you may request access to, correction of, or deletion of personal data, object to certain processing, or raise privacy concerns. Requests may be subject to identity verification, security checks, contractual obligations, record-retention requirements, and our legitimate need to maintain legal and operational records. Data-subject rights are recognized under the Philippine Data Privacy Act. 
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">10. Children and Restricted Use</h3>
              <p>
                SabiCard is not intended for unlawful, deceptive, harmful, or unauthorized uses. Users are responsible for ensuring they have the legal right to publish personal data, business information, and third-party materials uploaded to the platform.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">11. Updates to this Policy</h3>
              <p>
                We may revise this Privacy Policy at any time. Updated versions become effective upon posting on the platform or associated pages. Continued use of SabiCard after changes are posted constitutes your acknowledgment of the revised policy, to the extent allowed by law.
              </p>
            </div>
          </div>
        </PolicyModal>
      ) : null}

      {openModal === "terms" ? (
        <PolicyModal
          title="Terms of Use"
          onClose={closeModal}
        >
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              These Terms of Use govern access to and use of SabiCard, including its website, digital card profiles, NFC card activation features, lead capture tools, analytics, subscription plans, business account features, and related services. Philippine e-commerce guidance expects clear disclosures and online terms, and these Terms are intended to serve that function for SabiCard.
            </p>

            <div>
              <h3 className="font-semibold mb-1">1. Acceptance of Terms</h3>
              <p>
                By creating an account, purchasing a plan, activating a card, using the platform, or accessing any public SabiCard profile, you agree to these Terms and our Privacy Policy.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">2. Eligibility and Account Responsibility</h3>
              <p>
                You must provide accurate and current information and are responsible for all activities under your account. You are responsible for maintaining the confidentiality of your credentials and for all actions taken through your login, whether or not authorized by you, unless applicable law provides otherwise.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">3. Service Description</h3>
              <p>
                SabiCard provides digital profile pages, NFC card activation, QR-based sharing, lead capture, analytics, paid plan upgrades, and business team-management tools. Features may vary by plan, account type, region, device compatibility, and technical availability.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">4. Plans, Billing, and Renewals</h3>
              <p>
                Free, Pro, and Business plans may have different limitations and features. Unless otherwise stated on the platform at the time of purchase, paid access currently operates as a one-time payment for a stated billing period. SabiCard may change pricing, feature sets, limits, or availability at any time before a new purchase or renewal.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">5. NFC Cards and Activation</h3>
              <p>
                Activation of an NFC card links that card to an account, profile, organization, or business inventory depending on the plan and platform rules. SabiCard may refuse, suspend, reverse, block, or reassign activation where we reasonably suspect fraud, misuse, unauthorized transfer, duplicate registration, security risk, policy violation, or payment irregularity.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">6. Business Accounts</h3>
              <p>
                Business plans may allow organization branding, centralized inventory, team invitations, role-based card assignment, and organization-managed member accounts. Business owners and authorized administrators are responsible for managing invited users, assigned cards, internal permissions, and organization content. SabiCard may treat actions taken by authorized business administrators as actions of the organization.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">7. User Content and Conduct</h3>
              <p>
                You must not use SabiCard for unlawful, fraudulent, deceptive, defamatory, infringing, abusive, harmful, misleading, spam-related, or unauthorized commercial activity. You represent that you own or have the right to use all content, trademarks, images, links, and data you upload or publish. SabiCard may remove, restrict, or disable content or accounts that we believe violate these Terms, applicable law, payment-provider rules, or platform safety standards.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">8. Leads, Analytics, and Availability</h3>
              <p>
                Lead capture and analytics are provided on an “as available” basis. SabiCard does not guarantee the accuracy, completeness, delivery, conversion, or business value of leads, analytics, tap counts, or visitor actions. Temporary outages, delays, filtering, browser/device behavior, and third-party infrastructure may affect results.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">9. Intellectual Property</h3>
              <p>
                SabiCard and all related software, designs, interfaces, workflows, branding, text, graphics, and platform logic remain the property of SabiCard or its licensors. Except as expressly allowed, you may not copy, distribute, resell, reverse engineer, modify, or create derivative works from the service.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">10. Suspension and Termination</h3>
              <p>
                SabiCard may suspend, block, restrict, terminate, or investigate accounts, cards, organizations, or transactions at any time where we reasonably determine there is policy abuse, security risk, fraudulent activity, payment dispute, legal exposure, platform misuse, or conduct harmful to SabiCard, its users, or third parties.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">11. Disclaimers</h3>
              <p>
                The service is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, SabiCard disclaims warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted access, error-free performance, data preservation, compatibility, and expected commercial outcomes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">12. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, SabiCard will not be liable for indirect, incidental, special, exemplary, punitive, or consequential damages, or for loss of profits, revenue, goodwill, data, customers, opportunities, or business interruption arising from use of or inability to use the service. Where liability cannot be excluded, SabiCard’s aggregate liability shall not exceed the amount paid by the user to SabiCard for the specific service period directly giving rise to the claim.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">13. Indemnity</h3>
              <p>
                You agree to defend, indemnify, and hold harmless SabiCard, its owners, affiliates, staff, and service providers from claims, losses, liabilities, damages, penalties, costs, and expenses arising from your content, your misuse of the platform, your violation of these Terms, your infringement of third-party rights, or your violation of law.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">14. Governing Law and Venue</h3>
              <p>
                These Terms are governed by the laws of the Republic of the Philippines. Any dispute arising out of or relating to SabiCard shall be subject to the applicable laws, rules, and competent courts of the Philippines, unless another dispute process is required by mandatory law.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">15. Changes to Terms</h3>
              <p>
                We may modify these Terms at any time by posting the revised version on the platform. Continued use of SabiCard after the effective date of the revised Terms constitutes acceptance of the changes, to the extent permitted by law. 
              </p>
            </div>
          </div>
        </PolicyModal>
      ) : null}
    </div>
  );
}
type PolicyModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

function PolicyModal({ title, onClose, children }: PolicyModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
