import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { getMyLeads, type LeadRow } from "../lib/lead-service";
import {
  getMySubscription,
  getTrialFeatureAccess,
  getPlanLabel,
  type TrialFeatureAccess,
} from "../lib/subscription-service";
import { markLeadsSeen } from "../lib/notification-state";

export function LeadsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [plan, setPlan] = useState("free");
  const [allowed, setAllowed] = useState(false);
  const [access, setAccess] = useState<TrialFeatureAccess | null>(null);
    useEffect(() => {
  markLeadsSeen();
}, []);

  useEffect(() => {
    const load = async () => {
      try {
        const subscription = await getMySubscription();
        const currentPlan = subscription?.plan || "free";
        const currentAccess = getTrialFeatureAccess(subscription);

        setPlan(currentPlan);
        setAccess(currentAccess);

        if (!currentAccess.canUseLeads) {
          setAllowed(false);
          return;
        }

        setAllowed(true);

        const data = await getMyLeads();
        setLeads(data);
      } catch (error) {
        console.error("Failed to load leads:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);
  


  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Leads</h1>
            <p className="text-gray-600">
              Contacts collected from your digital card
            </p>
          </div>

          {!loading && access?.trialActive ? (
            <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
              Your Free plan lead capture trial is active for{" "}
              <strong>{access.trialDaysRemaining}</strong>{" "}
              {access.trialDaysRemaining === 1 ? "day" : "days"}.
            </div>
          ) : null}

          <div className="bg-white rounded-xl shadow-md p-6">
            {loading ? (
              <p>Loading leads...</p>
            ) : !allowed ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h2 className="font-semibold text-amber-800 mb-2">
                  Free trial ended
                </h2>
                <p className="text-sm text-amber-700">
                  Your 7-day free trial for lead capture has ended. Upgrade to
                  Pro or Business to continue collecting and viewing leads. Your
                  current plan is <strong>{getPlanLabel(plan)}</strong>.
                </p>
                <a
                  href="/plans"
                  className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  View Plans
                </a>
              </div>
            ) : leads.length === 0 ? (
              <p className="text-gray-600">No leads yet.</p>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {lead.name || "Unnamed Lead"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {lead.email || "No email"}
                        </p>
                        {lead.phone ? (
                          <p className="text-sm text-gray-600">{lead.phone}</p>
                        ) : null}
                        {lead.company ? (
                          <p className="text-sm text-gray-600">{lead.company}</p>
                        ) : null}
                        {lead.message ? (
                          <p className="text-sm text-gray-700 mt-2">
                            {lead.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-xs text-gray-500">
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleString()
                          : ""}
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
