import { Link, useNavigate } from "react-router";
import { FormEvent, useEffect, useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import sabiLogo from "../assets/sabi-logo.png";

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setError("");

        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : "";
        const hashParams = new URLSearchParams(hash);

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (type === "recovery" && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error(
            "Reset link is invalid or expired. Please request a new password reset email."
          );
        }

        setCanReset(true);
      } catch (err: any) {
        setError(
          err.message ||
            "Unable to verify reset link. Please request a new one."
        );
        setCanReset(false);
      } finally {
        setLoadingSession(false);
      }
    };

    init();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!canReset) {
        throw new Error("Reset session is not valid.");
      }

      if (!password || !confirmPassword) {
        throw new Error("Please fill in both password fields.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess("Your password has been updated successfully.");

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-gray-600">Create a new password for your account</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          {loadingSession ? (
            <p className="text-sm text-gray-600">Verifying reset link...</p>
          ) : (
            <>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="••••••••"
                      className="border rounded-lg px-3 py-2 pl-10 pr-10 w-full"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!canReset}
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

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="••••••••"
                      className="border rounded-lg px-3 py-2 pl-10 pr-10 w-full"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={!canReset}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
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
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={saving || !canReset}
                  className="block w-full text-center bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-3 disabled:opacity-60"
                >
                  {saving ? "Updating Password..." : "Update Password"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-6">
                Remembered your password?{" "}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}