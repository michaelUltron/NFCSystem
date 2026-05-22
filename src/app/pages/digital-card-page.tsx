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
import {
  canUseLeads,
  getPublicProfileFeatureAccess,
  type TrialFeatureAccess,
} from "../lib/subscription-service";
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

function escapeVCardValue(value?: string | null) {
  return (value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldVCardLine(line: string) {
  const limit = 75;
  const folded = [];

  for (let index = 0; index < line.length; index += limit) {
    folded.push(`${index === 0 ? "" : " "}${line.slice(index, index + limit)}`);
  }

  return folded.join("\r\n");
}

async function buildPhotoLine(avatarUrl?: string | null) {
  if (!avatarUrl) return "";

  try {
    const response = await fetch(avatarUrl, {
      mode: "cors",
    });

    if (!response.ok) return "";

    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) return "";

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = () => reject(new Error("Unable to read image."));
      reader.readAsDataURL(blob);
    });

    if (!base64) return "";

    const imageType = blob.type.includes("png") ? "PNG" : "JPEG";
    return foldVCardLine(`PHOTO;ENCODING=b;TYPE=${imageType}:${base64}`);
  } catch {
    return "";
  }
}

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

    case "signature":
      return {
        pageBg: "bg-[#eef1ec]",
        cardBg: "bg-[#101815] text-white",
        headerBg: "bg-[#b9f27c]",
        avatarFallback: "bg-[#b9f27c] text-[#101815]",
        primaryButton: "bg-[#b9f27c] text-[#101815] hover:bg-[#a6df68]",
        secondaryButton:
          "border border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]",
        socialButton: "bg-white/10 hover:bg-white/15 text-white",
        accentText: "text-[#b9f27c]",
        mutedText: "text-white/70",
        footerText: "text-white/45",
        modalBg: "bg-[#101815] text-white",
      };

    case "executive":
      return {
        pageBg: "bg-[#f3f4f1]",
        cardBg: "bg-[#171717] text-white",
        headerBg: "bg-[#d7c39a]",
        avatarFallback: "bg-[#d7c39a] text-[#171717]",
        primaryButton: "bg-[#d7c39a] text-[#171717] hover:bg-[#cbb584]",
        secondaryButton:
          "border border-white/15 bg-white/[0.07] text-white hover:bg-white/[0.12]",
        socialButton: "bg-white/10 hover:bg-white/15 text-white",
        accentText: "text-[#d7c39a]",
        mutedText: "text-white/68",
        footerText: "text-white/45",
        modalBg: "bg-[#171717] text-white",
      };

    case "aurora":
      return {
        pageBg: "bg-gradient-to-br from-emerald-50 via-sky-50 to-fuchsia-50",
        cardBg: "bg-white",
        headerBg: "bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500",
        avatarFallback: "bg-emerald-100 text-emerald-700",
        primaryButton: "bg-emerald-600 text-white hover:bg-emerald-700",
        secondaryButton:
          "border-2 border-sky-200 text-sky-800 hover:bg-sky-50",
        socialButton: "bg-emerald-50 hover:bg-sky-100 text-emerald-700",
        accentText: "text-emerald-700",
        mutedText: "text-gray-600",
        footerText: "text-gray-500",
        modalBg: "bg-white",
      };

    case "sunrise":
      return {
        pageBg: "bg-gradient-to-br from-rose-50 via-amber-50 to-white",
        cardBg: "bg-white",
        headerBg: "bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300",
        avatarFallback: "bg-rose-100 text-rose-700",
        primaryButton: "bg-rose-600 text-white hover:bg-rose-700",
        secondaryButton:
          "border-2 border-amber-200 text-rose-800 hover:bg-amber-50",
        socialButton: "bg-rose-50 hover:bg-amber-100 text-rose-700",
        accentText: "text-rose-700",
        mutedText: "text-gray-600",
        footerText: "text-gray-500",
        modalBg: "bg-white",
      };

    case "heritage":
      return {
        pageBg: "bg-[#f0e7df]",
        cardBg: "bg-[#8b5638] text-white",
        headerBg: "bg-[#6f442c]",
        avatarFallback: "bg-[#f6efe8] text-[#8b5638]",
        primaryButton: "bg-[#8b5638] text-white hover:bg-[#75462d]",
        secondaryButton:
          "border border-[#8b5638]/20 bg-white text-[#8b5638] hover:bg-[#f8f1ec]",
        socialButton: "bg-[#f8f1ec] hover:bg-[#eadbcc] text-[#8b5638]",
        accentText: "text-[#8b5638]",
        mutedText: "text-[#8a6b5d]",
        footerText: "text-[#9b7c6d]",
        modalBg: "bg-white",
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
  const [ownerAccess, setOwnerAccess] = useState<TrialFeatureAccess | null>(
    null
  );
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
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [username]);

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

        const [linksResult, brandingResult, planResult, accessResult] =
          await Promise.allSettled([
            getPublicSocialLinksByUserId(publicProfile.id),
            getPublicProfileBrandingByUserId(publicProfile.id),
            supabase.rpc("get_public_user_plan", {
              p_user_id: publicProfile.id,
            }),
            getPublicProfileFeatureAccess(publicProfile.id),
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

        if (accessResult.status === "fulfilled") {
          setOwnerAccess(accessResult.value);
          setOwnerPlan(accessResult.value.plan);
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

  const effectiveTheme =
    ownerAccess && !ownerAccess.canUseThemes ? "default" : profile?.theme;
  const effectiveCoverUrl =
    ownerAccess && !ownerAccess.canUseBranding
      ? ""
      : profile?.cover_photo_url || "";
  const leadCaptureAllowed = ownerAccess
    ? ownerAccess.canUseLeads
    : canUseLeads(ownerPlan);

  const themeClasses = useMemo(
    () => getThemeClasses(effectiveTheme),
    [effectiveTheme]
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

  const whatsappSocial = useMemo(
    () => socials.find((social) => social.platform === "whatsapp"),
    [socials]
  );

  const whatsappHref = useMemo(() => {
    if (!whatsappSocial?.url) return "";
    return whatsappSocial.url.startsWith("http")
      ? whatsappSocial.url
      : `https://wa.me/${whatsappSocial.url.replace(/\D/g, "")}`;
  }, [whatsappSocial]);

  const linkedinSocial = useMemo(
    () => socials.find((social) => social.platform === "linkedin"),
    [socials]
  );

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
    if (effectiveCoverUrl) {
      return undefined;
    }

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
  }, [organizationBranding, effectiveCoverUrl]);

  const isSignatureDesign = effectiveTheme === "signature";
  const isExecutiveDesign = effectiveTheme === "executive";
  const isAuroraDesign = effectiveTheme === "aurora";
  const isSunriseDesign = effectiveTheme === "sunrise";
  const isHeritageDesign = effectiveTheme === "heritage";
  const isEditorialDesign = isSignatureDesign || isExecutiveDesign;
  const isPortraitDesign = isAuroraDesign || isSunriseDesign;

  const handleSaveContact = async () => {
    if (!profile) return;

    const photoLine = await buildPhotoLine(profile.avatar_url);
    const vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${escapeVCardValue(profile.full_name)}`,
      `ORG:${escapeVCardValue(displayCompany)}`,
      `TITLE:${escapeVCardValue(profile.position)}`,
      `TEL:${escapeVCardValue(profile.phone)}`,
      `EMAIL:${escapeVCardValue(profile.email)}`,
      `URL:${escapeVCardValue(profile.website)}`,
      `ADR;TYPE=WORK:;;${escapeVCardValue(profile.location_label)};;;;`,
      `NOTE:${escapeVCardValue(profile.bio)}`,
      photoLine,
      "END:VCARD",
    ].filter(Boolean);

    const vcard = `${vcardLines.join("\r\n")}\r\n`;

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

    if (!leadCaptureAllowed) {
      setLeadError("Lead capture is not available for this card.");
      return;
    }

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
        className={`min-h-screen flex items-center justify-center p-4 ${
          isSignatureDesign ? "bg-[#eef1ec]" : themeClasses.pageBg
        }`}
      >
        <div
          className={`w-full overflow-hidden shadow-2xl ${
            isSignatureDesign
              ? "max-w-md rounded-[2rem] bg-[#101815] text-white"
              : isHeritageDesign
              ? "max-w-sm rounded-[1.6rem] bg-white text-[#382318]"
              : isExecutiveDesign
              ? "max-w-2xl rounded-sm border border-[#d7c39a]/30 bg-[#171717] text-white"
              : isAuroraDesign
              ? "max-w-md rounded-[2.25rem] border border-white/70 bg-white"
              : isSunriseDesign
              ? "max-w-md rounded-[2rem] bg-white"
              : `max-w-lg rounded-2xl ${themeClasses.cardBg}`
          }`}
        >
          {isHeritageDesign ? (
            <>
              <div
                className="relative h-64 overflow-hidden bg-[#6f442c]"
                style={brandHeaderStyle}
              >
                {effectiveCoverUrl ? (
                  <>
                    <ImageWithFallback
                      src={effectiveCoverUrl}
                      alt={`${profile.full_name || "Profile"} cover photo`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#4b2d1e]/55 to-[#4b2d1e]/80" />
                  </>
                ) : null}

                <div className="absolute inset-x-0 top-10 flex justify-center">
                  {profile.avatar_url ? (
                    <ImageWithFallback
                      src={profile.avatar_url}
                      alt={profile.full_name || "Profile photo"}
                      className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-xl"
                    />
                  ) : (
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-2xl font-bold shadow-xl ${themeClasses.avatarFallback}`}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                <div className="absolute inset-x-6 bottom-16 text-center text-white">
                  <h1 className="text-2xl font-serif font-semibold leading-tight tracking-normal">
                    {profile.full_name || "Unnamed User"}
                  </h1>
                  <p className="mt-1 text-sm text-white/80">
                    {profile.position || displayCompany || "Digital Card"}
                  </p>
                </div>
              </div>

              <div
                className="relative -mt-10 bg-white px-6 pb-6 pt-12 text-[#382318]"
                style={{ clipPath: "polygon(0 9%, 100% 0, 100% 100%, 0 100%)" }}
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  {profile.phone ? (
                    <a
                      href={`tel:${profile.phone}`}
                      className="rounded-2xl p-2 text-sm text-[#7b4c32] hover:bg-[#f7efe8]"
                    >
                      <Phone className="mx-auto mb-2 h-5 w-5" />
                      <span className="block font-medium text-[#382318]">
                        Phone
                      </span>
                      <span className="text-xs text-[#8a6b5d]">Call me</span>
                    </a>
                  ) : null}

                  {profile.email ? (
                    <a
                      href={`mailto:${profile.email}`}
                      className="rounded-2xl p-2 text-sm text-[#7b4c32] hover:bg-[#f7efe8]"
                    >
                      <Mail className="mx-auto mb-2 h-5 w-5" />
                      <span className="block font-medium text-[#382318]">
                        Email
                      </span>
                      <span className="text-xs text-[#8a6b5d]">Message me</span>
                    </a>
                  ) : null}

                  {profile.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl p-2 text-sm text-[#7b4c32] hover:bg-[#f7efe8]"
                    >
                      <Globe className="mx-auto mb-2 h-5 w-5" />
                      <span className="block font-medium text-[#382318]">
                        Website
                      </span>
                      <span className="text-xs text-[#8a6b5d]">Visit</span>
                    </a>
                  ) : null}

                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl p-2 text-sm text-[#7b4c32] hover:bg-[#f7efe8]"
                    >
                      <FaWhatsapp className="mx-auto mb-2 h-5 w-5" />
                      <span className="block font-medium text-[#382318]">
                        WhatsApp
                      </span>
                      <span className="text-xs text-[#8a6b5d]">Chat now</span>
                    </a>
                  ) : locationHref ? (
                    <a
                      href={locationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl p-2 text-sm text-[#7b4c32] hover:bg-[#f7efe8]"
                    >
                      <MapPin className="mx-auto mb-2 h-5 w-5" />
                      <span className="block font-medium text-[#382318]">
                        Location
                      </span>
                      <span className="text-xs text-[#8a6b5d]">Open map</span>
                    </a>
                  ) : null}
                </div>

                {profile.bio ? (
                  <p className="mt-5 text-center text-sm leading-6 text-[#8a6b5d]">
                    {profile.bio}
                  </p>
                ) : null}

                <button
                  onClick={handleSaveContact}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8b5638] py-3 text-sm font-semibold text-white hover:bg-[#75462d]"
                >
                  <Download className="h-4 w-4" />
                  Get My vCard
                </button>

                <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-b-[1.25rem] bg-[#8b5638] text-xs font-medium text-white">
                  {linkedinSocial?.url ? (
                    <a
                      href={linkedinSocial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-3 hover:bg-white/10"
                    >
                      <FaLinkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="flex items-center justify-center gap-1 py-3 hover:bg-white/10"
                    >
                      <QrCode className="h-4 w-4" />
                      QR
                    </button>
                  )}

                  {profile.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 border-x border-white/20 py-3 hover:bg-white/10"
                    >
                      <Globe className="h-4 w-4" />
                      Web
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="flex items-center justify-center gap-1 border-x border-white/20 py-3 hover:bg-white/10"
                    >
                      <QrCode className="h-4 w-4" />
                      QR
                    </button>
                  )}

                  {profile.email ? (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center justify-center gap-1 py-3 hover:bg-white/10"
                    >
                      <Mail className="h-4 w-4" />
                      Mail
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="flex items-center justify-center gap-1 py-3 hover:bg-white/10"
                    >
                      <QrCode className="h-4 w-4" />
                      QR
                    </button>
                  )}
                </div>

                {leadCaptureAllowed ? (
                  <div className="mt-5 rounded-2xl bg-[#f8f1ec] p-4">
                    <h3 className="mb-3 text-center text-sm font-semibold text-[#382318]">
                      Leave Your Details
                    </h3>
                    <form onSubmit={handleSubmitLead} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Your name"
                        className="w-full rounded-lg border border-[#eadbcc] px-3 py-2 text-sm"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                      />
                      <input
                        type="email"
                        placeholder="Your email"
                        className="w-full rounded-lg border border-[#eadbcc] px-3 py-2 text-sm"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Phone number"
                        className="w-full rounded-lg border border-[#eadbcc] px-3 py-2 text-sm"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                      />
                      <textarea
                        placeholder="Message"
                        rows={3}
                        className="w-full rounded-lg border border-[#eadbcc] px-3 py-2 text-sm"
                        value={leadMessage}
                        onChange={(e) => setLeadMessage(e.target.value)}
                      />

                      {leadError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                          {leadError}
                        </div>
                      ) : null}

                      {leadSuccess ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                          {leadSuccess}
                        </div>
                      ) : null}

                      <button
                        type="submit"
                        disabled={submittingLead}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8b5638] py-2.5 text-sm font-semibold text-white hover:bg-[#75462d] disabled:opacity-60"
                      >
                        <Send className="h-4 w-4" />
                        {submittingLead ? "Sending..." : "Send Details"}
                      </button>
                    </form>
                  </div>
                ) : null}

                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#9b7c6d]">
                  <img
                    src={sabiLogo}
                    alt="SabiCard"
                    className="h-4 w-4 object-contain"
                  />
                  Powered by SabiCard
                </div>
              </div>
            </>
          ) : (
            <>
          <div
            className={
              isSignatureDesign
                ? "relative h-44 overflow-hidden bg-[#17231f] p-5"
                : isExecutiveDesign
                ? `relative h-28 overflow-hidden ${
                    !brandHeaderStyle ? "bg-[#d7c39a]" : ""
                  }`
                : isAuroraDesign
                ? `relative h-52 overflow-hidden ${
                    !brandHeaderStyle
                      ? "bg-gradient-to-br from-emerald-400 via-sky-400 to-fuchsia-400"
                      : ""
                  }`
                : isSunriseDesign
                ? `relative h-60 overflow-hidden ${
                    !brandHeaderStyle
                      ? "bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300"
                      : ""
                  }`
                : `relative h-32 overflow-hidden ${
                    !brandHeaderStyle ? themeClasses.headerBg : ""
                  }`
            }
            style={!isSignatureDesign ? brandHeaderStyle : undefined}
          >
            {effectiveCoverUrl ? (
              <>
                <ImageWithFallback
                  src={effectiveCoverUrl}
                  alt={`${profile.full_name || "Profile"} cover photo`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className={`absolute inset-0 ${
                    isSignatureDesign
                      ? "bg-[#101815]/65"
                      : "bg-gradient-to-b from-black/15 to-black/35"
                  }`}
                />
              </>
            ) : null}

            {isSignatureDesign ? (
              <>
                <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {organizationBranding?.organization_logo_url ? (
                      <img
                        src={organizationBranding.organization_logo_url}
                        alt={organizationBranding.organization_name}
                        className="h-10 w-10 rounded-xl border border-white/10 bg-white object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                        <Building2 className="h-5 w-5 text-[#b9f27c]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {displayCompany || "SabiCard"}
                      </p>
                      <p className="truncate text-xs text-white/55">
                        Digital business card
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
                    aria-label="Show QR code"
                  >
                    <QrCode className="h-5 w-5" />
                  </button>
                </div>

                <div className="absolute bottom-5 left-5 right-5 h-px bg-white/12" />
              </>
            ) : null}
          </div>

          <div
            className={
              isSignatureDesign
                ? "px-5 pb-6"
                : isExecutiveDesign
                ? "px-8 pb-8"
                : isPortraitDesign
                ? "px-5 pb-7"
                : "px-6 pb-8"
            }
          >
            <div
              className={
                isSignatureDesign
                  ? "mb-5 flex justify-start -mt-16"
                  : isExecutiveDesign
                  ? "mb-5 flex justify-start -mt-12"
                  : isAuroraDesign
                  ? "mb-5 flex justify-center -mt-20"
                  : isSunriseDesign
                  ? "mb-5 flex justify-center -mt-16"
                  : "flex justify-center -mt-16 mb-4"
              }
            >
              <div className="relative">
                {profile.avatar_url ? (
                  <ImageWithFallback
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profile photo"}
                    className={
                      isSignatureDesign
                        ? "h-32 w-32 rounded-[1.65rem] border-4 border-[#101815] object-cover shadow-2xl"
                        : isExecutiveDesign
                        ? "h-28 w-28 rounded-sm border-4 border-[#171717] object-cover shadow-2xl"
                        : isAuroraDesign
                        ? "h-36 w-36 rounded-[2rem] border-4 border-white object-cover shadow-2xl"
                        : isSunriseDesign
                        ? "h-32 w-32 rounded-full border-4 border-white object-cover shadow-xl"
                        : "w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    }
                  />
                ) : (
                  <div
                    className={`flex h-32 w-32 items-center justify-center text-3xl font-bold shadow-lg ${
                      isSignatureDesign
                        ? "rounded-[1.65rem] border-4 border-[#101815]"
                        : isExecutiveDesign
                        ? "h-28 w-28 rounded-sm border-4 border-[#171717]"
                        : isAuroraDesign
                        ? "h-36 w-36 rounded-[2rem] border-4 border-white"
                        : isSunriseDesign
                        ? "rounded-full border-4 border-white"
                        : "rounded-full border-4 border-white"
                    } ${themeClasses.avatarFallback}`}
                  >
                    {initials}
                  </div>
                )}
              </div>
            </div>

            {organizationBranding && !isEditorialDesign ? (
              <div
                className={`flex flex-col mb-4 ${
                  isAuroraDesign ? "items-start" : "items-center"
                }`}
              >
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

            <div
              className={
                isEditorialDesign || isAuroraDesign
                  ? "mb-6 text-left"
                  : "text-center mb-6"
              }
            >
              <h1
                className={
                  isSignatureDesign
                    ? "mb-2 text-4xl font-bold leading-tight tracking-normal"
                    : isExecutiveDesign
                    ? "mb-2 text-4xl font-serif leading-tight tracking-normal text-[#d7c39a]"
                    : isAuroraDesign
                    ? "mb-2 text-4xl font-bold leading-tight tracking-normal"
                    : isSunriseDesign
                    ? "mb-2 text-3xl font-bold leading-tight tracking-normal"
                    : "text-3xl font-bold mb-2"
                }
              >
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
                  className={`mt-3 text-sm flex items-center gap-2 ${
                    isEditorialDesign || isAuroraDesign
                      ? "justify-start"
                      : "justify-center"
                  } ${themeClasses.mutedText}`}
                >
                  <MapPin className="w-4 h-4" />
                  {profile.location_label}
                </p>
              ) : null}
            </div>

            {profile.bio ? (
              <p
                className={`mb-6 text-sm leading-6 ${
                  isEditorialDesign || isAuroraDesign ? "text-left" : "text-center"
                } ${themeClasses.mutedText}`}
              >
                {profile.bio}
              </p>
            ) : null}

            <div
              className={
                isEditorialDesign
                  ? "mb-6 grid grid-cols-2 gap-3"
                  : isPortraitDesign
                  ? "mb-6 grid grid-cols-2 gap-3"
                  : "space-y-3 mb-6"
              }
            >
              <button
                onClick={handleSaveContact}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium ${
                  isEditorialDesign || isPortraitDesign ? "col-span-2" : ""
                } ${themeClasses.primaryButton}`}
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
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium ${themeClasses.secondaryButton}`}
              >
                <QrCode className="w-5 h-5" />
                Show QR Code
              </button>

              <div
                className={
                  isEditorialDesign || isPortraitDesign
                    ? "contents"
                    : "grid grid-cols-2 gap-3"
                }
              >
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
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 ${
                    isEditorialDesign || isPortraitDesign ? "col-span-2" : ""
                  } ${themeClasses.secondaryButton}`}
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
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 ${
                    isEditorialDesign || isPortraitDesign ? "col-span-2" : ""
                  } ${themeClasses.secondaryButton}`}
                >
                  <MapPin className="w-5 h-5" />
                  Open Location
                </a>
              ) : null}
            </div>

            {socials.length > 0 ? (
              <div
                className={
                  isEditorialDesign
                    ? "mb-6 border-t border-white/10 pt-6"
                    : isPortraitDesign
                    ? "mb-6 rounded-2xl bg-gray-50 p-4"
                    : "border-t pt-6 mb-6"
                }
              >
                <h3
                  className={`text-sm font-medium mb-4 ${
                    isEditorialDesign || isAuroraDesign ? "text-left" : "text-center"
                  } ${themeClasses.mutedText}`}
                >
                  Connect on Social
                </h3>
                <div
                  className={
                    isSignatureDesign
                      ? "grid grid-cols-5 gap-3"
                      : isExecutiveDesign
                      ? "grid grid-cols-5 gap-2"
                      : isPortraitDesign
                      ? "grid grid-cols-5 gap-2"
                      : "flex justify-center gap-4 flex-wrap"
                  }
                >
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
                        className={`w-12 h-12 flex items-center justify-center transition-colors ${
                          isEditorialDesign || isAuroraDesign
                            ? "rounded-2xl"
                            : "rounded-full"
                        } ${themeClasses.socialButton}`}
                        aria-label={social.platform}
                      >
                        <Icon className="w-6 h-6" />
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {leadCaptureAllowed ? (
              <div
                className={
                  isEditorialDesign
                    ? "border-t border-white/10 pt-6"
                    : isPortraitDesign
                    ? "rounded-2xl bg-gray-50 p-4"
                    : "border-t pt-6"
                }
              >
                <h3
                  className={
                    isEditorialDesign || isAuroraDesign
                      ? "mb-4 text-left text-lg font-semibold"
                      : "text-center text-lg font-semibold mb-4"
                  }
                >
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
              <div
                className={
                  isEditorialDesign
                    ? "border-t border-white/10 pt-6 text-left"
                    : isPortraitDesign
                    ? "rounded-2xl bg-gray-50 p-4 text-center"
                    : "border-t pt-6 text-center"
                }
              >
                <p className={`text-sm ${themeClasses.mutedText}`}>
                  {ownerAccess?.trialEnded
                    ? "This card owner's 7-day free trial for lead capture has ended."
                    : "Lead capture is available during the Free trial and on Pro or Business plans."}
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
            </>
          )}
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
