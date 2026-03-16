import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  User,
  BarChart3,
  Users,
  Settings,
  Shield,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import sabiLogo from "../assets/sabi-logo.png";
import {
  getMySubscription,
  canUseAnalytics,
  canUseLeads,
} from "../lib/subscription-service";
import { checkIsAdmin } from "../lib/admin-service";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const [plan, setPlan] = useState("free");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadAccess = async () => {
      try {
        const [subscription, admin] = await Promise.all([
          getMySubscription(),
          checkIsAdmin(),
        ]);

        setPlan(subscription?.plan || "free");
        setIsAdmin(Boolean(admin));
      } catch {
        setPlan("free");
        setIsAdmin(false);
      }
    };

    loadAccess();
  }, []);

  const navItems = [
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
      visible: canUseLeads(plan),
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      visible: canUseAnalytics(plan),
    },
    {
      label: "Admin",
      href: "/admin",
      icon: Shield,
      visible: isAdmin,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      visible: true,
    },
    {
  label: "Plans",
  href: "/plans",
  icon: CreditCard,
  visible: true,
},
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static z-50 top-0 left-0 h-full w-64 bg-white border-r transform transition-transform duration-200 ${
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

        <nav className="p-4 space-y-2">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.href;

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
        </nav>
      </aside>
    </>
  );
}