import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  User,
  BarChart3,
  Users,
  Settings,
  Shield,
  CreditCard,
  Package,
  Building2,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import sabiLogo from "../assets/sabi-logo.png";
import {
  getMySubscription,
  getTrialFeatureAccess,
} from "../lib/subscription-service";
import { checkIsAdmin } from "../lib/admin-service";
import { supabase } from "../lib/supabase";
import { getMyAccountManagementStatus } from "../lib/business-service";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: any;
  visible: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
  visible: boolean;
};

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [plan, setPlan] = useState("free");
  const [leadAccess, setLeadAccess] = useState(false);
  const [analyticsAccess, setAnalyticsAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(true);
  const [managedByOrganization, setManagedByOrganization] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setIsAuthenticated(false);
          setPlan("free");
          setLeadAccess(false);
          setAnalyticsAccess(false);
          setIsAdmin(false);
          setIsBusinessOwner(false);
          setCanManageBilling(true);
          setManagedByOrganization(false);
          setAuthChecked(true);
          return;
        }

        setIsAuthenticated(true);

        const [subscription, admin, accountStatus] = await Promise.all([
          getMySubscription(),
          checkIsAdmin(),
          getMyAccountManagementStatus(),
        ]);

        if (!mounted) return;

        setPlan(subscription?.plan || "free");
        const access = getTrialFeatureAccess(subscription);
        setLeadAccess(access.canUseLeads);
        setAnalyticsAccess(access.canUseAnalytics);
        setIsAdmin(Boolean(admin));
        setIsBusinessOwner(Boolean(accountStatus?.is_business_owner));
        setCanManageBilling(
          accountStatus?.can_manage_billing === false ? false : true
        );
        setManagedByOrganization(
          Boolean(accountStatus?.managed_by_organization)
        );
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
        setPlan("free");
        setLeadAccess(false);
        setAnalyticsAccess(false);
        setIsAdmin(false);
        setIsBusinessOwner(false);
        setCanManageBilling(true);
        setManagedByOrganization(false);
      } finally {
        if (mounted) {
          setAuthChecked(true);
        }
      }
    };

    loadAccess();

    return () => {
      mounted = false;
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    if (href === "/admin/orders") return location.pathname === "/admin/orders";
    if (href === "/business") return location.pathname === "/business";
    if (href === "/business/cards")
      return location.pathname === "/business/cards";
    if (href === "/business-leads-analytics")
      return location.pathname === "/business-leads-analytics";
    return location.pathname === href;
  };

  const sections = useMemo<NavSection[]>(() => {
    const generalItems: NavItem[] = [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        visible: true,
      },
      {
        label: "My Card",
        href: "/profile",
        icon: User,
        visible: true,
      },
      {
        label: "Leads",
        href: "/leads",
        icon: Users,
        visible: leadAccess,
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        visible: analyticsAccess,
      },
    ];

    const businessItems: NavItem[] = [
      {
        label: "Business Overview",
        href: "/business",
        icon: Building2,
        visible: isBusinessOwner,
      },
      {
        label: "Business Cards",
        href: "/business/cards",
        icon: CreditCard,
        visible: isBusinessOwner,
      },
      {
        label: "Business Leads & Analytics",
        href: "/business-leads-analytics",
        icon: BarChart3,
        visible: isBusinessOwner,
      },
    ];

    const adminItems: NavItem[] = [
      {
        label: "Admin",
        href: "/admin",
        icon: Shield,
        visible: isAdmin,
      },
      {
        label: "Admin Orders",
        href: "/admin/orders",
        icon: Package,
        visible: isAdmin,
      },
    ];

    const accountItems: NavItem[] = [
      {
        label: "Plans",
        href: "/plans",
        icon: CreditCard,
        visible: !managedByOrganization || canManageBilling,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        visible: true,
      },
      {
        label: "Help",
        href: "/help",
        icon: HelpCircle,
        visible: true,
      },
    ];

    return [
      {
        title: "General",
        items: generalItems,
        visible: generalItems.some((item) => item.visible),
      },
      {
        title: "Business / Organization",
        items: businessItems,
        visible: businessItems.some((item) => item.visible),
      },
      {
        title: "Admin",
        items: adminItems,
        visible: adminItems.some((item) => item.visible),
      },
      {
        title: "Account",
        items: accountItems,
        visible: accountItems.some((item) => item.visible),
      },
    ];
  }, [
    plan,
    leadAccess,
    analyticsAccess,
    isAdmin,
    isBusinessOwner,
    managedByOrganization,
    canManageBilling,
  ]);

  if (!authChecked || !isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose?.();
    navigate("/login");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static z-50 top-0 left-0 h-full w-64 bg-white border-r transform transition-transform duration-200 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <img
              src={sabiLogo}
              alt="SabiCard"
              className="w-8 h-8 object-contain"
            />
            <span className="font-semibold text-xl">SabiCard</span>
          </Link>
        </div>

        <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
          {sections
            .filter((section) => section.visible)
            .map((section) => (
              <div key={section.title}>
                <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {section.title}
                </p>

                <div className="space-y-2">
                  {section.items
                    .filter((item) => item.visible)
                    .map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            active
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
        </nav>

        <div className="border-t p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
