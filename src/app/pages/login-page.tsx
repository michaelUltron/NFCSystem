import { Link, useNavigate, useSearchParams } from "react-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";
import { clearPendingCardUid } from "../lib/card-session";
import { getMyProfile } from "../lib/profile-service";
import { isProfileReady } from "../lib/onboarding";
import sabiLogo from "../assets/sabi-logo.png";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!next.startsWith("/activate")) {
        clearPendingCardUid();
      }

      if (next === "/dashboard") {
        const profile = await getMyProfile();
        const needsCardSetup = !isProfileReady(profile);

        if (needsCardSetup) {
          navigate("/onboarding", { replace: true });
          return;
        }
      }

      navigate(next);
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setResettingPassword(true);
      setError("");
      setSuccess("");

      if (!email.trim()) {
        throw new Error("Please enter your email first.");
      }

      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) throw error;

      setSuccess(
        "Password reset email sent. Please check your inbox and spam folder."
      );
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img
              src={sabiLogo}
              alt="SabiCard"
              className="w-10 h-10 object-contain"
            />
            <span className="font-semibold text-2xl">SabiCard</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  className="border rounded-lg px-3 py-2 pl-10 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  className="border rounded-lg px-3 py-2 pl-10 pr-10 w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resettingPassword}
                className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
              >
                {resettingPassword ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="block w-full text-center bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-3 disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              to={`/register?next=${encodeURIComponent(next)}`}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
