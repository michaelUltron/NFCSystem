import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { getMyTapHistory } from "../lib/analytics-service";
import {
  getMySubscription,
  canUseAnalytics,
  getPlanLabel,
} from "../lib/subscription-service";

export function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taps, setTaps] = useState<any[]>([]);
  const [plan, setPlan] = useState("free");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const subscription = await getMySubscription();
        const currentPlan = subscription?.plan || "free";

        setPlan(currentPlan);

        if (!canUseAnalytics(currentPlan)) {
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

  const topDevices = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tap of taps) {
      const key = tap.device || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [taps]);

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
                  Analytics are available on Pro and Business plans. Your current
                  plan is <strong>{getPlanLabel(plan)}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-2">Total Taps</h2>
                  <p className="text-3xl font-bold">
                    {loading ? "..." : totalTaps}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-2">Top Devices</h2>
                  {loading ? (
                    <p className="text-gray-600">Loading...</p>
                  ) : topDevices.length === 0 ? (
                    <p className="text-gray-600">No data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {topDevices.slice(0, 5).map(([device, count]) => (
                        <div
                          key={device}
                          className="flex justify-between text-sm"
                        >
                          <span>{device}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
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