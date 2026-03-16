import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  getCurrentAccountSettings,
  updateMyPassword,
  updateMyTheme,
  signOutUser,
} from "../lib/settings-service";
import {
  getMySubscription,
  canUseThemes,
  getPlanLabel,
} from "../lib/subscription-service";
import {
  KeyRound,
  LogOut,
  Palette,
  Save,
  ShieldAlert,
  User,
  BadgeCheck,
} from "lucide-react";

const themeOptions = [
  { value: "default", label: "Default" },
  { value: "minimal", label: "Minimal" },
  { value: "modern", label: "Modern" },
  { value: "dark", label: "Dark" },
];

export function SettingsPage() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [theme, setTheme] = useState("default");
  const [plan, setPlan] = useState("free");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingTheme, setSavingTheme] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getCurrentAccountSettings();
        const subscription = await getMySubscription();

        setEmail(result.profile.email || result.user.email || "");
        setFullName(result.profile.full_name || "");
        setUsername(result.profile.username || "");
        setTheme(result.profile.theme || "default");
        setPlan(subscription?.plan || "free");
      } catch (err: any) {
        setError(err.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSaveTheme = async () => {
    try {
      setSavingTheme(true);
      setError("");
      setSuccess("");

      if (!canUseThemes(plan)) {
        throw new Error(
          "Theme customization is available on Pro and Business plans."
        );
      }

      await updateMyTheme(theme);
      setSuccess("Settings updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSavingTheme(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSavingPassword(true);
      setError("");
      setSuccess("");

      if (!newPassword || !confirmPassword) {
        throw new Error("Please fill in both password fields.");
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      await updateMyPassword(newPassword);

      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOutUser();
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Failed to sign out.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">Settings</h1>
              <p className="text-gray-600">
                Manage your account, password, and card preferences
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              <BadgeCheck className="w-4 h-4" />
              {getPlanLabel(plan)} Plan
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <p>Loading settings...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold">Account Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        readOnly
                        className="border rounded-lg px-3 py-2 w-full bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        readOnly
                        className="border rounded-lg px-3 py-2 w-full bg-gray-50"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="border rounded-lg px-3 py-2 w-full bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold">Card Theme</h2>
                  </div>

                  <div className="max-w-md">
                    <label className="block text-sm font-medium mb-2">
                      Public Card Theme
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="border rounded-lg px-3 py-2 w-full"
                      disabled={!canUseThemes(plan)}
                    >
                      {themeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {!canUseThemes(plan) ? (
                      <p className="text-sm text-amber-600 mt-2">
                        Theme customization is available on Pro and Business
                        plans.
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleSaveTheme}
                      disabled={savingTheme || !canUseThemes(plan)}
                      className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      {savingTheme ? "Saving..." : "Save Theme"}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold">Change Password</h2>
                  </div>

                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-full"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-full"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={savingPassword}
                      className="inline-flex items-center gap-2 bg-gray-900 text-white hover:bg-black rounded-lg px-4 py-2 disabled:opacity-60"
                    >
                      <KeyRound className="w-4 h-4" />
                      {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Status</h2>

                  {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
                      {error}
                    </div>
                  ) : null}

                  {success ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-4">
                      {success}
                    </div>
                  ) : null}

                  <p className="text-sm text-gray-600">
                    Update your account preferences and keep your SabiCard
                    secure.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <LogOut className="w-5 h-5 text-red-600" />
                    <h2 className="text-xl font-semibold">Session</h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full inline-flex items-center justify-center gap-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg px-4 py-3 disabled:opacity-60"
                  >
                    <LogOut className="w-4 h-4" />
                    {signingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <h2 className="text-xl font-semibold">Danger Zone</h2>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    Account deletion can be added later when you are ready for
                    that workflow.
                  </p>

                  <button
                    type="button"
                    disabled
                    className="w-full border border-gray-300 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed"
                  >
                    Delete Account Coming Soon
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}