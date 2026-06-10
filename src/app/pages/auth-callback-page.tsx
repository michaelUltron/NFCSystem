import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { LoaderCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import sabiLogo from "../assets/sabi-logo.png";

function getSafeNext(value?: string | null) {
  if (!value || !value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

function isRecentlyCreated(createdAt?: string) {
  if (!createdAt) return false;

  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return false;

  return Date.now() - createdTime < 5 * 60 * 1000;
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Finishing sign in...");

  useEffect(() => {
    const finishAuth = async () => {
      const next = getSafeNext(searchParams.get("next"));

      try {
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("No active session found.");
        }

        if (isRecentlyCreated(session.user.created_at)) {
          await supabase
            .from("profiles")
            .update({
              theme: "signature",
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.user.id);
        }

        navigate(next, { replace: true });
      } catch {
        setMessage("We could not finish Google sign in. Please try again.");
        window.setTimeout(() => {
          navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
        }, 1500);
      }
    };

    finishAuth();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-md">
        <img
          src={sabiLogo}
          alt="SabiCard"
          className="mx-auto mb-4 h-12 w-12 object-contain"
        />
        <LoaderCircle className="mx-auto mb-4 h-6 w-6 animate-spin text-indigo-600" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
