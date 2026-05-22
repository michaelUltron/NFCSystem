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
  getTrialFeatureAccess,
  getPlanLabel,
  type TrialFeatureAccess,
} from "../lib/subscription-service";
import {
  KeyRound,
  LogOut,
  Palette,
  Save,
  ShieldAlert,
  User,
  BadgeCheck,
  Check,
} from "lucide-react";

const themeOptions = [
  {
    value: "default",
    label: "Default",
    description: "Classic centered profile",
    swatch: "from-indigo-600 to-blue-600",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Clean monochrome card",
    swatch: "from-gray-800 to-gray-950",
  },
  {
    value: "modern",
    label: "Modern",
    description: "Bright gradient profile",
    swatch: "from-violet-600 via-fuchsia-600 to-sky-600",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Deep contrast layout",
    swatch: "from-slate-700 to-slate-950",
  },
  {
    value: "signature",
    label: "Signature",
    description: "Premium editorial card",
    swatch: "from-[#101815] to-[#b9f27c]",
  },
  {
    value: "executive",
    label: "Executive",
    description: "Sharp business profile",
    swatch: "from-[#171717] to-[#d7c39a]",
  },
  {
    value: "aurora",
    label: "Aurora",
    description: "Portrait-forward design",
    swatch: "from-emerald-500 via-sky-500 to-fuchsia-500",
  },
  {
    value: "sunrise",
    label: "Sunrise",
    description: "Cover-first social card",
    swatch: "from-rose-500 via-orange-400 to-amber-300",
  },
  {
    value: "heritage",
    label: "Heritage",
    description: "Warm vCard-inspired style",
    swatch: "from-[#6f442c] to-[#f6efe8]",
  },
];

function ThemePreview({
  value,
  swatch,
}: {
  value: string;
  swatch: string;
}) {
  const isEditorial = value === "signature" || value === "executive";
  const isPortrait = value === "aurora" || value === "sunrise";
  const isHeritage = value === "heritage";
  const darkCard = value === "dark" || value === "signature" || value === "executive";

  if (isHeritage) {
    return (
      <div className="h-32 overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className={`relative h-16 bg-gradient-to-br ${swatch}`}>
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute left-1/2 top-5 h-10 w-10 -translate-x-1/2 rounded-full border-2 border-white bg-white/80" />
        </div>
        <div
          className="-mt-3 bg-white px-3 pb-3 pt-5"
          style={{ clipPath: "polygon(0 13%, 100% 0, 100% 100%, 0 100%)" }}
        >
          <div className="mx-auto mb-2 h-2 w-20 rounded-full bg-[#8b5638]" />
          <div className="grid grid-cols-3 gap-1">
            <div className="h-6 rounded bg-[#f8f1ec]" />
            <div className="h-6 rounded bg-[#f8f1ec]" />
            <div className="h-6 rounded bg-[#f8f1ec]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-32 overflow-hidden border shadow-sm ${
        isEditorial ? "rounded-sm" : isPortrait ? "rounded-xl" : "rounded-lg"
      } ${darkCard ? "bg-slate-950" : "bg-white"}`}
    >
      <div
        className={`relative ${
          isPortrait ? "h-16" : isEditorial ? "h-12" : "h-10"
        } bg-gradient-to-r ${swatch}`}
      />
      <div
        className={`px-3 pb-3 ${
          isPortrait ? "-mt-6" : isEditorial ? "-mt-4" : "-mt-5"
        }`}
      >
        <div
          className={`relative mb-3 border-2 ${
            isEditorial
              ? "h-10 w-10 rounded border-current"
              : isPortrait
              ? "mx-auto h-12 w-12 rounded-xl border-white"
              : "mx-auto h-11 w-11 rounded-full border-white"
          } ${darkCard ? "bg-white/20" : "bg-gray-100"}`}
        />
        <div
          className={`mb-2 h-2 rounded-full ${
            isEditorial ? "w-24" : "mx-auto w-20"
          } ${darkCard ? "bg-white/70" : "bg-gray-800"}`}
        />
        <div
          className={`h-2 rounded-full ${
            isEditorial ? "w-16" : "mx-auto w-14"
          } ${darkCard ? "bg-white/30" : "bg-gray-300"}`}
        />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [theme, setTheme] = useState("default");
  const [plan, setPlan] = useState("free");
  const [access, setAccess] = useState<TrialFeatureAccess | null>(null);

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
        const currentAccess = getTrialFeatureAccess(subscription);

        setEmail(result.profile.email || result.user.email || "");
        setFullName(result.profile.full_name || "");
        setUsername(result.profile.username || "");
        setTheme(result.profile.theme || "default");
        setPlan(subscription?.plan || "free");
        setAccess(currentAccess);
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

      if (!access?.canUseThemes) {
        throw new Error(
          "Your free trial for theme customization has ended. Upgrade to Pro or Business to keep using themes."
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
                {access?.trialActive ? (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
                    Theme customization and personal branding tools are free for{" "}
                    <strong>{access.trialDaysRemaining}</strong>{" "}
                    {access.trialDaysRemaining === 1 ? "day" : "days"} on your
                    current trial.
                  </div>
                ) : null}

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

                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900">
                        Public Card Theme
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Choose a visual style for your public digital card.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {themeOptions.map((option) => {
                        const selected = theme === option.value;
                        return (
                          <button
                            type="button"
                            key={option.value}
                            onClick={() => setTheme(option.value)}
                            disabled={!access?.canUseThemes}
                            className={`group rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                              selected
                                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm"
                            }`}
                          >
                            <ThemePreview
                              value={option.value}
                              swatch={option.swatch}
                            />

                            <div className="mt-3 flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {option.label}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {option.description}
                                </p>
                              </div>

                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                  selected
                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                    : "border-gray-300 text-transparent"
                                }`}
                              >
                                <Check className="h-4 w-4" />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {!access?.canUseThemes ? (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        <p className="font-semibold text-amber-800">
                          Free trial ended
                        </p>
                        <p>
                          Your 7-day free trial for theme customization and
                          better personal branding tools has ended. Upgrade to
                          Pro or Business to change your public card theme.
                        </p>
                        <a
                          href="/plans"
                          className="mt-3 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700"
                        >
                          View Plans
                        </a>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleSaveTheme}
                      disabled={savingTheme || !access?.canUseThemes}
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
