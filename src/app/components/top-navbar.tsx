import {
  Bell,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Menu,
  User,
  Settings,
  LogOut,
  Mail,
  Users,
  Package,
  Smartphone,
  TimerReset,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { getMyProfile, type ProfileRow } from "../lib/profile-service";
import {
  getMyPendingOrganizationInvites,
  getMyAccountManagementStatus,
  getMyBusinessLeadsAnalyticsSummary,
  type PendingOrganizationInviteRow,
} from "../lib/business-service";
import { getMyLeadCount } from "../lib/lead-service";
import { getMyCards, type CardRow } from "../lib/card-service";
import { getMyTapHistory, type CardTapRow } from "../lib/analytics-service";
import { checkIsAdmin } from "../lib/admin-service";
import {
  getMySubscription,
  getPlanLabel,
  getTrialFeatureAccess,
  type SubscriptionRow,
  type TrialFeatureAccess,
} from "../lib/subscription-service";
import {
  getLeadsLastSeenAt,
  getAdminOrdersLastSeenAt,
  getCardsLastSeenAt,
  getTapsLastSeenAt,
} from "../lib/notification-state";

interface TopNavbarProps {
  onMenuClick: () => void;
}

type AdminOrderNotification = {
  id: string;
  created_at: string | null;
};

type NotificationItem =
  | {
      id: string;
      type: "invite";
      title: string;
      description: string;
      href: string;
      createdAt?: string | null;
    }
  | {
      id: string;
      type: "lead";
      title: string;
      description: string;
      href: string;
      createdAt?: string | null;
    }
  | {
      id: string;
      type: "order";
      title: string;
      description: string;
      href: string;
      createdAt?: string | null;
    }
  | {
      id: string;
      type: "tap" | "card" | "trial" | "plan";
      title: string;
      description: string;
      href: string;
      createdAt?: string | null;
    };

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingOrganizationInviteRow[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [businessLeadCount, setBusinessLeadCount] = useState(0);
  const [adminOrders, setAdminOrders] = useState<AdminOrderNotification[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [tapHistory, setTapHistory] = useState<CardTapRow[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [trialAccess, setTrialAccess] = useState<TrialFeatureAccess | null>(null);

  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const myProfile = await getMyProfile();
        setProfile(myProfile);

        const [adminResult, accountStatus] = await Promise.all([
          checkIsAdmin().catch(() => false),
          getMyAccountManagementStatus().catch(() => null),
        ]);

        const adminValue = Boolean(adminResult);
        const businessOwnerValue = Boolean(accountStatus?.is_business_owner);

        setIsAdmin(adminValue);
        setIsBusinessOwner(businessOwnerValue);

        const invitePromise = getMyPendingOrganizationInvites().catch(() => []);
        const leadPromise = getMyLeadCount().catch(() => 0);
        const cardsPromise = getMyCards().catch(() => []);
        const tapsPromise = getMyTapHistory().catch(() => []);
        const subscriptionPromise = getMySubscription().catch(() => null);
        const businessLeadPromise = businessOwnerValue
          ? getMyBusinessLeadsAnalyticsSummary().catch(() => null)
          : Promise.resolve(null);

        const adminOrdersPromise = adminValue
          ? supabase
              .from("orders")
              .select("id, created_at")
              .order("created_at", { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [], error: null } as any);

        const [
          invites,
          personalLeadCount,
          businessSummary,
          adminOrdersResult,
          cardRows,
          tapRows,
          subscriptionRow,
        ] =
          await Promise.all([
            invitePromise,
            leadPromise,
            businessLeadPromise,
            adminOrdersPromise,
            cardsPromise,
            tapsPromise,
            subscriptionPromise,
          ]);

        setPendingInvites(invites);
        setLeadCount(personalLeadCount);
        setBusinessLeadCount(businessSummary?.total_leads ?? 0);
        setCards(cardRows);
        setTapHistory(tapRows as CardTapRow[]);
        setSubscription(subscriptionRow);
        setTrialAccess(getTrialFeatureAccess(subscriptionRow));

        if (adminOrdersResult?.error) {
          setAdminOrders([]);
        } else {
          setAdminOrders((adminOrdersResult?.data ?? []) as AdminOrderNotification[]);
        }
      } finally {
        setLoadingNotifications(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initials = useMemo(() => {
    const source =
      profile?.full_name?.trim() ||
      profile?.username?.trim() ||
      profile?.email?.trim() ||
      "SC";

    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile]);

  const unreadPersonalLeadCount = useMemo(() => {
    const lastSeen = getLeadsLastSeenAt();
    if (!lastSeen) return leadCount;
    return leadCount > 0 ? leadCount : 0;
  }, [leadCount]);

  const unreadBusinessLeadCount = useMemo(() => {
    const lastSeen = getLeadsLastSeenAt();
    if (!lastSeen) return businessLeadCount;
    return businessLeadCount > 0 ? businessLeadCount : 0;
  }, [businessLeadCount]);

  const unreadAdminOrderCount = useMemo(() => {
    const lastSeen = getAdminOrdersLastSeenAt();
    if (!lastSeen) return adminOrders.length;

    const lastSeenTime = new Date(lastSeen).getTime();

    return adminOrders.filter((order) => {
      if (!order.created_at) return false;
      return new Date(order.created_at).getTime() > lastSeenTime;
    }).length;
  }, [adminOrders]);

  const unreadTapCount = useMemo(() => {
    const lastSeen = getTapsLastSeenAt();
    if (!lastSeen) return tapHistory.length;

    const lastSeenTime = new Date(lastSeen).getTime();
    return tapHistory.filter((tap) => {
      if (!tap.created_at) return false;
      return new Date(tap.created_at).getTime() > lastSeenTime;
    }).length;
  }, [tapHistory]);

  const newlyActivatedCards = useMemo(() => {
    const activeCards = cards.filter((card) => card.status === "active");
    const lastSeen = getCardsLastSeenAt();

    if (!lastSeen) {
      return activeCards.slice(0, 3);
    }

    const lastSeenTime = new Date(lastSeen).getTime();
    return activeCards
      .filter((card) => {
        if (!card.activation_date) return false;
        return new Date(card.activation_date).getTime() > lastSeenTime;
      })
      .slice(0, 3);
  }, [cards]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    pendingInvites.forEach((invite) => {
      items.push({
        id: `invite-${invite.id}`,
        type: "invite",
        title: "Organization Invite",
        description: `You were invited to join ${invite.organization_name}.`,
        href: "/organization-invites",
        createdAt: invite.created_at,
      });
    });

    if (isBusinessOwner && unreadBusinessLeadCount > 0) {
      items.push({
        id: "business-leads",
        type: "lead",
        title: "Business Leads",
        description: `Your organization has ${unreadBusinessLeadCount} lead${
          unreadBusinessLeadCount === 1 ? "" : "s"
        }.`,
        href: "/business-leads-analytics",
      });
    } else if (!isBusinessOwner && unreadPersonalLeadCount > 0) {
      items.push({
        id: "personal-leads",
        type: "lead",
        title: "New Leads",
        description: `You have ${unreadPersonalLeadCount} captured lead${
          unreadPersonalLeadCount === 1 ? "" : "s"
        }.`,
        href: "/leads",
      });
    }

    if (isAdmin && unreadAdminOrderCount > 0) {
      items.push({
        id: "admin-orders",
        type: "order",
        title: "Admin Orders",
        description: `You have ${unreadAdminOrderCount} new order${
          unreadAdminOrderCount === 1 ? "" : "s"
        } to review.`,
        href: "/admin/orders",
        createdAt: adminOrders[0]?.created_at ?? null,
      });
    }

    if (unreadTapCount > 0) {
      items.push({
        id: "card-taps",
        type: "tap",
        title: "Card Tapped",
        description: `Your card was tapped ${unreadTapCount} time${
          unreadTapCount === 1 ? "" : "s"
        } recently.`,
        href: "/analytics",
        createdAt: tapHistory[0]?.created_at ?? null,
      });
    }

    newlyActivatedCards.forEach((card) => {
      items.push({
        id: `card-activated-${card.id}`,
        type: "card",
        title: "Card Activated",
        description: `${card.card_uid} is now active on your account.`,
        href: "/dashboard",
        createdAt: card.activation_date,
      });
    });

    if (trialAccess?.trialActive && trialAccess.trialDaysRemaining <= 2) {
      items.push({
        id: "trial-ending",
        type: "trial",
        title: "Trial Ending Soon",
        description: `Your free trial for premium features ends in ${
          trialAccess.trialDaysRemaining
        } ${trialAccess.trialDaysRemaining === 1 ? "day" : "days"}.`,
        href: "/plans",
        createdAt: trialAccess.trialEndsAt,
      });
    }

    if (trialAccess?.trialEnded) {
      items.push({
        id: "trial-expired",
        type: "trial",
        title: "Trial Expired",
        description:
          "Your free trial for lead capture, themes, and branding tools has ended.",
        href: "/plans",
        createdAt: trialAccess.trialEndsAt,
      });
    }

    if (subscription) {
      items.push({
        id: "plan-status",
        type: "plan",
        title: "Plan Status",
        description: `${getPlanLabel(subscription.plan)} plan is ${
          subscription.status || "active"
        }.`,
        href: "/plans",
        createdAt: subscription.current_period_end,
      });
    }

    return items;
  }, [
    pendingInvites,
    unreadPersonalLeadCount,
    unreadBusinessLeadCount,
    unreadAdminOrderCount,
    isAdmin,
    isBusinessOwner,
    adminOrders,
    unreadTapCount,
    tapHistory,
    newlyActivatedCards,
    trialAccess,
    subscription,
  ]);

  const notificationCount = notifications.filter((item) => item.type !== "plan")
    .length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const renderNotificationIcon = (type: NotificationItem["type"]) => {
    if (type === "invite") {
      return <Mail className="w-4 h-4 text-indigo-600" />;
    }

    if (type === "lead") {
      return <Users className="w-4 h-4 text-green-600" />;
    }

    if (type === "order") {
      return <Package className="w-4 h-4 text-amber-600" />;
    }

    if (type === "tap") {
      return <BarChart3 className="w-4 h-4 text-sky-600" />;
    }

    if (type === "card") {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }

    if (type === "trial") {
      return <TimerReset className="w-4 h-4 text-orange-600" />;
    }

    return <CreditCard className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative rounded-full p-1 hover:bg-gray-100"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {notificationCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-88 max-w-[90vw] bg-white rounded-lg shadow-lg border py-2 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="font-semibold text-gray-800">Notifications</p>
                </div>

                {loadingNotifications ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading notifications...
                  </div>
                ) : notifications.length > 0 ? (
                  <>
                    {notifications.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{renderNotificationIcon(item.type)}</div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {item.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>

                            {item.createdAt ? (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No new notifications.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                {initials}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border py-2 z-50">
                <div className="px-4 py-3 border-b">
                  <p className="font-medium text-gray-800">
                    {profile?.full_name || profile?.username || "My Account"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {profile?.email || ""}
                  </p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>

                <hr className="my-2" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
