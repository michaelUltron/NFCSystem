import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { Toast } from "../components/toast";
import {
  adminAdjustSellerCredits,
  adminListSellers,
  adminUpsertSeller,
  type AdminSellerRow,
} from "../lib/seller-service";
import { checkIsAdmin } from "../lib/admin-service";
import {
  BadgeCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Store,
  WalletCards,
} from "lucide-react";

export function AdminSellersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustingSellerId, setAdjustingSellerId] = useState<string | null>(null);
  const [sellers, setSellers] = useState<AdminSellerRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userId, setUserId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [status, setStatus] = useState("active");
  const [initialCredits, setInitialCredits] = useState("10");

  const load = async () => {
    const admin = await checkIsAdmin();
    setIsAdmin(admin);

    if (!admin) {
      setSellers([]);
      return;
    }

    setSellers(await adminListSellers());
  };

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } catch (err: any) {
        setError(err.message || "Failed to load sellers.");
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

  const filteredSellers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return sellers;

    return sellers.filter((seller) => {
      return (
        seller.business_name.toLowerCase().includes(search) ||
        seller.user_id.toLowerCase().includes(search) ||
        (seller.contact_email || "").toLowerCase().includes(search) ||
        (seller.contact_phone || "").toLowerCase().includes(search) ||
        seller.status.toLowerCase().includes(search)
      );
    });
  }, [sellers, searchTerm]);

  const activeCount = useMemo(
    () => sellers.filter((seller) => seller.status === "active").length,
    [sellers]
  );

  const totalCredits = useMemo(
    () => sellers.reduce((sum, seller) => sum + Number(seller.credit_balance || 0), 0),
    [sellers]
  );

  const handleCreateSeller = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!userId.trim()) throw new Error("Seller user ID is required.");
      if (!businessName.trim()) throw new Error("Business name is required.");

      const seller = await adminUpsertSeller({
        userId,
        businessName,
        contactEmail,
        contactPhone,
        status,
      });

      const creditCount = Number.parseInt(initialCredits, 10);
      if (seller?.id && Number.isFinite(creditCount) && creditCount > 0) {
        await adminAdjustSellerCredits(
          seller.id,
          creditCount,
          "initial_seller_credits"
        );
      }

      setSuccess("Seller saved successfully.");
      setUserId("");
      setBusinessName("");
      setContactEmail("");
      setContactPhone("");
      setStatus("active");
      setInitialCredits("10");
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to save seller.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCredits = async (seller: AdminSellerRow, delta: number) => {
    try {
      setAdjustingSellerId(seller.seller_id);
      setError("");
      setSuccess("");

      await adminAdjustSellerCredits(
        seller.seller_id,
        delta,
        delta > 0 ? "admin_credit_topup" : "admin_credit_deduction"
      );

      setSuccess(
        `${delta > 0 ? "Added" : "Deducted"} ${Math.abs(delta)} credits for ${
          seller.business_name
        }.`
      );
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to adjust credits.");
    } finally {
      setAdjustingSellerId(null);
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
                <h1 className="text-3xl font-bold mb-2">Admin Sellers</h1>
                <p className="text-gray-600">
                  Approve pilot sellers and manage their card credits.
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
                Loading sellers...
              </div>
            ) : !isAdmin ? (
              <div className="rounded-xl bg-white p-6 shadow-md">
                <p className="font-medium text-red-600">Admin access required.</p>
              </div>
            ) : (
              <>
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <Store className="h-5 w-5 text-indigo-600" />
                      <p className="text-sm">Sellers</p>
                    </div>
                    <p className="text-3xl font-bold">{sellers.length}</p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <BadgeCheck className="h-5 w-5 text-green-600" />
                      <p className="text-sm">Active</p>
                    </div>
                    <p className="text-3xl font-bold">{activeCount}</p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <WalletCards className="h-5 w-5 text-indigo-600" />
                      <p className="text-sm">Open Credits</p>
                    </div>
                    <p className="text-3xl font-bold">{totalCredits}</p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <ShieldAlert className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm">Suspended</p>
                    </div>
                    <p className="text-3xl font-bold">
                      {sellers.filter((seller) => seller.status === "suspended").length}
                    </p>
                  </div>
                </div>

                <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
                  <h2 className="mb-4 text-xl font-semibold">Create or Update Seller</h2>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Seller User ID
                      </label>
                      <input
                        value={userId}
                        onChange={(event) => setUserId(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="Auth user UUID"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Business Name
                      </label>
                      <input
                        value={businessName}
                        onChange={(event) => setBusinessName(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="Seller shop name"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Contact Email
                      </label>
                      <input
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="seller@example.com"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Contact Phone
                      </label>
                      <input
                        value={contactPhone}
                        onChange={(event) => setContactPhone(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="+63..."
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Initial Credits
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={initialCredits}
                        onChange={(event) => setInitialCredits(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateSeller}
                    disabled={saving}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Seller"}
                  </button>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-md">
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-semibold">Seller Accounts</h2>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search sellers..."
                        className="w-full rounded-lg border px-3 py-2 pl-10 sm:w-80"
                      />
                    </div>
                  </div>

                  {filteredSellers.length === 0 ? (
                    <p className="text-gray-500">No sellers found.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredSellers.map((seller) => (
                        <div key={seller.seller_id} className="rounded-xl border p-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">{seller.business_name}</h3>
                                <span
                                  className={`rounded-full px-2 py-1 text-xs ${
                                    seller.status === "active"
                                      ? "bg-green-100 text-green-700"
                                      : seller.status === "suspended"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {seller.status}
                                </span>
                              </div>

                              <p className="break-all text-sm text-gray-600">
                                <strong>User ID:</strong> {seller.user_id}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Contact:</strong>{" "}
                                {seller.contact_email || seller.contact_phone || "No contact set"}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Cards:</strong> {seller.total_cards} total,{" "}
                                {seller.activated_cards} activated
                              </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:items-end">
                              <div className="rounded-lg bg-indigo-50 px-4 py-2 text-indigo-700">
                                <strong>{seller.credit_balance}</strong> credits
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddCredits(seller, 10)}
                                  disabled={adjustingSellerId === seller.seller_id}
                                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                                >
                                  +10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddCredits(seller, 50)}
                                  disabled={adjustingSellerId === seller.seller_id}
                                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                                >
                                  +50
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddCredits(seller, -1)}
                                  disabled={adjustingSellerId === seller.seller_id}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                                >
                                  -1
                                </button>
                              </div>
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
