import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  Download,
  Phone,
  Mail,
  Globe,
  Send,
  QrCode,
  X,
} from "lucide-react";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import sabiLogo from "../assets/sabi-logo.png";
import {
  getPublicProfileByUsername,
  getPublicSocialLinksByUserId,
  type ProfileRow,
  type SocialLinkRow,
} from "../lib/profile-service";
import { createLead } from "../lib/lead-service";
import { canUseLeads } from "../lib/subscription-service";
import { supabase } from "../lib/supabase";
import { buildPublicCardUrl } from "../lib/app-config";

const socialIcons: Record<string, any> = {
  linkedin: FaLinkedin,
  instagram: FaInstagram,
  facebook: FaFacebook,
  twitter: FaTwitter,
  whatsapp: FaWhatsapp,
};

function getThemeClasses(theme?: string | null) {
  switch (theme) {
    case "minimal":
      return {
        pageBg: "bg-gray-100",
        cardBg: "bg-white",
        headerBg: "bg-gray-900",
        avatarFallback: "bg-gray-200 text-gray-800",
        primaryButton: "bg-gray-900 text-white hover:bg-black",
        secondaryButton:
          "border-2 border-gray-300 text-gray-700 hover:bg-gray-50",
        socialButton: "bg-gray-100 hover:bg-gray-200 text-gray-700",
        accentText: "text-gray-900",
        mutedText: "text-gray-600",
        footerText: "text-gray-500",
        modalBg: "bg-white",
      };

    case "modern":
      return {
        pageBg: "bg-gradient-to-br from-violet-50 via-fuchsia-50 to-sky-50",
        cardBg: "bg-white",
        headerBg: "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600",
        avatarFallback: "bg-violet-100 text-violet-700",
        primaryButton: "bg-violet-600 text-white hover:bg-violet-700",
        secondaryButton:
          "border-2 border-violet-200 text-violet-700 hover:bg-violet-50",
        socialButton: "bg-violet-50 hover:bg-violet-100 text-violet-700",
        accentText: "text-violet-700",
        mutedText: "text-gray-600",
        footerText: "text-gray-500",
        modalBg: "bg-white",
      };

    case "dark":
      return {
        pageBg: "bg-gradient-to-br from-slate-950 to-slate-800",
        cardBg: "bg-slate-900 text-white",
        headerBg: "bg-gradient-to-r from-slate-700 to-slate-900",
        avatarFallback: "bg-slate-700 text-white",
        primaryButton: "bg-white text-slate-900 hover:bg-slate-200",
        secondaryButton:
          "border-2 border-slate-600 text-slate-100 hover:bg-slate-800",
        socialButton: "bg-slate-800 hover:bg-slate-700 text-white",
        accentText: "text-white",
        mutedText: "text-slate-300",
        footerText: "text-slate-400",
        modalBg: "bg-slate-900 text-white",
      };

    case "default":
    default:
      return {
        pageBg: "bg-gradient-to-br from-indigo-50 to-blue-50",
        cardBg: "bg-white",
        headerBg: "bg-gradient-to-r from-indigo-600 to-blue-600",
        avatarFallback: "bg-indigo-100 text-indigo-600",
        primaryButton: "bg-indigo-600 text-white hover:bg-indigo-700",
        secondaryButton:
          "border-2 border-gray-300 text-gray-700 hover:bg-gray-50",
        socialButton: "bg-gray-100 hover:bg-indigo-100 text-gray-700",
        accentText: "text-indigo-600",
        mutedText: "text-gray-600",
        footerText: "text-gray-500",
        modalBg: "bg-white",
      };
  }
}

