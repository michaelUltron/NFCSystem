import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { Toast } from "../components/toast";
import {
  CreditCard,
  RefreshCw,
  Plus,
  Wifi,
  Copy,
  Search,
  WalletCards,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  getMySellerCards,
  getMySellerDashboard,
  sellerRegisterCard,
  type SellerCardRow,
  type SellerDashboardRow,
} from "../lib/seller-service";
import { generateCardUid, getTapUrl } from "../lib/admin-service";

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

export function SellerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<SellerDashboardRow | null>(null);
  const [cards, setCards] = useState<SellerCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [encodingUid, setEncodingUid] = useState<string | null>(null);
  const [cardUid, setCardUid] = useState(generateCardUid());
  const [cardType, setCardType] = useState("standard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    const [dashboardData, cardsData] = await Promise.all([
      getMySellerDashboard(),
      getMySellerCards(),
    ]);

    setDashboard(dashboardData);
    setCards(cardsData);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } catch (err: any) {
        setError(err.message || "Failed to load seller dashboard.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!error && !success) return;

    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [error, success]);

  const filteredCards = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return cards.filter((card) => {
      const status = (card.status || "").toLowerCase();
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !search ||
        (card.card_uid || "").toLowerCase().includes(search) ||
        (card.card_type || "").toLowerCase().includes(search) ||
        (card.owner_full_name || "").toLowerCase().includes(search) ||
        (card.owner_email || "").toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [cards, searchTerm, statusFilter]);

  const handleRegisterCard = async () => {
    try {
      setCreating(true);
      setError("");
      setSuccess("");

      if (!cardUid.trim()) {
        throw new Error("Card UID is required.");
      }

      await sellerRegisterCard(cardUid, cardType);
      setSuccess(`Card ${cardUid} registered. 1 credit was used.`);
      setCardUid(generateCardUid());
      setCardType("standard");
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to register card.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyTapUrl = async (uid: string) => {
    const tapUrl = getTapUrl(uid);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tapUrl);
      } else if (!copyTextFallback(tapUrl)) {
        throw new Error("Copy failed");
      }

      setSuccess(`Tap URL copied for ${uid}.`);
      setError("");
    } catch {
      setError(`Failed to copy tap URL for ${uid}.`);
    }
  };

  const handleWriteNfc = async (uid: string) => {
    try {
      setEncodingUid(uid);
      setError("");
      setSuccess("");

      if (!("NDEFReader" in window)) {
        throw new Error(
          "Web NFC is not supported on this device. Use Chrome on Android over HTTPS with NFC turned on."
        );
      }

      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{ recordType: "url", data: getTapUrl(uid) }],
      });

      setSuccess(`Card ${uid} encoded successfully.`);
    } catch (err: any) {
      setError(err.message || "Failed to write NFC.");
    } finally {
      setEncodingUid(null);
    }
  };

  return (
    <>
      {success ? (
        <Toast type="success" message={success} onClose={() => setSuccess("")} />
      ) : null}
      {error ? (
        <Toast type="error" message={error} onClose={() => setError("")} />
      ) : null}

      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col">
          <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
                <p className="text-gray-600">
                  Register NFC cards, spend credits, and monitor customer activations.
                </p>
              </div>

              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="rounded-xl bg-white p-6 shadow-md">
                Loading seller dashboard...
              </div>
            ) : !dashboard ? (
              <div className="rounded-xl bg-white p-6 shadow-md">
                <p className="font-medium text-red-600">Seller access is not active.</p>
                <p className="mt-2 text-sm text-gray-600">
                  Ask an admin to create and activate your seller account.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <WalletCards className="h-5 w-5 text-indigo-600" />
                      <p className="text-sm">Credits</p>
                    </div>
                    <p className="text-3xl font-bold">{dashboard.credit_balance}</p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      <p className="text-sm">Total Cards</p>
                    </div>
                    <p className="text-3xl font-bold">{dashboard.total_cards}</p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm">Unactivated</p>
                    </div>
                    <p className="text-3xl font-bold">{dashboard.unactivated_cards}</p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm">Activated</p>
                    </div>
                    <p className="text-3xl font-bold">{dashboard.activated_cards}</p>
                  </div>
                </div>

                <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold">Register Card</h2>
                    <button
                      type="button"
                      onClick={() => setCardUid(generateCardUid())}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Generate UID
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Card UID
                      </label>
                      <input
                        value={cardUid}
                        onChange={(event) => setCardUid(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="SC123456"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Card Type
                      </label>
                      <select
                        value={cardType}
                        onChange={(event) => setCardType(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                      >
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="metal">Metal</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleRegisterCard}
                        disabled={creating || dashboard.credit_balance < 1}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        <Plus className="h-4 w-4" />
                        {creating ? "Registering..." : "Register and Use 1 Credit"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-md">
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-semibold">Seller Cards</h2>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Search cards or customers..."
                          className="w-full rounded-lg border px-3 py-2 pl-10 sm:w-72"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="rounded-lg border px-3 py-2"
                      >
                        <option value="all">All Statuses</option>
                        <option value="inactive">Unactivated</option>
                        <option value="active">Activated</option>
                        <option value="blocked">Blocked</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>

                  {filteredCards.length === 0 ? (
                    <p className="text-gray-500">No seller cards found.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredCards.map((card) => (
                        <div key={card.id} className="rounded-xl border p-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <CreditCard className="h-4 w-4 text-indigo-600" />
                                <h3 className="font-semibold">{card.card_uid}</h3>
                                <span
                                  className={`rounded-full px-2 py-1 text-xs ${
                                    card.status === "active"
                                      ? "bg-green-100 text-green-700"
                                      : card.status === "inactive"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {card.status === "inactive"
                                    ? "unactivated"
                                    : card.status || "unknown"}
                                </span>
                              </div>

                              <p className="break-all text-sm text-gray-600">
                                <strong>Tap URL:</strong> {getTapUrl(card.card_uid)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Customer:</strong>{" "}
                                {card.owner_full_name || card.owner_email || "Not activated yet"}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Created:</strong>{" "}
                                {card.created_at
                                  ? new Date(card.created_at).toLocaleString()
                                  : "N/A"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyTapUrl(card.card_uid)}
                                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                              >
                                <Copy className="h-4 w-4" />
                                Copy URL
                              </button>

                              <button
                                type="button"
                                onClick={() => handleWriteNfc(card.card_uid)}
                                disabled={encodingUid === card.card_uid}
                                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                              >
                                <Wifi className="h-4 w-4" />
                                {encodingUid === card.card_uid ? "Encoding..." : "Encode NFC"}
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
    </>
  );
}
