import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  getMyBusinessCards,
  getMyBusinessMembers,
  assignCardByEmail,
  unassignBusinessCard,
  blockBusinessCard,
  type BusinessCardRow,
  type BusinessMemberRow,
} from "../lib/business-service";
import {
  CreditCard,
  Mail,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Ban,
  UserX,
} from "lucide-react";

export function BusinessCardsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cards, setCards] = useState<BusinessCardRow[]>([]);
  const [members, setMembers] = useState<BusinessMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [selectedMemberUserId, setSelectedMemberUserId] = useState("");
  const [selectedCard, setSelectedCard] = useState<BusinessCardRow | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const unassignedCount = useMemo(
    () => cards.filter((card) => !card.assigned_email).length,
    [cards]
  );

  const assignedCount = useMemo(
    () => cards.filter((card) => !!card.assigned_email).length,
    [cards]
  );

  const blockedCount = useMemo(
    () => cards.filter((card) => (card.status || "").toLowerCase() === "blocked").length,
    [cards]
  );

  const activeMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          (member.status || "").toLowerCase() === "active" &&
          !!member.email
      ),
    [members]
  );

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [cardsData, membersData] = await Promise.all([
        getMyBusinessCards(),
        getMyBusinessMembers(),
      ]);

      setCards(cardsData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "Failed to load business cards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenAssign = (card: BusinessCardRow) => {
    setSelectedCard(card);
    setEmail(card.assigned_email || "");
    setSelectedMemberUserId("");
    setError("");
    setSuccessMessage("");
  };

  const handleCloseAssign = () => {
    setSelectedCard(null);
    setEmail("");
    setSelectedMemberUserId("");
  };

  const handleSelectMember = (userId: string) => {
    setSelectedMemberUserId(userId);

    const member = activeMembers.find((item) => item.user_id === userId);
    if (member?.email) {
      setEmail(member.email);
    }
  };

  const handleAssign = async () => {
    try {
      if (!selectedCard) return;

      if (!email.trim()) {
        throw new Error("Please enter an email address.");
      }

      setAssigning(true);
      setError("");
      setSuccessMessage("");

      await assignCardByEmail(selectedCard.id, email.trim());

      setSuccessMessage(`Card ${selectedCard.card_uid} assigned successfully.`);
      setEmail("");
      setSelectedMemberUserId("");
      setSelectedCard(null);

      await load();
    } catch (err: any) {
      setError(err.message || "Failed to assign card.");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (card: BusinessCardRow) => {
    try {
      setProcessingCardId(card.id);
      setError("");
      setSuccessMessage("");

      await unassignBusinessCard(card.id);
      setSuccessMessage(`Card ${card.card_uid} is now unassigned.`);
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to unassign card.");
    } finally {
      setProcessingCardId(null);
    }
  };

  const handleBlock = async (card: BusinessCardRow) => {
    try {
      setProcessingCardId(card.id);
      setError("");
      setSuccessMessage("");

      await blockBusinessCard(card.id);
      setSuccessMessage(`Card ${card.card_uid} has been blocked.`);
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to block card.");
    } finally {
      setProcessingCardId(null);
    }
  };

  const renderStatusBadge = (card: BusinessCardRow) => {
    const status = (card.status || "").toLowerCase();

    if (status === "blocked") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
          Blocked
        </span>
      );
    }

    if (card.assigned_email) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Assigned
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
        Unassigned
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Business Cards</h1>
              <p className="text-gray-600">
                Manage your business card inventory, assign members, unassign cards, or block cards.
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

          {successMessage ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-700">{successMessage}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <p className="text-sm text-gray-500">Total Cards</p>
              </div>
              <p className="text-3xl font-bold">{cards.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-500">Assigned</p>
              </div>
              <p className="text-3xl font-bold">{assignedCount}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-gray-500">Unassigned</p>
              </div>
              <p className="text-3xl font-bold">{unassignedCount}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="w-5 h-5 text-red-600" />
                <p className="text-sm text-gray-500">Blocked</p>
              </div>
              <p className="text-3xl font-bold">{blockedCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold">Card Inventory</h2>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading business cards...</p>
            ) : cards.length === 0 ? (
              <p className="text-gray-500">No business cards found.</p>
            ) : (
              <div className="space-y-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="border rounded-xl p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-lg">{card.card_uid}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {renderStatusBadge(card)}
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {card.status || "unknown"}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Assigned to:</strong>{" "}
                          {card.assigned_email || "No one yet"}
                        </p>
                        <p>
                          <strong>Created:</strong>{" "}
                          {card.created_at
                            ? new Date(card.created_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenAssign(card)}
                        disabled={(card.status || "").toLowerCase() === "blocked"}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
                      >
                        <Mail className="w-4 h-4" />
                        {card.assigned_email ? "Reassign" : "Assign"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUnassign(card)}
                        disabled={
                          processingCardId === card.id ||
                          !card.assigned_email ||
                          (card.status || "").toLowerCase() === "blocked"
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-yellow-300 px-4 py-2.5 text-yellow-700 hover:bg-yellow-50 disabled:opacity-60"
                      >
                        <UserX className="w-4 h-4" />
                        {processingCardId === card.id ? "Please wait..." : "Unassign"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBlock(card)}
                        disabled={
                          processingCardId === card.id ||
                          (card.status || "").toLowerCase() === "blocked"
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Ban className="w-4 h-4" />
                        {processingCardId === card.id ? "Please wait..." : "Block"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedCard ? (
            <div className="mt-8 bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">
                  Assign Card: {selectedCard.card_uid}
                </h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Choose an organization member from the dropdown, or type any email manually for invite-based assignment.
              </p>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose existing member
                  </label>
                  <select
                    value={selectedMemberUserId}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a member (optional)</option>
                    {activeMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name || member.email} {member.email ? `(${member.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    You can type manually even if you use the dropdown.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={assigning}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <UserPlus className="w-4 h-4" />
                    {assigning ? "Assigning..." : "Assign Card"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseAssign}
                    disabled={assigning}
                    className="rounded-lg border border-gray-300 px-5 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}