import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock3, Compass, Smartphone } from "lucide-react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { getMyTapHistory } from "../lib/analytics-service";
import {
  getMySubscription,
  getTrialFeatureAccess,
  getPlanLabel,
  type TrialFeatureAccess,
} from "../lib/subscription-service";
import { markTapsSeen } from "../lib/notification-state";

const CHART_COLORS = ["#4f46e5", "#0f766e", "#ea580c", "#be123c", "#7c3aed"];
const DAY_MS = 86_400_000;

export function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taps, setTaps] = useState<any[]>([]);
  const [plan, setPlan] = useState("free");
  const [allowed, setAllowed] = useState(false);
  const [access, setAccess] = useState<TrialFeatureAccess | null>(null);

  useEffect(() => {
    markTapsSeen();

    const load = async () => {
      try {
        const subscription = await getMySubscription();
        const currentPlan = subscription?.plan || "free";
        const currentAccess = getTrialFeatureAccess(subscription);

        setPlan(currentPlan);
        setAccess(currentAccess);

        if (!currentAccess.canUseAnalytics) {
          setAllowed(false);
          return;
        }

        setAllowed(true);

        const data = await getMyTapHistory();
        setTaps(data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalTaps = taps.length;

  const tapTrend = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getTime() - (6 - index) * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        day: date.toLocaleDateString(undefined, { weekday: "short" }),
        taps: 0,
      };
    });
    const counts = new Map(days.map((day) => [day.key, day]));

    for (const tap of taps) {
      if (!tap.created_at) continue;
      const key = new Date(tap.created_at).toISOString().slice(0, 10);
      const item = counts.get(key);
      if (item) item.taps += 1;
    }

    return days;
  }, [taps]);

  const topDevices = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tap of taps) {
      const key = tap.device || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [taps]);

  const deviceChartData = useMemo(
    () =>
      topDevices.slice(0, 5).map(([name, value]) => ({
        name,
        value,
      })),
    [topDevices]
  );

  const browserChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tap of taps) {
      const key = tap.browser || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([browser, count]) => ({ browser, count }));
  }, [taps]);

  const topReferrer = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tap of taps) {
      const key = tap.referrer || "Direct";
      counts[key] = (counts[key] || 0) + 1;
    }
    return (
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "No data yet"
    );
  }, [taps]);

  const busiestDay = useMemo(() => {
    const best = [...tapTrend].sort((a, b) => b.taps - a.taps)[0];
    return best && best.taps > 0 ? `${best.day} (${best.taps})` : "No data yet";
  }, [tapTrend]);

  const uniqueDevices = topDevices.length;
  const hasChartData = totalTaps > 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-gray-600">Track taps on your SabiCard</p>
          </div>

          {!loading && !allowed ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h2 className="font-semibold text-amber-800 mb-2">
                  Upgrade required
                </h2>
                <p className="text-sm text-amber-700">
                  {access?.trialEnded
                    ? "Your 7-day free trial for analytics has ended. Upgrade to Pro or Business to unlock it again."
                    : "Analytics are available during the Free trial and on Pro or Business plans."}{" "}
                  Your current plan is <strong>{getPlanLabel(plan)}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <>
              {!loading && access?.trialActive ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 mb-8">
                  <p className="text-sm text-indigo-800">
                    Your Free plan analytics trial is active for{" "}
                    <strong>{access.trialDaysRemaining}</strong>{" "}
                    {access.trialDaysRemaining === 1 ? "day" : "days"}.
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="text-sm font-semibold text-gray-600">
                      Total Taps
                    </h2>
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-3xl font-bold">
                    {loading ? "..." : totalTaps}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="text-sm font-semibold text-gray-600">
                      Device Types
                    </h2>
                    <Smartphone className="w-5 h-5 text-teal-700" />
                  </div>
                  <p className="text-3xl font-bold">
                    {loading ? "..." : uniqueDevices}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="text-sm font-semibold text-gray-600">
                      Busiest Day
                    </h2>
                    <Clock3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold">{loading ? "..." : busiestDay}</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="text-sm font-semibold text-gray-600">
                      Top Source
                    </h2>
                    <Compass className="w-5 h-5 text-rose-700" />
                  </div>
                  <p className="text-lg font-semibold truncate" title={topReferrer}>
                    {loading ? "..." : topReferrer}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Tap Trend</h2>
                    <p className="text-sm text-gray-500">
                      Last 7 days of card engagement
                    </p>
                  </div>

                  <div className="h-72">
                    {hasChartData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={tapTrend}>
                          <defs>
                            <linearGradient id="tapFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="taps"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            fill="url(#tapFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChartState />
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Device Mix</h2>
                    <p className="text-sm text-gray-500">
                      Phones and computers opening your card
                    </p>
                  </div>

                  <div className="h-72">
                    {deviceChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={54}
                            outerRadius={88}
                            paddingAngle={3}
                          >
                            {deviceChartData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChartState />
                    )}
                  </div>

                  <div className="space-y-2">
                    {deviceChartData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Browser Breakdown</h2>
                  <p className="text-sm text-gray-500">
                    Understand where your audience opens your card
                  </p>
                </div>

                <div className="h-72">
                  {browserChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={browserChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="browser" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState />
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Taps</h2>

                {loading ? (
                  <p>Loading analytics...</p>
                ) : taps.length === 0 ? (
                  <p className="text-gray-600">No taps recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {taps.map((tap) => (
                      <div key={tap.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 text-sm text-gray-700">
                            <p>
                              <strong>Card UID:</strong>{" "}
                              {tap.cards?.card_uid || "Unknown"}
                            </p>
                            <p>
                              <strong>Device:</strong> {tap.device || "Unknown"}
                            </p>
                            <p>
                              <strong>Browser:</strong>{" "}
                              {tap.browser || "Unknown"}
                            </p>
                            <p>
                              <strong>Referrer:</strong>{" "}
                              {tap.referrer || "Direct"}
                            </p>
                          </div>

                          <div className="text-xs text-gray-500">
                            {tap.created_at
                              ? new Date(tap.created_at).toLocaleString()
                              : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="h-full rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
      No analytics data yet.
    </div>
  );
}
