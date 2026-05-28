import { Link, useNavigate, useSearchParams } from "react-router";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";
import sabiLogo from "../assets/sabi-logo.png";
import { GoogleLogo } from "../components/google-logo";

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const next = searchParams.get("next") || "/dashboard";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!fullName.trim()) {
        throw new Error("Full name is required.");
      }

      if (!email.trim()) {
        throw new Error("Email is required.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { data: exists, error: existsError } = await supabase.rpc(
        "is_email_already_registered",
        {
          p_email: email.trim(),
        }
      );

      if (existsError) throw existsError;

      if (exists) {
        throw new Error("This email is already registered.");
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      // Optional: update profile full name if your trigger only inserts id/email
      if (data.user?.id) {
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      }

      setSuccess("Account created successfully. You may now sign in.");
      setTimeout(() => {
        navigate(`/login?next=${encodeURIComponent(next)}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      setSuccess("");

      const redirectTo = `${window.location.origin}${next}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || "Google sign up failed.");
      setGoogleLoading(false);
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
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-600">Get started with SabiCard</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <GoogleLogo />
            {googleLoading ? "Connecting to Google..." : "Sign up with Google"}
          </button>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              or
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="fullName"
                  placeholder="Juan Dela Cruz"
                  className="border rounded-lg px-3 py-2 pl-10 w-full"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
              >
                Confirm Password
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
                  required
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
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="block w-full text-center bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-3 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to={`/login?next=${encodeURIComponent(next)}`}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
