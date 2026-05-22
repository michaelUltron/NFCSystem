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
  Building2,
  MapPin,
  Share2,
  Copy,
  MessageCircle,
} from "lucide-react";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaFacebookMessenger,
  FaTelegram,
  FaViber,
} from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import sabiLogo from "../assets/sabi-logo.png";
import {
  getPublicProfileByUsername,
  getPublicSocialLinksByUserId,
  getPublicProfileBrandingByUserId,
  type ProfileRow,
  type SocialLinkRow,
  type PublicOrganizationBrandingRow,
} from "../lib/profile-service";
import {
  createLeadFromCard,
  createLeadForProfile,
} from "../lib/lead-service";
import {
  logProfileView,
  logProfileViewForProfile,
  logQrView,
} from "../lib/analytics-service";
import { canUseLeads } from "../lib/subscription-service";
import { supabase } from "../lib/supabase";
import { buildPublicCardUrl } from "../lib/app-config";
import { getPendingCardUid } from "../lib/card-session";

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
  const [organizationBranding, setOrganizationBranding] =
    useState<PublicOrganizationBrandingRow | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [ownerPlan, setOwnerPlan] = useState("free");
  const [cardUid, setCardUid] = useState<string | null>(null);

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState("");
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!username) {
        setError("Missing username.");
        setLoading(false);
        return;
      }

      try {
        const publicProfile = await getPublicProfileByUsername(username);
        if (cancelled) return;

        setProfile(publicProfile);

        const urlParams = new URLSearchParams(window.location.search);
        const uidFromUrl = urlParams.get("uid");
        const uidFromSession = getPendingCardUid();
        const resolvedUid = uidFromUrl || uidFromSession || null;

        setCardUid(resolvedUid);
        setLoading(false);

        const [linksResult, brandingResult, planResult] = await Promise.allSettled([
          getPublicSocialLinksByUserId(publicProfile.id),
          getPublicProfileBrandingByUserId(publicProfile.id),
          supabase.rpc("get_public_user_plan", {
            p_user_id: publicProfile.id,
          }),
        ]);

        if (cancelled) return;

        if (linksResult.status === "fulfilled") {
          setSocials(linksResult.value);
        }

        if (brandingResult.status === "fulfilled") {
          setOrganizationBranding(brandingResult.value);
        }

        if (
          planResult.status === "fulfilled" &&
          !planResult.value.error &&
          planResult.value.data
        ) {
          setOwnerPlan(planResult.value.data);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Card not found.");
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    if (!profile) return;

    const run = async () => {
      try {
        if (cardUid) {
          await logProfileView(cardUid);
        } else {
          await logProfileViewForProfile(profile.id);
        }
      } catch {
        // analytics failure should not break public card rendering
      }
    };

    run();
  }, [cardUid, profile]);

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

    if (cardUid) {
      return `${buildPublicCardUrl(username)}?uid=${encodeURIComponent(cardUid)}`;
    }

    return buildPublicCardUrl(username);
  }, [username, cardUid]);

  const shareText = useMemo(() => {
    const name = profile?.full_name || "this SabiCard profile";
    return `Open ${name}'s digital business card`;
  }, [profile?.full_name]);

  const displayCompany = useMemo(() => {
    return organizationBranding?.organization_name || profile?.company || "";
  }, [organizationBranding, profile?.company]);

  const displayTagline = useMemo(() => {
    return organizationBranding?.brand_tagline || "";
  }, [organizationBranding]);

  const locationHref = useMemo(() => {
    const url = profile?.location_url?.trim();
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    return `https://${url}`;
  }, [profile?.location_url]);

  const brandHeaderStyle = useMemo(() => {
    if (
      organizationBranding?.brand_primary_color &&
      organizationBranding?.brand_secondary_color
    ) {
      return {
        background: `linear-gradient(to right, ${organizationBranding.brand_primary_color}, ${organizationBranding.brand_secondary_color})`,
      };
    }

    if (organizationBranding?.brand_primary_color) {
      return {
        background: organizationBranding.brand_primary_color,
      };
    }

    return undefined;
  }, [organizationBranding]);

  const handleSaveContact = () => {
    if (!profile) return;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.full_name ?? ""}
