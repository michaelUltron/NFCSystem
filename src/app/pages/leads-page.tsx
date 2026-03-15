import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { getMyLeads, type LeadRow } from "../lib/lead-service";

export function LeadsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
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
            <p className="text-gray-600">Contacts collected from your digital card</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            {loading ? (
              <p>Loading leads...</p>
            ) : leads.length === 0 ? (
              <p className="text-gray-600">No leads yet.</p>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{lead.name || "Unnamed Lead"}</h3>
                        <p className="text-sm text-gray-600">{lead.email || "No email"}</p>
                        {lead.phone ? <p className="text-sm text-gray-600">{lead.phone}</p> : null}
                        {lead.company ? <p className="text-sm text-gray-600">{lead.company}</p> : null}
                        {lead.message ? <p className="text-sm text-gray-700 mt-2">{lead.message}</p> : null}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.created_at ? new Date(lead.created_at).toLocaleString() : ""}
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