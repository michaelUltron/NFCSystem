import { Link, useNavigate, useSearchParams } from "react-router";
import { CreditCard, CheckCircle, UserCircle, Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { savePendingCardUid, clearPendingCardUid } from "../lib/card-session";
import { activateCard, getMySubscriptionPlan } from "../lib/card-service";
import {
  getCardTapDestination,
  buildCardPublicPath,
  normalizeCardStatus,
} from "../lib/tap-service";
import sabiLogo from "../assets/sabi-logo.png";

export function ActivationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cardUid = useMemo(() => searchParams.get("uid") ?? "", [searchParams]);
  const activationPath = useMemo(
    () => (cardUid ? `/activate?uid=${cardUid}` : "/activate"),
    [cardUid]
  );

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState("Checking your card...");
  const [error, setError] = useState("");
  const [manualCardUid, setManualCardUid] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cardAlreadyOwned, setCardAlreadyOwned] = useState(false);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!cardUid) {
        clearPendingCardUid();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setMessage("Please sign in or create an account to activate your card.");
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        setMessage("Enter the UID printed on your NFC card or scan its QR code.");
        setLoading(false);
        return;
      }

      savePendingCardUid(cardUid);

      try {
        const cardInfo = await getCardTapDestination(cardUid);

        const cardStatus = normalizeCardStatus(cardInfo.status);

        if (cardStatus === "active") {
          setCardAlreadyOwned(true);

          if (cardInfo.username) {
            clearPendingCardUid();
            setMessage("This card is already activated. Opening the digital card...");
            setTimeout(() => {
              navigate(buildCardPublicPath(cardInfo.username!, cardUid), {
                replace: true,
              });
            }, 800);
            return;
          }

          setMessage(
            "This card is already activated under a business account and is currently in inventory or assigned internally."
          );
          setLoading(false);
          return;
        }

        if (cardStatus === "disabled") {
          clearPendingCardUid();
          setError("This card is disabled.");
          setLoading(false);
          return;
        }

        if (cardStatus === "blocked") {
          clearPendingCardUid();
          setError("This card is blocked.");
          setLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setMessage("Please sign in or create an account to activate your card.");
          setLoading(false);
          return;
        }

        setCurrentUser(user);

        const subscription = await getMySubscriptionPlan();
        const isBusiness =
          subscription?.plan?.toLowerCase() === "business" &&
          subscription?.status?.toLowerCase() === "active";

        setIsBusinessAccount(isBusiness);

        if (isBusiness) {
          setMessage(
            "You are signed in with a business account. Confirm to add this card to your business inventory."
          );
        } else {
          setMessage(
            "You are signed in. Confirm if you want to activate this card under your account."
          );
        }
      } catch (err: any) {
        clearPendingCardUid();
        setError(err.message || "Activation failed.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [cardUid, navigate]);

  const handleStartManualActivation = () => {
    const uid = manualCardUid.trim();

    if (!uid) {
      setError("Enter your card UID first.");
      return;
    }

    navigate(`/activate?uid=${encodeURIComponent(uid)}`);
  };

  const handleConfirmActivation = async () => {
    try {
      setActivating(true);
      setError("");
      setMessage(
        isBusinessAccount
          ? "Adding card to your business inventory..."
          : "Activating your card..."
      );

      await activateCard(cardUid);
      savePendingCardUid(cardUid);

      const updatedInfo = await getCardTapDestination(cardUid);

      const updatedStatus = normalizeCardStatus(updatedInfo.status);

      if (updatedStatus === "active" && updatedInfo.username) {
        setMessage("Card activated successfully. Opening your digital card...");
        setTimeout(() => {
          navigate(buildCardPublicPath(updatedInfo.username!, cardUid));
        }, 800);
        return;
      }

      if (updatedStatus === "active" && !updatedInfo.username) {
        setMessage("Card activated successfully. Finish your public profile next.");
        setTimeout(() => {
          navigate("/profile?onboarding=1");
        }, 800);
        return;
      }

      if (isBusinessAccount) {
        setMessage("Card added to your business inventory successfully.");
        setTimeout(() => {
          navigate("/business/cards");
        }, 900);
        return;
      }

      setMessage("Card activated successfully. Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (err: any) {
      clearPendingCardUid();
      setError(
        err.message ||
          "Activation failed. This card may already be assigned to another user."
      );
    } finally {
      setActivating(false);
    }
  };

  const handleUseAnotherAccount = async () => {
    clearPendingCardUid();
    await supabase.auth.signOut();
    savePendingCardUid(cardUid);
    navigate(`/login?next=${encodeURIComponent(`/activate?uid=${cardUid}`)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img
              src={sabiLogo}
              alt="SabiCard"
              className="w-12 h-12 object-contain"
            />
            <span className="font-semibold text-2xl">SabiCard</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-indigo-600" />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">
            Activate Your NFC Card
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Welcome! Let&apos;s get your digital business card set up.
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="cardUid" className="block text-sm font-medium mb-2">
                Card UID
              </label>
              <input
                type="text"
                id="cardUid"
                value={cardUid || manualCardUid}
                onChange={(e) => {
                  setManualCardUid(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter card UID"
                className={`border rounded-lg px-4 py-3 w-full font-mono ${
                  cardUid ? "bg-gray-50" : "bg-white"
                }`}
                readOnly={!!cardUid}
              />
            </div>

            {currentUser ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Signed in as</span>
                </div>
                <p>{currentUser.email}</p>

                {isBusinessAccount ? (
                  <div className="mt-3 flex items-center gap-2 text-indigo-700">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      Business account detected
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700">
                {message}
              </div>
            )}

            {!loading && !error && !currentUser && !cardAlreadyOwned && (
              <div className="space-y-3 pt-2">
                <Link
                  to={`/login?next=${encodeURIComponent(activationPath)}`}
                  className="block w-full text-center bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-6 py-3 font-medium"
                >
                  Sign In & Activate
                </Link>
                <Link
                  to={`/register?next=${encodeURIComponent(activationPath)}`}
                  className="block w-full text-center border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3 font-medium"
                >
                  Create Account
                </Link>
              </div>
            )}

            {!loading && !error && currentUser && !cardUid && !cardAlreadyOwned && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleStartManualActivation}
                  className="block w-full text-center bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-6 py-3 font-medium"
                >
                  Continue Activation
                </button>
                <Link
                  to="/order"
                  className="block w-full text-center border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3 font-medium"
                >
                  Order a Card Instead
                </Link>
              </div>
            )}

            {!loading && !error && currentUser && cardUid && !cardAlreadyOwned && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleConfirmActivation}
                  disabled={activating}
                  className="block w-full text-center bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-6 py-3 font-medium disabled:opacity-60"
                >
                  {activating
                    ? isBusinessAccount
                      ? "Adding to Inventory..."
                      : "Activating..."
                    : isBusinessAccount
                    ? "Add to Business Inventory"
                    : "Confirm Activation"}
                </button>

                <button
                  onClick={handleUseAnotherAccount}
                  disabled={activating}
                  className="block w-full text-center border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3 font-medium"
                >
                  Use Another Account
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4 text-center">What you&apos;ll get:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Digital Business Card</strong> - Share your contact instantly
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Lead Capture</strong> - Collect contact details from viewers
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Analytics</strong> - Track taps and profile visits
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
