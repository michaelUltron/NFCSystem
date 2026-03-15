import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Download, Phone, Mail, Globe, Send } from "lucide-react";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import sabiLogo from "../assets/sabi-logo.png";

import {
  getPublicProfileByUsername,
  getPublicSocialLinksByUserId,
  type ProfileRow,
  type SocialLinkRow,
} from "../lib/profile-service";
import { createLead } from "../lib/lead-service";

const socialIcons: Record<string, any> = {
  linkedin: FaLinkedin,
  instagram: FaInstagram,
  facebook: FaFacebook,
  twitter: FaTwitter,
  whatsapp: FaWhatsapp,
};

export function DigitalCardPage() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [socials, setSocials] = useState<SocialLinkRow[]>([]);

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
      } catch (err: any) {
        setError(err.message || "Card not found.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  const initials = useMemo(() => {
    const name = profile?.full_name?.trim() || "SC";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile?.full_name]);

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">Loading card...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Card not found</h1>
          <p className="text-gray-600">
            {error || "This profile is unavailable."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-blue-600"></div>

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
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold">
                  {initials}
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {profile.full_name || "Unnamed User"}
            </h1>
            <p className="text-lg text-gray-700 mb-1">{profile.position || ""}</p>
            <p className="text-gray-600 mb-2">{profile.company || ""}</p>
          </div>

          {profile.bio ? (
            <p className="text-gray-600 text-center mb-6 text-sm">
              {profile.bio}
            </p>
          ) : null}

          <div className="space-y-3 mb-6">
            <button
              onClick={handleSaveContact}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg py-3 font-medium"
            >
              <Download className="w-5 h-5" />
              Save Contact
            </button>

            <div className="grid grid-cols-2 gap-3">
              {profile.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-3"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </a>
              ) : null}
              {profile.email ? (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-3"
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
                className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-3"
              >
                <Globe className="w-5 h-5" />
                Visit Website
              </a>
            ) : null}
          </div>

          {socials.length > 0 ? (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-center text-sm font-medium text-gray-500 mb-4">
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
                      className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors"
                      aria-label={social.platform}
                    >
                      <Icon className="w-6 h-6 text-gray-700" />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

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
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-black rounded-lg py-3 font-medium disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {submittingLead ? "Sending..." : "Send Details"}
              </button>
            </form>
          </div>

          <div className="text-center mt-8 text-sm text-gray-500 flex items-center justify-center gap-2">
            <img src={sabiLogo} alt="SabiCard" className="w-5 h-5 object-contain" />
            Powered by SabiCard
          </div>
        </div>
      </div>
    </div>
  );
}