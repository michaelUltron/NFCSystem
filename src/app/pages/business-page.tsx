import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  ensureMyBusinessOrganization,
  getMyAccountManagementStatus,
  getMyBusinessOverview,
  type BusinessOverviewRow,
} from "../lib/business-service";
import { Building2, Users, CreditCard, MousePointerClick } from "lucide-react";

export function BusinessPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<BusinessOverviewRow | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const status = await getMyAccountManagementStatus();

        if (!status?.is_business_owner) {
          throw new Error("You do not have access to Business Management.");
        }

        await ensureMyBusinessOrganization();
        const data = await getMyBusinessOverview();
        setOverview(data);
      } catch (err: any) {
        setError(err.message || "Failed to load business overview.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Business Management</h1>
            <p className="text-gray-600">
              Manage your company branding, team cards, and shared business tools.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading business overview...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : !overview ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>No business data found.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-semibold">
                    {overview.organization_name}
                  </h2>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Primary Color:</strong>{" "}
                    {overview.brand_primary_color || "Not set"}
                  </p>
                  <p>
                    <strong>Secondary Color:</strong>{" "}
                    {overview.brand_secondary_color || "Not set"}
                  </p>
                  <p>
                    <strong>Tagline:</strong>{" "}
                    {overview.brand_tagline || "Not set"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm text-gray-500">Team Members</p>
                  </div>
                  <p className="text-3xl font-bold">{overview.total_members}</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm text-gray-500">Total Cards</p>
                  </div>
                  <p className="text-3xl font-bold">{overview.total_cards}</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-500">Active Cards</p>
                  </div>
                  <p className="text-3xl font-bold">{overview.active_cards}</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointerClick className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm text-gray-500">Assigned Cards</p>
                  </div>
                  <p className="text-3xl font-bold">{overview.assigned_cards}</p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}