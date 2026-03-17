import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  adminGetShippingFee,
  adminListCardCatalog,
  adminListOrders,
  adminUpdateCardCatalog,
  adminUpdateOrderStatus,
  adminUpdateShippingFee,
  type AdminCardCatalogRow,
  type AdminOrderRow,
} from "../lib/admin-orders-service";
import { checkIsAdmin } from "../lib/admin-service";
import { Save, Search, Package } from "lucide-react";

export function AdminOrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [catalog, setCatalog] = useState<AdminCardCatalogRow[]>([]);
  const [shippingFee, setShippingFee] = useState(0);

  const [search, setSearch] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [savingCatalogType, setSavingCatalogType] = useState<string | null>(null);
  const [savingShipping, setSavingShipping] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    const admin = await checkIsAdmin();
    setIsAdmin(admin);

    if (!admin) {
      setOrders([]);
      setCatalog([]);
      return;
    }

    const [orderData, catalogData, shipping] = await Promise.all([
      adminListOrders(),
      adminListCardCatalog(),
      adminGetShippingFee(),
    ]);

    setOrders(orderData);
    setCatalog(catalogData);
    setShippingFee(shipping);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadData();
      } catch (err: any) {
        setError(err.message || "Failed to load admin orders page.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((order) => {
      return (
        (order.customer_name || "").toLowerCase().includes(q) ||
        (order.email || "").toLowerCase().includes(q) ||
        (order.phone || "").toLowerCase().includes(q) ||
        (order.card_type || "").toLowerCase().includes(q) ||
        (order.order_status || "").toLowerCase().includes(q) ||
        (order.payment_status || "").toLowerCase().includes(q) ||
        (order.city || "").toLowerCase().includes(q) ||
        (order.province_state || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  const handleOrderStatusChange = async (orderId: string, orderStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");
      setSuccess("");

      await adminUpdateOrderStatus(orderId, orderStatus);
      setSuccess("Order status updated.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCatalogFieldChange = (
    cardType: string,
    field: keyof AdminCardCatalogRow,
    value: string | number | boolean
  ) => {
    setCatalog((prev) =>
      prev.map((item) =>
        item.card_type === cardType ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveCatalog = async (item: AdminCardCatalogRow) => {
    try {
      setSavingCatalogType(item.card_type);
      setError("");
      setSuccess("");

      await adminUpdateCardCatalog({
        card_type: item.card_type,
        name: item.name,
        price: Number(item.price),
        paymongo_amount: Number(item.paymongo_amount),
        is_active: Boolean(item.is_active),
        sort_order: Number(item.sort_order),
      });

      setSuccess(`${item.name} updated successfully.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save card settings.");
    } finally {
      setSavingCatalogType(null);
    }
  };

  const handleSaveShippingFee = async () => {
    try {
      setSavingShipping(true);
      setError("");
      setSuccess("");

      await adminUpdateShippingFee(Number(shippingFee));
      setSuccess("Shipping fee updated successfully.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update shipping fee.");
    } finally {
      setSavingShipping(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Orders</h1>
            <p className="text-gray-600">
              Manage physical card orders, prices, shipping, and availability.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading admin orders...</p>
            </div>
          ) : !isAdmin ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-red-600 font-medium">You do not have admin access.</p>
            </div>
          ) : (
            <>
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-6">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-6">
                  {success}
                </div>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Card Catalog Settings</h2>

                  <div className="space-y-4">
                    {catalog.map((item) => (
                      <div key={item.card_type} className="border rounded-xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium mb-2">Type</label>
                            <input
                              type="text"
                              value={item.card_type}
                              readOnly
                              className="border rounded-lg px-3 py-2 w-full bg-gray-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Name</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleCatalogFieldChange(
                                  item.card_type,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2 w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Price (PHP)</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                handleCatalogFieldChange(
                                  item.card_type,
                                  "price",
                                  Number(e.target.value)
                                )
                              }
                              className="border rounded-lg px-3 py-2 w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              PayMongo Amount
                            </label>
                            <input
                              type="number"
                              value={item.paymongo_amount}
                              onChange={(e) =>
                                handleCatalogFieldChange(
                                  item.card_type,
                                  "paymongo_amount",
                                  Number(e.target.value)
                                )
                              }
                              className="border rounded-lg px-3 py-2 w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Sort Order</label>
                            <input
                              type="number"
                              value={item.sort_order}
                              onChange={(e) =>
                                handleCatalogFieldChange(
                                  item.card_type,
                                  "sort_order",
                                  Number(e.target.value)
                                )
                              }
                              className="border rounded-lg px-3 py-2 w-full"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(e) =>
                                  handleCatalogFieldChange(
                                    item.card_type,
                                    "is_active",
                                    e.target.checked
                                  )
                                }
                              />
                              Enabled
                            </label>

                            <button
                              type="button"
                              onClick={() => handleSaveCatalog(item)}
                              disabled={savingCatalogType === item.card_type}
                              className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-3 py-2 text-sm disabled:opacity-60"
                            >
                              <Save className="w-4 h-4" />
                              {savingCatalogType === item.card_type ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 h-fit">
                  <h2 className="text-xl font-semibold mb-4">Shipping Settings</h2>

                  <label className="block text-sm font-medium mb-2">
                    Shipping Fee (PHP)
                  </label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                    className="border rounded-lg px-3 py-2 w-full"
                  />

                  <button
                    type="button"
                    onClick={handleSaveShippingFee}
                    disabled={savingShipping}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-3 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {savingShipping ? "Saving..." : "Save Shipping Fee"}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <h2 className="text-xl font-semibold">Order List</h2>

                  <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search customer, email, phone, city..."
                      className="border rounded-lg px-3 py-2 pl-10 w-full"
                    />
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <p className="text-gray-600">No orders found.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-indigo-600" />
                              <h3 className="font-semibold">{order.customer_name}</h3>
                            </div>

                            <p><strong>Email:</strong> {order.email}</p>
                            <p><strong>Phone:</strong> {order.phone}</p>
                            <p>
                              <strong>Address:</strong>{" "}
                              {order.shipping_address_line1}
                              {order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ""}
                              {`, ${order.city}, ${order.province_state} ${order.postal_code}, ${order.country}`}
                            </p>
                            <p><strong>Card Type:</strong> {order.card_type}</p>
                            <p><strong>Quantity:</strong> {order.quantity}</p>
                            <p><strong>Total:</strong> ₱{order.total_amount}</p>
                            <p><strong>Payment:</strong> {order.payment_status}</p>
                            <p><strong>Status:</strong> {order.order_status}</p>
                            {order.notes ? <p><strong>Notes:</strong> {order.notes}</p> : null}
                            {order.created_at ? (
                              <p>
                                <strong>Created:</strong>{" "}
                                {new Date(order.created_at).toLocaleString()}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOrderStatusChange(order.id, "processing")}
                              disabled={updatingOrderId === order.id}
                              className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                            >
                              Processing
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOrderStatusChange(order.id, "shipped")}
                              disabled={updatingOrderId === order.id}
                              className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                            >
                              Shipped
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOrderStatusChange(order.id, "completed")}
                              disabled={updatingOrderId === order.id}
                              className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                            >
                              Completed
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOrderStatusChange(order.id, "cancelled")}
                              disabled={updatingOrderId === order.id}
                              className="border rounded-lg px-3 py-2 text-sm text-red-700 border-red-200 hover:bg-red-50 disabled:opacity-60"
                            >
                              Cancel
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