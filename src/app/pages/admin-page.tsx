import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  adminCreateCard,
  adminListCards,
  checkIsAdmin,
  generateCardUid,
  getTapUrl,
  type AdminCardRow,
} from "../lib/admin-service";
import { Copy, CreditCard, Plus, RefreshCw, Download, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function copyTextFallback(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch {
    document.body.removeChild(textArea);
    return false;
  }
}

export function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cards, setCards] = useState<AdminCardRow[]>([]);
  const [cardUid, setCardUid] = useState(generateCardUid());
  const [cardType, setCardType] = useState("standard");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activatedFrom, setActivatedFrom] = useState("");
  const [activatedTo, setActivatedTo] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    const admin = await checkIsAdmin();
    setIsAdmin(admin);

    if (!admin) {
      setCards([]);
      return;
    }

    const data = await adminListCards();
    setCards(data);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadData();
      } catch (err: any) {
        setError(err.message || "Failed to load admin page.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesStatus =
        statusFilter === "all" ? true : card.status === statusFilter;

      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        (card.card_uid || "").toLowerCase().includes(search) ||
        (card.card_type || "").toLowerCase().includes(search) ||
        (card.status || "").toLowerCase().includes(search) ||
        (card.user_id || "").toLowerCase().includes(search) ||
        (card.blocked_reason || "").toLowerCase().includes(search);

      let matchesDate = true;

      if (activatedFrom || activatedTo) {
        if (!card.activation_date) {
          matchesDate = false;
        } else {
          const activatedDate = new Date(card.activation_date);
          const fromOk = activatedFrom
            ? activatedDate >= new Date(`${activatedFrom}T00:00:00`)
            : true;
          const toOk = activatedTo
            ? activatedDate <= new Date(`${activatedTo}T23:59:59`)
            : true;

          matchesDate = fromOk && toOk;
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [cards, statusFilter, searchTerm, activatedFrom, activatedTo]);

  const inactiveCount = useMemo(
    () => cards.filter((card) => card.status === "inactive").length,
    [cards]
  );

  const activeCount = useMemo(
    () => cards.filter((card) => card.status === "active").length,
    [cards]
  );

  const blockedCount = useMemo(
    () => cards.filter((card) => card.status === "blocked").length,
    [cards]
  );

  const handleCreateCard = async () => {
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      if (!cardUid.trim()) {
        throw new Error("Card UID is required.");
      }

      await adminCreateCard(cardUid, cardType);
      setSuccess(`Card ${cardUid} created successfully.`);
      setCardUid(generateCardUid());
      setCardType("standard");
      await loadData();
    } catch (err: any) {
      if (String(err.message || "").toLowerCase().includes("duplicate")) {
        setError("That card UID already exists. Generate a new one.");
      } else {
        setError(err.message || "Failed to create card.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopyTapUrl = async (uid: string) => {
    const tapUrl = getTapUrl(uid);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tapUrl);
        setSuccess(`Tap URL copied for ${uid}`);
        setError("");
        return;
      }

      const copied = copyTextFallback(tapUrl);
      if (!copied) {
        throw new Error("Copy failed");
      }

      setSuccess(`Tap URL copied for ${uid}`);
      setError("");
    } catch {
      setError(`Failed to copy tap URL for ${uid}.`);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportRows = filteredCards.map((card) => ({
        "Card UID": card.card_uid,
        Status: card.status || "",
        "Card Type": card.card_type || "",
        "Owner User ID": card.user_id || "",
        "Is Primary": card.is_primary ? "Yes" : "No",
        "Created At": card.created_at
          ? new Date(card.created_at).toLocaleString()
          : "",
        "Activated At": card.activation_date
          ? new Date(card.activation_date).toLocaleString()
          : "",
        "Updated At": card.updated_at
          ? new Date(card.updated_at).toLocaleString()
          : "",
        "Blocked At": card.blocked_at
          ? new Date(card.blocked_at).toLocaleString()
          : "",
        "Blocked Reason": card.blocked_reason || "",
        "Tap URL": getTapUrl(card.card_uid),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Card Inventory");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `sabicard-inventory-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      saveAs(blob, fileName);
      setSuccess("Excel export generated successfully.");
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to export Excel.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Inventory</h1>
            <p className="text-gray-600">
              Create and manage SabiCard inventory before selling
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading admin page...</p>
            </div>
          ) : !isAdmin ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-red-600 font-medium">You do not have admin access.</p>
              <p className="text-sm text-gray-600 mt-2">
                Set your profile is_admin = true in Supabase to use this page.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-500 mb-1">Inactive Cards</p>
                  <p className="text-3xl font-bold">{inactiveCount}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-500 mb-1">Active Cards</p>
                  <p className="text-3xl font-bold">{activeCount}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-500 mb-1">Blocked Cards</p>
                  <p className="text-3xl font-bold">{blockedCount}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <h2 className="text-xl font-semibold">Create New Card</h2>
                  <button
                    type="button"
                    onClick={() => setCardUid(generateCardUid())}
                    className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate UID
                  </button>
                </div>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-4">
                    {success}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Card UID</label>
                    <input
                      type="text"
                      value={cardUid}
                      onChange={(e) => setCardUid(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                      placeholder="SC123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Card Type</label>
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    >
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="metal">Metal</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleCreateCard}
                      disabled={creating}
                      className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 disabled:opacity-60"
                    >
                      <Plus className="w-4 h-4" />
                      {creating ? "Creating..." : "Create Card"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <h2 className="text-xl font-semibold">Card Inventory</h2>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      Export Excel
                    </button>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="all">All Statuses</option>
                      <option value="inactive">Inactive</option>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search UID, status, type, owner, reason..."
                        className="border rounded-lg px-3 py-2 pl-10 w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Activated From
                    </label>
                    <input
                      type="date"
                      value={activatedFrom}
                      onChange={(e) => setActivatedFrom(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Activated To
                    </label>
                    <input
                      type="date"
                      value={activatedTo}
                      onChange={(e) => setActivatedTo(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                  </div>
                </div>

                {filteredCards.length === 0 ? (
                  <p className="text-gray-600">No cards found.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredCards.map((card) => (
                      <div key={card.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CreditCard className="w-4 h-4 text-indigo-600" />
                              <h3 className="font-semibold">{card.card_uid}</h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  card.status === "inactive"
                                    ? "bg-gray-100 text-gray-700"
                                    : card.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : card.status === "blocked"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {card.status || "unknown"}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600">
                              <strong>Type:</strong> {card.card_type || "standard"}
                            </p>

                            <p className="text-sm text-gray-600 break-all">
                              <strong>Tap URL:</strong> {getTapUrl(card.card_uid)}
                            </p>

                            {card.user_id ? (
                              <p className="text-sm text-gray-600 break-all">
                                <strong>Owner:</strong> {card.user_id}
                              </p>
                            ) : null}

                            {card.activation_date ? (
                              <p className="text-sm text-gray-600">
                                <strong>Activated:</strong>{" "}
                                {new Date(card.activation_date).toLocaleString()}
                              </p>
                            ) : null}

                            {card.created_at ? (
                              <p className="text-sm text-gray-600">
                                <strong>Created:</strong>{" "}
                                {new Date(card.created_at).toLocaleString()}
                              </p>
                            ) : null}

                            {card.blocked_reason ? (
                              <p className="text-sm text-gray-600">
                                <strong>Blocked Reason:</strong> {card.blocked_reason}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyTapUrl(card.card_uid)}
                              className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <Copy className="w-4 h-4" />
                              Copy Tap URL
                            </button>
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