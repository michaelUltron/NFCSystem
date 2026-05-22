import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Eye,
  LoaderCircle,
  MousePointerClick,
  Package,
  UserRound,
} from "lucide-react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { supabase } from "../lib/supabase";
import { getMyCards, type CardRow } from "../lib/card-service";
import { getMyProfile, type ProfileRow } from "../lib/profile-service";
import {
  getOnboardingProgress,
  hasActiveCard,
  hasContactDetails,
  isProfileReady,
} from "../lib/onboarding";

type Step = {
  title: string;
  description: string;
  complete: boolean;
  href: string;
  cta: string;
  icon: typeof UserRound;
};

export function OnboardingPage() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login?next=/onboarding", { replace: true });
          return;
        }

        const [profileData, cardData] = await Promise.all([
          getMyProfile(),
          getMyCards(),
        ]);

        setProfile(profileData);
        setCards(cardData);
      } catch (err: any) {
        setError(err.message || "Failed to load onboarding.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const progress = useMemo(
    () => getOnboardingProgress(profile, cards),
    [cards, profile]
  );

  const activeCard = useMemo(() => cards.find((card) => card.status === "active"), [
    cards,
  ]);

  const publicCardPath = profile?.username ? `/card/${profile.username}` : "";

  const steps: Step[] = [
    {
      title: "Create your public card",
      description:
        "Add your profile photo, name, and public username so your SabiCard has a shareable identity.",
      complete: isProfileReady(profile),
      href: "/profile?onboarding=1",
      cta: isProfileReady(profile) ? "Review profile" : "Start profile setup",
      icon: UserRound,
    },
    {
      title: "Add contact details",
      description:
        "Fill in your role, company, phone, website, social links, and optional location pin.",
      complete: hasContactDetails(profile),
      href: "/profile?onboarding=1",
      cta: hasContactDetails(profile) ? "Edit details" : "Add details",
      icon: BadgeCheck,
    },
    {
      title: "Connect an NFC card",
      description:
        "Activate a physical card when you have its QR or UID, or place a card order if you need one.",
      complete: hasActiveCard(cards),
      href: activeCard ? "/dashboard" : "/activate",
      cta: activeCard ? "Manage card" : "Activate card",
      icon: CreditCard,
    },
  ];

  const readyForDashboard = progress.completed === progress.total;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-md">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-2 text-sm font-semibold text-indigo-600">
                    Account onboarding
                  </p>
                  <h1 className="mb-3 text-3xl font-bold">
                    Get your SabiCard ready to share
                  </h1>
                  <p className="text-gray-600">
                    Complete the essentials, then preview your public card and
                    start using your NFC card in the real world.
                  </p>
                </div>

                <div className="w-full rounded-lg border bg-gray-50 p-4 lg:w-72">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Setup progress
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    {readyForDashboard
                      ? "Your account is ready."
                      : `${progress.percent}% complete`}
                  </p>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="flex items-center gap-3 text-gray-600">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Loading onboarding...
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {steps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.title}
                        className="rounded-xl border bg-white p-5 shadow-md"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Icon className="h-5 w-5" />
                          </div>
                          {step.complete ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                              Step {index + 1}
                            </span>
                          )}
                        </div>

                        <h2 className="mb-2 text-lg font-semibold">
                          {step.title}
                        </h2>
                        <p className="mb-5 text-sm text-gray-600">
                          {step.description}
                        </p>

                        <Link
                          to={step.href}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                            step.complete
                              ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          {step.cta}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <Link
                    to={publicCardPath || "/profile?onboarding=1"}
                    target={publicCardPath ? "_blank" : undefined}
                    className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-md hover:bg-gray-50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Preview public card</h3>
                      <p className="text-sm text-gray-600">
                        See what visitors will open.
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/order"
                    className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-md hover:bg-gray-50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Order physical cards</h3>
                      <p className="text-sm text-gray-600">
                        Get NFC cards shipped to you.
                      </p>
                    </div>
                  </Link>

                  <Link
                    to={readyForDashboard ? "/dashboard" : "/profile?onboarding=1"}
                    className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-md hover:bg-gray-50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <MousePointerClick className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {readyForDashboard ? "Go to dashboard" : "Continue setup"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {readyForDashboard
                          ? "Track cards, taps, and leads."
                          : "Finish the profile tour."}
                      </p>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
