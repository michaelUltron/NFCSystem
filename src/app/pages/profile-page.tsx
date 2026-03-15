import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  User,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Globe,
  Save,
  Eye,
  AtSign,
  LoaderCircle,
  Upload,
} from "lucide-react";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import {
  getMyProfile,
  getMySocialLinks,
  updateMyProfile,
  replaceMySocialLinks,
} from "../lib/profile-service";
import { supabase } from "../lib/supabase";
import { uploadProfileImage } from "../lib/storage-service";

const socialPlatforms = [
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: FaLinkedin,
    placeholder: "https://linkedin.com/in/username",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: FaInstagram,
    placeholder: "https://instagram.com/username",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: FaFacebook,
    placeholder: "https://facebook.com/username",
  },
  {
    key: "twitter",
    label: "Twitter / X",
    icon: FaTwitter,
    placeholder: "https://x.com/username",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: FaWhatsapp,
    placeholder: "https://wa.me/639171234567",
  },
];

type FormState = {
  username: string;
  full_name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  website: string;
  bio: string;
  avatar_url: string;
};

export function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<FormState>({
    username: "",
    full_name: "",
    company: "",
    position: "",
    phone: "",
    email: "",
    website: "",
    bio: "",
    avatar_url: "",
  });

  const [socials, setSocials] = useState<Record<string, string>>({
    linkedin: "",
    instagram: "",
    facebook: "",
    twitter: "",
    whatsapp: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login?next=/profile");
          return;
        }

        const [profile, links] = await Promise.all([
          getMyProfile(),
          getMySocialLinks(),
        ]);

        if (profile) {
          setForm({
            username: profile.username ?? "",
            full_name: profile.full_name ?? "",
            company: profile.company ?? "",
            position: profile.position ?? "",
            phone: profile.phone ?? "",
            email: profile.email ?? "",
            website: profile.website ?? "",
            bio: profile.bio ?? "",
            avatar_url: profile.avatar_url ?? "",
          });
        }

        const socialMap: Record<string, string> = {
          linkedin: "",
          instagram: "",
          facebook: "",
          twitter: "",
          whatsapp: "",
        };

        for (const link of links) {
          socialMap[link.platform] = link.url;
        }

        setSocials(socialMap);
      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const initials = useMemo(() => {
    const name = form.full_name.trim();
    if (!name) return "TC";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [form.full_name]);

  const previewUrl = form.username ? `/card/${form.username}` : "";

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError("");
      setSuccess("");

      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload a valid image file.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be 5MB or smaller.");
      }

      const result = await uploadProfileImage(file);

      setForm((prev) => ({
        ...prev,
        avatar_url: result.publicUrl,
      }));

      setSuccess("Profile image uploaded. Click Save Profile to keep it.");
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const username = form.username.trim().toLowerCase();

      if (!username) {
        throw new Error(
          "Username is required so your public card can have a link."
        );
      }

      await updateMyProfile({
        username,
        full_name: form.full_name.trim(),
        company: form.company.trim(),
        position: form.position.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        bio: form.bio.trim(),
        avatar_url: form.avatar_url.trim(),
      });

      await replaceMySocialLinks(
        Object.entries(socials).map(([platform, url]) => ({ platform, url }))
      );

      setForm((prev) => ({ ...prev, username }));
      setSuccess("Profile saved successfully.");
    } catch (err: any) {
      if (String(err.message || "").toLowerCase().includes("duplicate key")) {
        setError("That username is already taken. Please choose another one.");
      } else {
        setError(err.message || "Failed to save profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Digital Card</h1>
              <p className="text-gray-600">
                Manage your public profile and social links
              </p>
            </div>

            {previewUrl ? (
              <Link
                to={previewUrl}
                target="_blank"
                className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2"
              >
                <Eye className="w-5 h-5" />
                Preview Card
              </Link>
            ) : null}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-8 flex items-center gap-3">
              <LoaderCircle className="w-5 h-5 animate-spin" />
              <span>Loading profile...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6">
                    Basic Information
                  </h2>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Profile Photo
                    </label>

                    <div className="flex items-center gap-4">
                      {form.avatar_url ? (
                        <ImageWithFallback
                          src={form.avatar_url}
                          alt={form.full_name || "Profile photo"}
                          className="w-24 h-24 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-semibold">
                          {initials}
                        </div>
                      )}

                      <div className="flex-1 space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileChange}
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingImage ? "Uploading..." : "Upload Image"}
                        </button>

                        {form.avatar_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, avatar_url: "" }))
                            }
                            className="ml-3 inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50"
                          >
                            Remove
                          </button>
                        ) : null}

                        <p className="text-xs text-gray-500">
                          Upload JPG, PNG, or WEBP up to 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="full_name"
                        className="block text-sm font-medium mb-2"
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="full_name"
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.full_name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              full_name: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium mb-2"
                      >
                        Public Username
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="username"
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.username}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              username: e.target.value
                                .replace(/\s+/g, "-")
                                .toLowerCase(),
                            }))
                          }
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Your card link will be{" "}
                        {form.username
                          ? `${window.location.origin}/card/${form.username}`
                          : "generated after you set username"}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium mb-2"
                      >
                        Company
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="company"
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.company}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              company: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="position"
                        className="block text-sm font-medium mb-2"
                      >
                        Position
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="position"
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.position}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              position: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium mb-2"
                      >
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          id="phone"
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.phone}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                      >
                        Public Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.email}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium mb-2"
                      >
                        Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          id="website"
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.website}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              website: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium mb-2"
                    >
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={4}
                      className="border rounded-lg px-3 py-2 w-full"
                      value={form.bio}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, bio: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6">Social Links</h2>
                  <div className="space-y-4">
                    {socialPlatforms.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <div key={platform.key}>
                          <label
                            htmlFor={platform.key}
                            className="block text-sm font-medium mb-2"
                          >
                            {platform.label}
                          </label>
                          <div className="relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="url"
                              id={platform.key}
                              placeholder={platform.placeholder}
                              className="border rounded-lg px-3 py-2 pl-10 w-full"
                              value={socials[platform.key] ?? ""}
                              onChange={(e) =>
                                setSocials((prev) => ({
                                  ...prev,
                                  [platform.key]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
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

                  <button
                    onClick={handleSave}
                    disabled={saving || uploadingImage}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-3 disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {saving ? "Saving..." : "Save Profile"}
                  </button>

                  {previewUrl ? (
                    <Link
                      to={previewUrl}
                      target="_blank"
                      className="w-full mt-3 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-3"
                    >
                      <Eye className="w-5 h-5" />
                      Open Public Card
                    </Link>
                  ) : null}
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Public Preview</h2>
                  <div className="rounded-2xl border overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-indigo-600 to-blue-600"></div>
                    <div className="px-4 pb-4 -mt-10">
                      <div className="w-20 h-20 rounded-full border-4 border-white bg-indigo-100 overflow-hidden mx-auto flex items-center justify-center text-indigo-600 font-semibold text-xl">
                        {form.avatar_url ? (
                          <ImageWithFallback
                            src={form.avatar_url}
                            alt={form.full_name || "Profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="text-center mt-3">
                        <h3 className="font-semibold text-lg">
                          {form.full_name || "Your Name"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {form.position || "Your Position"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {form.company || "Your Company"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}