import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CreditCard } from "lucide-react";
import { getCardTapDestination } from "../lib/tap-service";
import { logCardTap } from "../lib/analytics-service";

export function TapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cardUid = useMemo(() => searchParams.get("uid") ?? "", [searchParams]);

  const [message, setMessage] = useState("Checking card...");
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!cardUid) {
        setError("Missing card UID.");
        return;
      }

      try {
        const result = await getCardTapDestination(cardUid);

        if (result.status === "active" && result.username) {
          try {
            await logCardTap(cardUid);
          } catch (tapError) {
            console.error("Tap logging failed:", tapError);
          }

          setMessage("Opening digital card...");
          navigate(`/card/${result.username}`, { replace: true });
          return;
        }

        if (result.status === "inactive") {
          setMessage("Redirecting to activation...");
          navigate(`/activate?uid=${encodeURIComponent(cardUid)}`, {
            replace: true,
          });
          return;
        }

        if (result.status === "blocked") {
          setError("This card has been blocked by the owner.");
          return;
        }

        if (result.status === "disabled") {
          setError("This card is disabled.");
          return;
        }

        setError("This card is not available.");
      } catch (err: any) {
        setError(err.message || "Unable to process card tap.");
      }
    };

    run();
  }, [cardUid, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-8 h-8 text-indigo-600" />
        </div>

        <h1 className="text-2xl font-bold mb-3">SabiCard</h1>

        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}