ORG:${displayCompany}
TITLE:${profile.position ?? ""}
TEL:${profile.phone ?? ""}
EMAIL:${profile.email ?? ""}
URL:${profile.website ?? ""}
ADR;TYPE=WORK:;;${profile.location_label ?? ""};;;;
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

  const handleNativeShare = async () => {
    const nextOpen = !showShareOptions;

    await handleCopyProfileLink();
    setShareMessage(
      nextOpen
        ? "Profile link copied. Choose an app, then paste it there."
        : "Profile link copied."
    );
    setShowShareOptions(nextOpen);
  };

  const handleCopyProfileLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(publicCardUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = publicCardUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setShareMessage("Profile link copied.");
    } catch {
      setShareMessage("Could not copy the link.");
    }
  };

  const encodedUrl = encodeURIComponent(publicCardUrl);
  const encodedText = encodeURIComponent(`${shareText}: ${publicCardUrl}`);

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

      if (cardUid) {
        await createLeadFromCard({
          card_uid: cardUid,
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          company: leadCompany,
          message: leadMessage,
        });
      } else {
        await createLeadForProfile({
          user_id: profile.id,
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          company: leadCompany,
          message: leadMessage,
        });
      }

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
          <div
            className={`h-32 ${!brandHeaderStyle ? themeClasses.headerBg : ""}`}
            style={brandHeaderStyle}
          ></div>

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

            {organizationBranding ? (
              <div className="flex flex-col items-center mb-4">
                {organizationBranding.organization_logo_url ? (
                  <img
                    src={organizationBranding.organization_logo_url}
                    alt={organizationBranding.organization_name}
                    className="w-16 h-16 rounded-xl object-cover border bg-white shadow-sm mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl border bg-white shadow-sm flex items-center justify-center mb-3">
                    <Building2 className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </div>
            ) : null}

            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">
                {profile.full_name || "Unnamed User"}
              </h1>

              <p className={`text-lg mb-1 ${themeClasses.mutedText}`}>
                {profile.position || ""}
              </p>

              <p className={themeClasses.mutedText}>{displayCompany}</p>

              {displayTagline ? (
                <p className={`text-sm mt-1 ${themeClasses.mutedText}`}>
                  {displayTagline}
                </p>
              ) : null}

              {profile.location_label ? (
                <p
                  className={`mt-3 text-sm flex items-center justify-center gap-2 ${themeClasses.mutedText}`}
                >
                  <MapPin className="w-4 h-4" />
                  {profile.location_label}
                </p>
              ) : null}
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
                onClick={async () => {
                  setShowQrModal(true);

                  if (cardUid) {
                    try {
                      await logQrView(cardUid);
                    } catch {
                      // ignore analytics errors
                    }
                  }
                }}
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

              {locationHref ? (
                <a
                  href={locationHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                >
                  <MapPin className="w-5 h-5" />
                  Open Location
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
            className={`relative flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl ${themeClasses.modalBg}`}
          >
            <div className="sticky top-0 z-20 flex justify-end bg-inherit px-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  setShowShareOptions(false);
                  setShareMessage("");
                }}
                className="rounded-full bg-white/90 p-2 text-gray-500 shadow-sm hover:text-gray-700"
                aria-label="Close QR dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 pb-6 pt-1 text-center">
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

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-medium ${themeClasses.primaryButton}`}
                >
                  <Share2 className="w-5 h-5" />
                  {showShareOptions
                    ? "Copy Link and Hide Apps"
                    : "Copy Link and Choose App"}
                </button>
              </div>

              {shareMessage ? (
                <p className={`text-sm mt-3 ${themeClasses.mutedText}`}>
                  {shareMessage}
                </p>
              ) : null}

              {showShareOptions ? (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <a
                    href={`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
                      shareText
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <FaTelegram className="w-5 h-5 text-sky-500" />
                    Telegram
                  </a>

                  <a
                    href={`https://www.messenger.com/t/?link=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <FaFacebookMessenger className="w-5 h-5 text-blue-600" />
                    Messenger
                  </a>

                  <a
                    href={`https://wa.me/?text=${encodedText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <FaWhatsapp className="w-5 h-5 text-green-600" />
                    WhatsApp
                  </a>

                  <a
                    href={`viber://forward?text=${encodedText}`}
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <FaViber className="w-5 h-5 text-purple-600" />
                    Viber
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <FaFacebook className="w-5 h-5 text-blue-700" />
                    Facebook
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <FaLinkedin className="w-5 h-5 text-blue-700" />
                    LinkedIn
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodedText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <FaTwitter className="w-5 h-5" />
                    X / Twitter
                  </a>

                  <a
                    href={`sms:?&body=${encodedText}`}
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    SMS
                  </a>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      "SabiCard profile"
                    )}&body=${encodedText}`}
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyProfileLink}
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 ${themeClasses.secondaryButton}`}
                  >
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