export function DigitalCardPage() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [socials, setSocials] = useState<SocialLinkRow[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [ownerPlan, setOwnerPlan] = useState("free");

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState("");
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!username) {
        setError("Missing username.");
        setLoading(false);
        return;
      }

      try {
        const publicProfile = await getPublicProfileByUsername(username);
        setProfile(publicProfile);

        const links = await getPublicSocialLinksByUserId(publicProfile.id);
        setSocials(links);

        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("plan")
          .eq("user_id", publicProfile.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!subError && subData?.plan) {
          setOwnerPlan(subData.plan);
        } else {
          setOwnerPlan("free");
        }
      } catch (err: any) {
        setError(err.message || "Card not found.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  const themeClasses = useMemo(
    () => getThemeClasses(profile?.theme),
    [profile?.theme]
  );

  const initials = useMemo(() => {
    const name = profile?.full_name?.trim() || "SC";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile?.full_name]);

const publicCardUrl = useMemo(() => {
  if (!username) return window.location.href;
  return buildPublicCardUrl(username);
}, [username]);

  const handleSaveContact = () => {
    if (!profile) return;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.full_name ?? ""}
ORG:${profile.company ?? ""}
TITLE:${profile.position ?? ""}
TEL:${profile.phone ?? ""}
EMAIL:${profile.email ?? ""}
URL:${profile.website ?? ""}
NOTE:${profile.bio ?? ""}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.full_name || "contact"}.vcf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    setLeadError("");
    setLeadSuccess("");

    if (!leadName.trim() || !leadEmail.trim()) {
      setLeadError("Name and email are required.");
      return;
    }

    try {
      setSubmittingLead(true);

      await createLead({
        user_id: profile.id,
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        company: leadCompany,
        message: leadMessage,
      });

      setLeadSuccess("Your details have been sent successfully.");
      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadCompany("");
      setLeadMessage("");
    } catch (err: any) {
      setLeadError(err.message || "Failed to send your details.");
    } finally {
      setSubmittingLead(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${themeClasses.pageBg}`}
      >
        <div className={`rounded-2xl shadow-xl p-8 ${themeClasses.cardBg}`}>
          Loading card...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${themeClasses.pageBg}`}
      >
        <div
          className={`max-w-md w-full rounded-2xl shadow-xl p-8 text-center ${themeClasses.cardBg}`}
        >
          <h1 className="text-2xl font-bold mb-2">Card not found</h1>
          <p className={themeClasses.mutedText}>
            {error || "This profile is unavailable."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${themeClasses.pageBg}`}
      >
        <div
          className={`max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden ${themeClasses.cardBg}`}
        >
          <div className={`h-32 ${themeClasses.headerBg}`}></div>

          <div className="px-6 pb-8">
            <div className="flex justify-center -mt-16 mb-4">
              <div className="relative">
                {profile.avatar_url ? (
                  <ImageWithFallback
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profile photo"}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div
                    className={`w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold ${themeClasses.avatarFallback}`}
                  >
                    {initials}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">
                {profile.full_name || "Unnamed User"}
              </h1>
              <p className={`text-lg mb-1 ${themeClasses.mutedText}`}>
                {profile.position || ""}
              </p>
              <p className={themeClasses.mutedText}>{profile.company || ""}</p>
            </div>

            {profile.bio ? (
              <p className={`text-center mb-6 text-sm ${themeClasses.mutedText}`}>
                {profile.bio}
              </p>
            ) : null}

            <div className="space-y-3 mb-6">
              <button
                onClick={handleSaveContact}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-medium ${themeClasses.primaryButton}`}
              >
                <Download className="w-5 h-5" />
                Save Contact
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-medium ${themeClasses.secondaryButton}`}
              >
                <QrCode className="w-5 h-5" />
                Show QR Code
              </button>

              <div className="grid grid-cols-2 gap-3">
                {profile.phone ? (
                  <a
                    href={`tel:${profile.phone}`}
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </a>
                ) : null}

                {profile.email ? (
                  <a
                    href={`mailto:${profile.email}`}
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </a>
                ) : null}
              </div>

              {profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                >
                  <Globe className="w-5 h-5" />
                  Visit Website
                </a>
              ) : null}
            </div>

            {socials.length > 0 ? (
              <div className="border-t pt-6 mb-6">
                <h3
                  className={`text-center text-sm font-medium mb-4 ${themeClasses.mutedText}`}
                >
                  Connect on Social
                </h3>
                <div className="flex justify-center gap-4 flex-wrap">
                  {socials.map((social) => {
                    const Icon = socialIcons[social.platform];
                    if (!Icon) return null;

                    const href =
                      social.platform === "whatsapp" &&
                      !social.url.startsWith("http")
                        ? `https://wa.me/${social.url.replace(/\D/g, "")}`
                        : social.url;

                    return (
                      <a
                        key={social.id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${themeClasses.socialButton}`}
                        aria-label={social.platform}
                      >
                        <Icon className="w-6 h-6" />
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {canUseLeads(ownerPlan) ? (
              <div className="border-t pt-6">
                <h3 className="text-center text-lg font-semibold mb-4">
                  Leave Your Details
                </h3>

                <form onSubmit={handleSubmitLead} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    className="border rounded-lg px-3 py-3 w-full"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                  />

                  <input
                    type="email"
                    placeholder="Your email"
                    className="border rounded-lg px-3 py-3 w-full"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Phone number"
                    className="border rounded-lg px-3 py-3 w-full"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Company"
                    className="border rounded-lg px-3 py-3 w-full"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                  />

                  <textarea
                    placeholder="Message"
                    rows={4}
                    className="border rounded-lg px-3 py-3 w-full"
                    value={leadMessage}
                    onChange={(e) => setLeadMessage(e.target.value)}
                  />

                  {leadError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {leadError}
                    </div>
                  ) : null}

                  {leadSuccess ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      {leadSuccess}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submittingLead}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-medium disabled:opacity-60 ${themeClasses.primaryButton}`}
                  >
                    <Send className="w-4 h-4" />
                    {submittingLead ? "Sending..." : "Send Details"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="border-t pt-6 text-center">
                <p className={`text-sm ${themeClasses.mutedText}`}>
                  Lead capture is available on Pro and Business plans.
                </p>
              </div>
            )}

            <div
              className={`text-center mt-8 text-sm flex items-center justify-center gap-2 ${themeClasses.footerText}`}
            >
              <img
                src={sabiLogo}
                alt="SabiCard"
                className="w-5 h-5 object-contain"
              />
              Powered by SabiCard
            </div>
          </div>
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            className={`rounded-2xl shadow-2xl max-w-sm w-full p-6 relative ${themeClasses.modalBg}`}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Scan QR Code</h2>
              <p className={`text-sm mb-6 ${themeClasses.mutedText}`}>
                Scan to open this SabiCard profile
              </p>

              <div className="bg-white p-4 rounded-xl border inline-block">
                <QRCodeCanvas value={publicCardUrl} size={220} includeMargin />
              </div>

              <p className={`text-xs mt-4 break-all ${themeClasses.mutedText}`}>
                {publicCardUrl}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}