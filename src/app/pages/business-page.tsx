import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  ensureMyBusinessOrganization,
  getMyAccountManagementStatus,
  getMyBusinessOverview,
  getMyBusinessBranding,
  updateMyBusinessBranding,
  getMyBusinessMembers,
  getMyBusinessInvites,
  getMyBusinessCards,
  createMyBusinessInvite,
  cancelMyBusinessInvite,
  type BusinessOverviewRow,
  type OrganizationBranding,
  type BusinessMemberRow,
  type BusinessInviteRow,
  type BusinessCardRow,
} from "../lib/business-service";
import {
  Building2,
  Users,
  CreditCard,
  MousePointerClick,
  Palette,
  UserPlus,
  Mail,
  XCircle,
} from "lucide-react";

type BrandingForm = {
  name: string;
  logo_url: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_tagline: string;
};

type InviteForm = {
  email: string;
  role: string;
  assigned_card_id: string;
};

export function BusinessPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingInvite, setSavingInvite] = useState(false);

  const [overview, setOverview] = useState<BusinessOverviewRow | null>(null);
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [members, setMembers] = useState<BusinessMemberRow[]>([]);
  const [invites, setInvites] = useState<BusinessInviteRow[]>([]);
  const [cards, setCards] = useState<BusinessCardRow[]>([]);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [brandingForm, setBrandingForm] = useState<BrandingForm>({
    name: "",
    logo_url: "",
    brand_primary_color: "#4F46E5",
    brand_secondary_color: "#0F172A",
    brand_tagline: "",
  });

  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: "",
    role: "member",
    assigned_card_id: "",
  });

  const availableCards = useMemo(() => {
    return cards.filter((card) => !card.assigned_user_id);
  }, [cards]);

  const loadBusinessData = async () => {
    const [
      overviewData,
      brandingData,
      membersData,
      invitesData,
      cardsData,
    ] = await Promise.all([
      getMyBusinessOverview(),
      getMyBusinessBranding(),
      getMyBusinessMembers(),
      getMyBusinessInvites(),
      getMyBusinessCards(),
    ]);

    setOverview(overviewData);
    setBranding(brandingData);
    setMembers(membersData);
    setInvites(invitesData);
    setCards(cardsData);

    if (brandingData) {
      setBrandingForm({
        name: brandingData.name || "",
        logo_url: brandingData.logo_url || "",
        brand_primary_color: brandingData.brand_primary_color || "#4F46E5",
        brand_secondary_color: brandingData.brand_secondary_color || "#0F172A",
        brand_tagline: brandingData.brand_tagline || "",
      });
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const status = await getMyAccountManagementStatus();

        const canOpenBusiness =
          status?.is_business_owner ||
          (!!status &&
            !status.managed_by_organization &&
            status.can_manage_billing);

        if (!canOpenBusiness) {
          throw new Error("You do not have access to Business Management.");
        }

        await ensureMyBusinessOrganization();
        await loadBusinessData();
      } catch (err: any) {
        setError(err.message || "Failed to load business management.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const handleBrandingChange = (
    key: keyof BrandingForm,
    value: string
  ) => {
    setBrandingForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleInviteChange = (
    key: keyof InviteForm,
    value: string
  ) => {
    setInviteForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingBranding(true);
      setError("");
      setSuccessMessage("");

      const updated = await updateMyBusinessBranding(brandingForm);
      setBranding(updated);
      await loadBusinessData();

      setSuccessMessage("Business branding updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update business branding.");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingInvite(true);
      setError("");
      setSuccessMessage("");

      await createMyBusinessInvite({
        email: inviteForm.email,
        role: inviteForm.role,
        assigned_card_id: inviteForm.assigned_card_id || null,
      });

      setInviteForm({
        email: "",
        role: "member",
        assigned_card_id: "",
      });

      await loadBusinessData();
      setSuccessMessage("Invite created successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to create invite.");
    } finally {
      setSavingInvite(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      setError("");
      setSuccessMessage("");

      await cancelMyBusinessInvite(inviteId);
      await loadBusinessData();

      setSuccessMessage("Invite cancelled successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to cancel invite.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Business Management</h1>
            <p className="text-gray-600">
              Manage your organization branding, cards, and team invites.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading business management...</p>
            </div>
          ) : error && !overview ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : (
            <>
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

              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-semibold">
                    {overview?.organization_name || branding?.name || "My Business"}
                  </h2>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Primary Color:</strong>{" "}
                    {overview?.brand_primary_color || "Not set"}
                  </p>
                  <p>
                    <strong>Secondary Color:</strong>{" "}
                    {overview?.brand_secondary_color || "Not set"}
                  </p>
                  <p>
                    <strong>Tagline:</strong>{" "}
                    {overview?.brand_tagline || "Not set"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm text-gray-500">Team Members</p>
                  </div>
                  <p className="text-3xl font-bold">{overview?.total_members ?? 0}</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm text-gray-500">Total Cards</p>
                  </div>
                  <p className="text-3xl font-bold">{overview?.total_cards ?? 0}</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-500">Active Cards</p>
                  </div>
                  <p className="text-3xl font-bold">{overview?.active_cards ?? 0}</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointerClick className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm text-gray-500">Assigned Cards</p>
                  </div>
                  <p className="text-3xl font-bold">{overview?.assigned_cards ?? 0}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-semibold">Branding</h3>
                </div>

                <form onSubmit={handleSaveBranding} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={brandingForm.name}
                        onChange={(e) =>
                          handleBrandingChange("name", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your business name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={brandingForm.brand_tagline}
                        onChange={(e) =>
                          handleBrandingChange("brand_tagline", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your business tagline"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      value={brandingForm.logo_url}
                      onChange={(e) =>
                        handleBrandingChange("logo_url", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={brandingForm.brand_primary_color}
                          onChange={(e) =>
                            handleBrandingChange(
                              "brand_primary_color",
                              e.target.value
                            )
                          }
                          className="h-12 w-16 rounded border border-gray-300 bg-white p-1"
                        />
                        <input
                          type="text"
                          value={brandingForm.brand_primary_color}
                          onChange={(e) =>
                            handleBrandingChange(
                              "brand_primary_color",
                              e.target.value
                            )
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={brandingForm.brand_secondary_color}
                          onChange={(e) =>
                            handleBrandingChange(
                              "brand_secondary_color",
                              e.target.value
                            )
                          }
                          className="h-12 w-16 rounded border border-gray-300 bg-white p-1"
                        />
                        <input
                          type="text"
                          value={brandingForm.brand_secondary_color}
                          onChange={(e) =>
                            handleBrandingChange(
                              "brand_secondary_color",
                              e.target.value
                            )
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-6 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-4">
                      Branding Preview
                    </p>

                    <div
                      className="rounded-2xl p-6 text-white"
                      style={{
                        background: `linear-gradient(135deg, ${
                          brandingForm.brand_primary_color || "#4F46E5"
                        }, ${brandingForm.brand_secondary_color || "#0F172A"})`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {brandingForm.logo_url ? (
                          <img
                            src={brandingForm.logo_url}
                            alt="Brand logo"
                            className="h-16 w-16 rounded-xl object-cover bg-white"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {(brandingForm.name || "B").charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <p className="text-xl font-bold">
                            {brandingForm.name || "Your Business Name"}
                          </p>
                          <p className="text-sm text-white/80">
                            {brandingForm.brand_tagline || "Your tagline goes here"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingBranding}
                      className="rounded-lg bg-indigo-600 px-5 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {savingBranding ? "Saving..." : "Save Branding"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xl font-semibold">Invite Team Member</h3>
                  </div>

                  <form onSubmit={handleCreateInvite} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) =>
                          handleInviteChange("email", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="member@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select
                        value={inviteForm.role}
                        onChange={(e) =>
                          handleInviteChange("role", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Card (optional)
                      </label>
                      <select
                        value={inviteForm.assigned_card_id}
                        onChange={(e) =>
                          handleInviteChange("assigned_card_id", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">No card selected</option>
                        {availableCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.card_uid} ({card.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingInvite}
                        className="rounded-lg bg-indigo-600 px-5 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {savingInvite ? "Sending..." : "Create Invite"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Mail className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xl font-semibold">Pending Invites</h3>
                  </div>

                  {invites.length === 0 ? (
                    <p className="text-gray-500 text-sm">No invites yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="border rounded-xl p-4 flex items-start justify-between gap-4"
                        >
                          <div>
                            <p className="font-medium">{invite.email}</p>
                            <p className="text-sm text-gray-500">
                              Role: {invite.role}
                            </p>
                            <p className="text-sm text-gray-500">
                              Status: {invite.status}
                            </p>
                            <p className="text-sm text-gray-500">
                              Assigned Card: {invite.assigned_card_uid || "None"}
                            </p>
                          </div>

                          {invite.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => handleCancelInvite(invite.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-semibold">Team Members</h3>
                </div>

                {members.length === 0 ? (
                  <p className="text-gray-500 text-sm">No members yet.</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.member_id}
                        className="border rounded-xl p-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-medium">
                            {member.full_name || member.email || "Unnamed User"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.email || "No email"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.position || "No position"}
                            {member.company ? ` • ${member.company}` : ""}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium capitalize">
                            {member.role}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {member.status}
                          </p>
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