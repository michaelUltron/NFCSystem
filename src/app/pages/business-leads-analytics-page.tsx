import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  getMyBusinessLeads,
  getMyBusinessAnalytics,
  getMyBusinessLeadsAnalyticsSummary,
  type BusinessLeadRow,
  type BusinessAnalyticsRow,
  type BusinessLeadsAnalyticsSummary,
} from "../lib/business-service";
import {
  Users,
  BarChart3,
  MousePointerClick,
  Eye,
  RefreshCw,
} from "lucide-react";

type ActiveTab = "leads" | "analytics";

export function BusinessLeadsAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ActiveTab>("leads");

  const [leads, setLeads] = useState<BusinessLeadRow[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalyticsRow[]>([]);
  const [summary, setSummary] = useState<BusinessLeadsAnalyticsSummary | null>(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [leadsData, analyticsData, summaryData] = await Promise.all([
        getMyBusinessLeads(),
        getMyBusinessAnalytics(),
        getMyBusinessLeadsAnalyticsSummary(),
      ]);

      setLeads(leadsData);
      setAnalytics(analyticsData);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message || "Failed to load business leads and analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;

    return leads.filter((lead) =>
      [
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.message,
        lead.owner_full_name,
        lead.owner_email,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    );
  }, [leads, search]);

  const filteredAnalytics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return analytics;

    return analytics.filter((item) =>
      [
        item.event_type,
        item.page_path,
        item.card_uid,
        item.visitor_identifier,
        item.owner_full_name,
        item.owner_email,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    );
  }, [analytics, search]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Business Leads & Analytics</h1>
              <p className="text-gray-600">
                View shared organization leads and engagement analytics.
              </p>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className="w-4 h-4" />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <p className="text-sm text-gray-500">Total Leads</p>
              </div>
              <p className="text-3xl font-bold">{summary?.total_leads ?? 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <p className="text-sm text-gray-500">Total Events</p>
              </div>
              <p className="text-3xl font-bold">{summary?.total_analytics ?? 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-500">Profile Views</p>
              </div>
              <p className="text-3xl font-bold">{summary?.total_profile_views ?? 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick className="w-5 h-5 text-indigo-600" />
                <p className="text-sm text-gray-500">Card Taps</p>
              </div>
              <p className="text-3xl font-bold">{summary?.total_card_taps ?? 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab("leads")}
                  className={`rounded-lg px-4 py-2 font-medium ${
                    tab === "leads"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Leads
                </button>

                <button
                  type="button"
                  onClick={() => setTab("analytics")}
                  className={`rounded-lg px-4 py-2 font-medium ${
                    tab === "analytics"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Analytics
                </button>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === "leads"
                    ? "Search leads..."
                    : "Search analytics..."
                }
                className="w-full md:w-80 rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {loading ? (
              <p className="text-gray-500">Loading data...</p>
            ) : tab === "leads" ? (
              filteredLeads.length === 0 ? (
                <p className="text-gray-500">No leads found.</p>
              ) : (
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border rounded-xl p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-lg">
                            {lead.name || "Unnamed Lead"}
                          </p>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p><strong>Email:</strong> {lead.email || "N/A"}</p>
                            <p><strong>Phone:</strong> {lead.phone || "N/A"}</p>
                            <p><strong>Company:</strong> {lead.company || "N/A"}</p>
                            <p><strong>Message:</strong> {lead.message || "N/A"}</p>
                            <p>
                              <strong>Card Owner:</strong>{" "}
                              {lead.owner_full_name || lead.owner_email || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500">
                          {lead.created_at
                            ? new Date(lead.created_at).toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filteredAnalytics.length === 0 ? (
              <p className="text-gray-500">No analytics found.</p>
            ) : (
              <div className="space-y-4">
                {filteredAnalytics.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-lg capitalize">
                          {item.event_type || "Unknown event"}
                        </p>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p><strong>Page:</strong> {item.page_path || "N/A"}</p>
                          <p><strong>Card UID:</strong> {item.card_uid || "N/A"}</p>
                          <p>
                            <strong>Visitor:</strong>{" "}
                            {item.visitor_identifier || "N/A"}
                          </p>
                          <p>
                            <strong>Card Owner:</strong>{" "}
                            {item.owner_full_name || item.owner_email || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}