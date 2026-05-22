import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { DashboardCard } from "../components/dashboard-card";
import {
  MousePointerClick,
  Users,
  Eye,
  TrendingUp,
  ExternalLink,
  CreditCard,
  Shield,
  ShieldOff,
  Star,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  getCurrentUserProfile,
  getMyCards,
  type CardRow,
} from "../lib/card-service";
import {
  setPrimaryCard,
  blockMyCard,
  unblockMyCard,
} from "../lib/card-management-service";
import { getMyTapCount } from "../lib/analytics-service";
import { getMyLeadCount } from "../lib/lead-service";
import {
  getMySubscription,
  canUseAnalytics,
  getTrialFeatureAccess,
  getPlanCardLimit,
  getPlanLabel,
  type TrialFeatureAccess,
} from "../lib/subscription-service";
import { markCardsSeen } from "../lib/notification-state";

export function DashboardPage() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [totalTaps, setTotalTaps] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [plan, setPlan] = useState("free");
  const [access, setAccess] = useState<TrialFeatureAccess | null>(null);

  const loadDashboard = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const [cardData, profileData, subscription] = await Promise.all([
      getMyCards(),
      getCurrentUserProfile(),
      getMySubscription(),
    ]);

    const needsCardSetup =
      !profileData?.username || !profileData?.full_name || !profileData?.avatar_url;

    if (needsCardSetup) {
      navigate("/profile?onboarding=1", { replace: true });
      return;
    }

    const currentPlan = subscription?.plan || "free";
    const currentAccess = getTrialFeatureAccess(subscription);

    setCards(cardData);
    setProfile(profileData);
    setPlan(currentPlan);
    setAccess(currentAccess);

    Promise.all([
      canUseAnalytics(currentPlan) ? getMyTapCount().catch(() => 0) : 0,
      currentAccess.canUseLeads ? getMyLeadCount().catch(() => 0) : 0,
    ]).then(([tapCount, leadCount]) => {
      setTotalTaps(tapCount);
      setTotalLeads(leadCount);
    });
  };

  useEffect(() => {
    markCardsSeen();

    const run = async () => {
      try {
        await loadDashboard();
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  const refreshCards = async () => {
    const cardData = await getMyCards();
    setCards(cardData);
  };

  const handleSetPrimary = async (cardId: string) => {
    try {
      setActionLoadingId(cardId);
      await setPrimaryCard(cardId);
      await refreshCards();
    } catch (error: any) {
      alert(error.message || "Failed to set primary card.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBlockCard = async (cardId: string) => {
    const reason = window.prompt("Reason for blocking this card? Optional.") || "";

    try {
      setActionLoadingId(cardId);
      await blockMyCard(cardId, reason);
      await refreshCards();
    } catch (error: any) {
      alert(error.message || "Failed to block card.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnblockCard = async (cardId: string) => {
    try {
      setActionLoadingId(cardId);
      await unblockMyCard(cardId);
      await refreshCards();
    } catch (error: any) {
      alert(error.message || "Failed to unblock card.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalCards = cards.length;

  const activeCards = useMemo(
    () => cards.filter((card) => card.status === "active").length,
    [cards]
  );

  const blockedCards = useMemo(
    () => cards.filter((card) => card.status === "blocked").length,
    [cards]
  );

  const primaryCard = useMemo(
    () => cards.find((card) => card.is_primary),
    [cards]
  );

  const previewUsername = profile?.username || "your-username";
  const cardLimit = getPlanCardLimit(plan);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back
                {profile?.full_name ? `, ${profile.full_name}` : ""}! Here&apos;s your
                SabiCard account overview.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              <BadgeCheck className="w-4 h-4" />
              {getPlanLabel(plan)} Plan
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardCard
                  title="My Cards"
                  value={
                    cardLimit ? `${totalCards}/${cardLimit}` : String(totalCards)
                  }
                  icon={CreditCard}
                  trend={`${activeCards} active`}
                  trendUp={true}
                />
                <DashboardCard
                  title="Blocked Cards"
                  value={String(blockedCards)}
                  icon={ShieldOff}
                  trend="Lost or secured"
                  trendUp={false}
                />
                <DashboardCard
                  title="Total Taps"
                  value={canUseAnalytics(plan) ? String(totalTaps) : "—"}
                  icon={MousePointerClick}
                  trend={
                    canUseAnalytics(plan)
                      ? "Card opens tracked"
                      : "Upgrade for analytics"
                  }
                  trendUp={canUseAnalytics(plan)}
                />
                <DashboardCard
                  title="Leads Captured"
                  value={access?.canUseLeads ? String(totalLeads) : "—"}
                  icon={Users}
                  trend={
                    access?.canUseLeads
                      ? totalLeads > 0
                        ? "New contacts collected"
                        : "No leads yet"
                      : "Upgrade for lead capture"
                  }
                  trendUp={!!access?.canUseLeads && totalLeads > 0}
                />
              </div>

              {access?.trialActive ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-8">
                  <p className="text-sm text-indigo-800">
                    Your Free plan trial includes lead capture, theme
                    customization, and personal branding tools for{" "}
                    <strong>{access.trialDaysRemaining}</strong>{" "}
                    {access.trialDaysRemaining === 1 ? "day" : "days"}.
                  </p>
                </div>
              ) : access?.trialEnded ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
                  <p className="text-sm text-amber-800">
                    Your 7-day free trial for lead capture, theme customization,
                    and better personal branding tools has ended. Upgrade to Pro
                    or Business to unlock them again.
                  </p>
                  <Link
                    to="/plans"
                    className="mt-3 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                  >
                    View Plans
                  </Link>
                </div>
              ) : plan === "free" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
                  <p className="text-sm text-amber-800">
                    You are on the Free plan. Free includes 1 active card only.
                    Upgrade to Pro to unlock multiple cards, leads, analytics, and themes.
                  </p>
                </div>
              ) : null}

              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">My Cards</h2>

                {cards.length === 0 ? (
                  <div className="border rounded-lg p-4 text-sm text-gray-600">
                    You do not have any activated cards yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card) => (
                      <div key={card.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                              {card.card_uid}
                              {card.is_primary ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                  <Star className="w-3 h-3" />
                                  Primary
                                </span>
                              ) : null}
                            </h3>
                          </div>

                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              card.status === "active"
                                ? "bg-green-100 text-green-700"
                                : card.status === "blocked"
                                ? "bg-red-100 text-red-700"
                                : card.status === "inactive"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {card.status || "unknown"}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 mb-4">
                          <p>
                            <strong>Type:</strong> {card.card_type || "standard"}
                          </p>
                          <p>
                            <strong>Activated:</strong>{" "}
                            {card.activation_date
                              ? new Date(card.activation_date).toLocaleString()
                              : "Not yet"}
                          </p>

                          {card.blocked_at ? (
                            <p>
                              <strong>Blocked:</strong>{" "}
                              {new Date(card.blocked_at).toLocaleString()}
                            </p>
                          ) : null}

                          {card.blocked_reason ? (
                            <p>
                              <strong>Reason:</strong> {card.blocked_reason}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {card.status === "active" && !card.is_primary ? (
                            <button
                              onClick={() => handleSetPrimary(card.id)}
                              disabled={actionLoadingId === card.id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-60"
                            >
                              <Star className="w-4 h-4" />
                              {actionLoadingId === card.id
                                ? "Please wait..."
                                : "Set Primary"}
                            </button>
                          ) : null}

                          {card.status === "active" ? (
                            <button
                              onClick={() => handleBlockCard(card.id)}
                              disabled={actionLoadingId === card.id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-red-700 border-red-200 hover:bg-red-50 disabled:opacity-60"
                            >
                              <ShieldOff className="w-4 h-4" />
                              {actionLoadingId === card.id ? "Please wait..." : "Block"}
                            </button>
                          ) : null}

                          {card.status === "blocked" ? (
                            <button
                              onClick={() => handleUnblockCard(card.id)}
                              disabled={actionLoadingId === card.id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-green-700 border-green-200 hover:bg-green-50 disabled:opacity-60"
                            >
                              <Shield className="w-4 h-4" />
                              {actionLoadingId === card.id
                                ? "Please wait..."
                                : "Unblock"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Edit Profile</h3>
                      <p className="text-sm text-gray-600">
                        Update your digital card
                      </p>
                    </div>
                  </Link>

                  <a
                    href={`/card/${previewUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Preview Card</h3>
                      <p className="text-sm text-gray-600">Public profile preview</p>
                    </div>
                  </a>

                  <Link
                    to="/analytics"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">View Analytics</h3>
                      <p className="text-sm text-gray-600">Detailed insights</p>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Current Setup</h2>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <strong>Name:</strong> {profile?.full_name || "Not set"}
                  </p>
                  <p>
                    <strong>Email:</strong> {profile?.email || "Not set"}
                  </p>
                  <p>
                    <strong>Company:</strong> {profile?.company || "Not set"}
                  </p>
                  <p>
                    <strong>Position:</strong> {profile?.position || "Not set"}
                  </p>
                  <p>
                    <strong>Username:</strong> {profile?.username || "Not set yet"}
                  </p>
                  <p>
                    <strong>Plan:</strong> {getPlanLabel(plan)}
                  </p>
                  <p>
                    <strong>Primary Card:</strong>{" "}
                    {primaryCard ? primaryCard.card_uid : "No primary card set"}
                  </p>
                  <p>
                    <strong>Total Taps:</strong>{" "}
                    {canUseAnalytics(plan) ? totalTaps : "Upgrade required"}
                  </p>
                  <p>
                    <strong>Total Leads:</strong>{" "}
                    {access?.canUseLeads ? totalLeads : "Upgrade required"}
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
