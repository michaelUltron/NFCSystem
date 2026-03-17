import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { supabase } from "../lib/supabase";

type CardCatalogRow = {
  id: string;
  card_type: string;
  name: string;
  price: number;
  paymongo_amount: number;
  is_active: boolean;
  sort_order: number;
};

export function OrderPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState("");

  const [catalog, setCatalog] = useState<CardCatalogRow[]>([]);
  const [shippingFee, setShippingFee] = useState(120);

  const [cardType, setCardType] = useState("standard");
  const [quantity, setQuantity] = useState(1);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [catalogResp, shippingResp] = await Promise.all([
          supabase
            .from("card_catalog")
            .select("id, card_type, name, price, paymongo_amount, is_active, sort_order")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("app_settings")
            .select("value_numeric")
            .eq("key", "card_shipping_fee")
            .maybeSingle(),
        ]);

        if (catalogResp.error) throw catalogResp.error;
        if (shippingResp.error) throw shippingResp.error;

        const rows = (catalogResp.data ?? []) as CardCatalogRow[];
        setCatalog(rows);

        if (rows.length > 0 && !rows.find((r) => r.card_type === cardType)) {
          setCardType(rows[0].card_type);
        }

        setShippingFee(Number(shippingResp.data?.value_numeric ?? 120));
      } catch (err: any) {
        setError(err.message || "Failed to load card catalog.");
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalog();
  }, [cardType]);

  const selectedCard = useMemo(
    () => catalog.find((item) => item.card_type === cardType) || null,
    [catalog, cardType]
  );

  const unitPrice = Number(selectedCard?.price ?? 0);
  const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const total = subtotal + shippingFee;

  const handleCheckout = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (!customerName.trim()) throw new Error("Full name is required.");
      if (!email.trim()) throw new Error("Email is required.");
      if (!phone.trim()) throw new Error("Mobile number is required.");
      if (!address1.trim()) throw new Error("Address line 1 is required.");
      if (!city.trim()) throw new Error("City is required.");
      if (!province.trim()) throw new Error("Province is required.");
      if (!postalCode.trim()) throw new Error("Postal code is required.");
      if (!selectedCard) throw new Error("Please select an available card type.");
      if (quantity < 1) throw new Error("Quantity must be at least 1.");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const response = await fetch("/api/paymongo/create-order-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id || null,
          customerName,
          email,
          phone,
          cardType,
          quantity,
          address1,
          address2,
          city,
          province,
          postalCode,
          country,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to start checkout.");
      }

      if (!result.checkoutUrl) {
        throw new Error("No checkout URL returned.");
      }

      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      setError(err.message || "Failed to proceed to payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Order SabiCards</h1>
            <p className="text-gray-600">
              Order physical NFC cards and have them shipped to your address.
            </p>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-6">
              {error}
            </div>
          ) : null}

          {loadingCatalog ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading card catalog...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Card Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Card Type</label>
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-full"
                      >
                        {catalog.map((item) => (
                          <option key={item.card_type} value={item.card_type}>
                            {item.name} — ₱{item.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                        className="border rounded-lg px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                    <input
                      type="text"
                      placeholder="Mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full md:col-span-2"
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Address line 1"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full md:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="Address line 2 (optional)"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full md:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="City / Municipality"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                    <input
                      type="text"
                      placeholder="Province / State"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                    <input
                      type="text"
                      placeholder="Postal code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Notes</h2>
                  <textarea
                    rows={4}
                    placeholder="Special shipping instructions, preferred contact time, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border rounded-lg px-3 py-2 w-full"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 h-fit">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Card Type</span>
                    <span className="font-medium">{selectedCard?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unit Price</span>
                    <span className="font-medium">₱{unitPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">₱{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span className="font-medium">₱{shippingFee}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">₱{total}</span>
                  </div>
                </div>

                <div className="mt-6 text-xs text-gray-600 space-y-2">
                  <p>Payment is one-time only for this card order.</p>
                  <p>Shipping will be processed after payment confirmation.</p>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full mt-6 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-3 font-medium disabled:opacity-60"
                >
                  {submitting ? "Redirecting..." : "Proceed to Payment"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}