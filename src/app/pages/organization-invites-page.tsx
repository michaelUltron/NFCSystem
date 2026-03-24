import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  getMyPendingOrganizationInvites,
  acceptMyOrganizationInvite,
  declineMyOrganizationInvite,
  type PendingOrganizationInviteRow,
} from "../lib/business-service";
import { Building2, Mail, CheckCircle2, XCircle } from "lucide-react";

export function OrganizationInvitesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<PendingOrganizationInviteRow[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadInvites = async () => {
    const data = await getMyPendingOrganizationInvites();
    setInvites(data);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        await loadInvites();
      } catch (err: any) {
        setError(err.message || "Failed to load organization invites.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const handleAccept = async (inviteId: string) => {
    try {
      setError("");
      setSuccessMessage("");

      await acceptMyOrganizationInvite(inviteId);
      await loadInvites();

      setSuccessMessage("Invitation accepted successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation.");
    }
  };

  const handleDecline = async (inviteId: string) => {
    try {
      setError("");
      setSuccessMessage("");

      await declineMyOrganizationInvite(inviteId);
      await loadInvites();

      setSuccessMessage("Invitation declined.");
    } catch (err: any) {
      setError(err.message || "Failed to decline invitation.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Organization Invitations</h1>
            <p className="text-gray-600">
              Accept or decline invitations to join a business organization.
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          ) : null}

          {successMessage ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-700">{successMessage}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading invitations...</p>
            </div>
          ) : invites.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">No pending invites</h2>
              </div>
              <p className="text-gray-500">
                You do not have any pending organization invitations right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                      {invite.organization_logo_url ? (
                        <img
                          src={invite.organization_logo_url}
                          alt={invite.organization_name}
                          className="h-14 w-14 rounded-xl object-cover border bg-white"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          <Building2 className="w-7 h-7" />
                        </div>
                      )}

                      <div>
                        <h2 className="text-xl font-semibold">
                          {invite.organization_name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Invited as: <span className="capitalize">{invite.role}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Assigned Card: {invite.assigned_card_uid || "None"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: <span className="capitalize">{invite.status}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAccept(invite.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium hover:bg-indigo-700"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecline(invite.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}