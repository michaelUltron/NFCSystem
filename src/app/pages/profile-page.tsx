import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { buildPublicCardUrl } from "../lib/app-config";
import {
  User,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Globe,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Save,
  Search,
  Eye,
  AtSign,
  LoaderCircle,
  Upload,
  CheckCircle2,
  Circle,
  Camera,
  X,
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
import {
  getMySubscription,
  getTrialFeatureAccess,
  type TrialFeatureAccess,
} from "../lib/subscription-service";

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
  location_label: string;
  location_url: string;
  bio: string;
  avatar_url: string;
  cover_photo_url: string;
  theme: string;
};

const DEFAULT_MAP_CENTER = {
  lat: 14.5995,
  lng: 120.9842,
};

function getPreviewThemeClasses(theme?: string | null) {
  switch (theme) {
    case "minimal":
      return {
        card: "bg-white text-gray-900",
        header: "bg-gray-900",
        avatar: "bg-gray-200 text-gray-800",
        muted: "text-gray-600",
      };
    case "modern":
      return {
        card: "bg-white text-gray-900",
        header: "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600",
        avatar: "bg-violet-100 text-violet-700",
        muted: "text-gray-600",
      };
    case "dark":
      return {
        card: "bg-slate-900 text-white",
        header: "bg-gradient-to-r from-slate-700 to-slate-900",
        avatar: "bg-slate-700 text-white",
        muted: "text-slate-300",
      };
    case "signature":
      return {
        card: "bg-[#101815] text-white",
        header: "bg-[#17231f]",
        avatar: "bg-[#b9f27c] text-[#101815]",
        muted: "text-white/70",
      };
    case "executive":
      return {
        card: "bg-[#171717] text-white",
        header: "bg-[#d7c39a]",
        avatar: "bg-[#d7c39a] text-[#171717]",
        muted: "text-white/68",
      };
    case "aurora":
      return {
        card: "bg-white text-gray-900",
        header: "bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500",
        avatar: "bg-emerald-100 text-emerald-700",
        muted: "text-gray-600",
      };
    case "sunrise":
      return {
        card: "bg-white text-gray-900",
        header: "bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300",
        avatar: "bg-rose-100 text-rose-700",
        muted: "text-gray-600",
      };
    case "default":
    default:
      return {
        card: "bg-white text-gray-900",
        header: "bg-gradient-to-r from-indigo-600 to-blue-600",
        avatar: "bg-indigo-100 text-indigo-600",
        muted: "text-gray-600",
      };
  }
}

const DEFAULT_MAP_ZOOM = 15;
const MIN_MAP_ZOOM = 3;
const MAX_MAP_ZOOM = 19;
const TILE_SIZE = 256;

function latLngToPoint(lat: number, lng: number, zoom: number) {
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;

  return {
    x: ((lng + 180) / 360) * scale,
    y:
      (0.5 -
        Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
      scale,
  };
}

function pointToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return { lat, lng };
}

function buildGoogleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(
    6
  )},${lng.toFixed(6)}`;
}

function parseGoogleMapsCoordinates(url: string) {
  const match = url.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  return {
    lat: Number(match[1]),
    lng: Number(match[2]),
  };
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement | null>(null);
  const photoSectionRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const contactSectionRef = useRef<HTMLDivElement | null>(null);
  const statusSectionRef = useRef<HTMLDivElement | null>(null);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const mapDragStartRef = useRef<{
    clientX: number;
    clientY: number;
    center: typeof DEFAULT_MAP_CENTER;
    moved: boolean;
  } | null>(null);
  const onboardingMode = searchParams.get("onboarding") === "1";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [access, setAccess] = useState<TrialFeatureAccess | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTourTarget, setActiveTourTarget] = useState("");
  const [tourTip, setTourTip] = useState("");
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationDraftLabel, setLocationDraftLabel] = useState("");
  const [locationDraftCoords, setLocationDraftCoords] =
    useState(DEFAULT_MAP_CENTER);
  const [mapCenterCoords, setMapCenterCoords] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [mapSize, setMapSize] = useState({ width: 640, height: 320 });
  const [draggingPin, setDraggingPin] = useState(false);
  const [draggingMap, setDraggingMap] = useState(false);

  const [form, setForm] = useState<FormState>({
    username: "",
    full_name: "",
    company: "",
    position: "",
    phone: "",
    email: "",
    website: "",
    location_label: "",
    location_url: "",
    bio: "",
    avatar_url: "",
    cover_photo_url: "",
    theme: "default",
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

        const [profile, links, subscription] = await Promise.all([
          getMyProfile(),
          getMySocialLinks(),
          getMySubscription(),
        ]);

        setAccess(getTrialFeatureAccess(subscription));

        if (profile) {
          setForm({
            username: profile.username ?? "",
            full_name: profile.full_name ?? "",
            company: profile.company ?? "",
            position: profile.position ?? "",
            phone: profile.phone ?? "",
            email: profile.email ?? "",
            website: profile.website ?? "",
            location_label: profile.location_label ?? "",
            location_url: profile.location_url ?? "",
            bio: profile.bio ?? "",
            avatar_url: profile.avatar_url ?? "",
            cover_photo_url: profile.cover_photo_url ?? "",
            theme: profile.theme ?? "default",
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

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!locationPickerOpen) return;

    const updateMapSize = () => {
      const rect = mapViewportRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMapSize({
        width: Math.max(rect.width, 320),
        height: Math.max(rect.height, 280),
      });
    };

    updateMapSize();
    window.addEventListener("resize", updateMapSize);

    return () => window.removeEventListener("resize", updateMapSize);
  }, [locationPickerOpen]);

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
  const cleanUsername = form.username.trim().toLowerCase();
  const previewThemeValue = access?.canUseThemes ? form.theme : "default";
  const previewCoverUrl = access?.canUseBranding ? form.cover_photo_url : "";
  const previewTheme = getPreviewThemeClasses(previewThemeValue);
  const previewIsSignature = previewThemeValue === "signature";
  const previewIsExecutive = previewThemeValue === "executive";
  const previewIsAurora = previewThemeValue === "aurora";
  const previewIsSunrise = previewThemeValue === "sunrise";
  const previewIsEditorial = previewIsSignature || previewIsExecutive;
  const previewIsPortrait = previewIsAurora || previewIsSunrise;
  const onboardingItems = [
    {
      label: "Upload a clear profile photo",
      complete: !!form.avatar_url,
      highlight: true,
      action: () =>
        focusOnboardingTarget({
          key: "photo",
          message: "Click Upload Image and choose a clear photo of yourself.",
          sectionRef: photoSectionRef,
          inputRef: uploadButtonRef,
        }),
    },
    {
      label: "Add your name and public username",
      complete: !!form.full_name.trim() && !!cleanUsername,
      action: () =>
        focusOnboardingTarget({
          key: "identity",
          message: "Enter your full name, then choose your public card username.",
          inputRef: nameInputRef,
        }),
    },
    {
      label: "Add your role, company, and contact details",
      complete:
        !!form.position.trim() ||
        !!form.company.trim() ||
        !!form.phone.trim() ||
        !!form.email.trim(),
      action: () =>
        focusOnboardingTarget({
          key: "contact",
          message: "Add the details visitors should see when they open your card.",
          sectionRef: contactSectionRef,
        }),
    },
    {
      label: "Save and open your public card",
      complete: false,
      action: () =>
        focusOnboardingTarget({
          key: "finish",
          message: "Save your changes, then open the public version of your card.",
          sectionRef: statusSectionRef,
        }),
    },
  ];
  const requiredSetupComplete =
    !!form.avatar_url && !!form.full_name.trim() && !!cleanUsername;

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

  const handleCoverFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      setError("");
      setSuccess("");

      if (!access?.canUseBranding) {
        throw new Error(
          "Your free trial for better personal branding tools has ended. Upgrade to Pro or Business to upload a cover photo."
        );
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload a valid image file.");
      }

      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Cover photo must be 8MB or smaller.");
      }

      const result = await uploadProfileImage(file);

      setForm((prev) => ({
        ...prev,
        cover_photo_url: result.publicUrl,
      }));

      setSuccess("Cover photo uploaded. Click Save Profile to keep it.");
    } catch (err: any) {
      setError(err.message || "Failed to upload cover photo.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const username = cleanUsername;

      if (!username) {
        throw new Error(
          "Username is required so your public card can have a link."
        );
      }

      const profilePayload = {
        username,
        full_name: form.full_name.trim(),
        company: form.company.trim(),
        position: form.position.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        location_label: form.location_label.trim(),
        location_url: form.location_url.trim(),
        bio: form.bio.trim(),
        avatar_url: form.avatar_url.trim(),
      };

      await updateMyProfile(
        access?.canUseBranding
          ? { ...profilePayload, cover_photo_url: form.cover_photo_url.trim() }
          : profilePayload
      );

      await replaceMySocialLinks(
        Object.entries(socials).map(([platform, url]) => ({ platform, url }))
      );

      setForm((prev) => ({ ...prev, username }));
      setSuccess("Profile saved successfully.");
      return true;
    } catch (err: any) {
      if (String(err.message || "").toLowerCase().includes("duplicate key")) {
        setError("That username is already taken. Please choose another one.");
      } else {
        setError(err.message || "Failed to save profile.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleFinishSetup = async () => {
    if (!requiredSetupComplete) {
      setError(
        "Add a profile photo, your full name, and your public username before viewing your card."
      );
      return;
    }

    const saved = await handleSave();
    if (saved) {
      navigate(`/card/${cleanUsername}`);
    }
  };

  const focusOnboardingTarget = ({
    key,
    message,
    sectionRef,
    inputRef,
  }: {
    key: string;
    message: string;
    sectionRef?: React.RefObject<HTMLElement | null>;
    inputRef?: React.RefObject<HTMLElement | null>;
  }) => {
    const target = sectionRef?.current || inputRef?.current;

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    setActiveTourTarget(key);
    setTourTip(message);

    target?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.setTimeout(() => {
      inputRef?.current?.focus();
    }, 350);

    highlightTimeoutRef.current = window.setTimeout(() => {
      setActiveTourTarget("");
      setTourTip("");
    }, 4200);
  };

  const getTourHighlightClass = (key: string) =>
    activeTourTarget === key
      ? "relative rounded-xl ring-4 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100 transition"
      : "relative transition";

  const renderTourTip = (key: string) =>
    activeTourTarget === key && tourTip ? (
      <div className="absolute right-0 top-0 z-20 max-w-xs -translate-y-[calc(100%+0.75rem)] rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
        {tourTip}
      </div>
    ) : null;

  const openLocationPicker = () => {
    const savedCoords = parseGoogleMapsCoordinates(form.location_url);
    const initialCoords = savedCoords || DEFAULT_MAP_CENTER;

    setLocationDraftCoords(initialCoords);
    setMapCenterCoords(initialCoords);
    setMapZoom(DEFAULT_MAP_ZOOM);
    setLocationDraftLabel(form.location_label || "");
    setLocationSearch(form.location_label || "");
    setLocationError("");
    setLocationPickerOpen(true);
  };

  const mapCenterPoint = latLngToPoint(
    mapCenterCoords.lat,
    mapCenterCoords.lng,
    mapZoom
  );
  const mapTopLeft = {
    x: mapCenterPoint.x - mapSize.width / 2,
    y: mapCenterPoint.y - mapSize.height / 2,
  };
  const mapTiles = useMemo(() => {
    const startX = Math.floor(mapTopLeft.x / TILE_SIZE);
    const startY = Math.floor(mapTopLeft.y / TILE_SIZE);
    const endX = Math.floor((mapTopLeft.x + mapSize.width) / TILE_SIZE);
    const endY = Math.floor((mapTopLeft.y + mapSize.height) / TILE_SIZE);
    const maxTile = 2 ** mapZoom;
    const tiles = [];

    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        if (y < 0 || y >= maxTile) continue;

        const wrappedX = ((x % maxTile) + maxTile) % maxTile;
        tiles.push({
          key: `${x}-${y}`,
          x,
          y,
          url: `https://tile.openstreetmap.org/${mapZoom}/${wrappedX}/${y}.png`,
          left: x * TILE_SIZE - mapTopLeft.x,
          top: y * TILE_SIZE - mapTopLeft.y,
        });
      }
    }

    return tiles;
  }, [mapSize.height, mapSize.width, mapTopLeft.x, mapTopLeft.y, mapZoom]);

  const pinPoint = latLngToPoint(
    locationDraftCoords.lat,
    locationDraftCoords.lng,
    mapZoom
  );
  const pinPosition = {
    left: pinPoint.x - mapTopLeft.x,
    top: pinPoint.y - mapTopLeft.y,
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingPin) return;
    if (mapDragStartRef.current?.moved) {
      mapDragStartRef.current = null;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickedPoint = {
      x: mapTopLeft.x + e.clientX - rect.left,
      y: mapTopLeft.y + e.clientY - rect.top,
    };
    const coords = pointToLatLng(clickedPoint.x, clickedPoint.y, mapZoom);

    setLocationDraftCoords(coords);
    setLocationDraftLabel((prev) =>
      prev.trim()
        ? prev
        : `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
    );
  };

  const handleMapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingPin) return;

    mapDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      center: mapCenterCoords,
      moved: false,
    };
    setDraggingMap(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleMapPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = mapDragStartRef.current;
    if (!dragStart || draggingPin) return;

    const deltaX = e.clientX - dragStart.clientX;
    const deltaY = e.clientY - dragStart.clientY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragStart.moved = true;
    }

    const startPoint = latLngToPoint(
      dragStart.center.lat,
      dragStart.center.lng,
      mapZoom
    );
    const newCenter = pointToLatLng(
      startPoint.x - deltaX,
      startPoint.y - deltaY,
      mapZoom
    );

    setMapCenterCoords(newCenter);
  };

  const handleMapPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDraggingMap(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleMapPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    mapDragStartRef.current = null;
    setDraggingMap(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updatePinFromPointer = (
    clientX: number,
    clientY: number,
    mapElement: HTMLDivElement
  ) => {
    const rect = mapElement.getBoundingClientRect();
    const clampedX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const clampedY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const point = {
      x: mapTopLeft.x + clampedX,
      y: mapTopLeft.y + clampedY,
    };
    const coords = pointToLatLng(point.x, point.y, mapZoom);

    setLocationDraftCoords(coords);
    setLocationDraftLabel((prev) =>
      prev.trim()
        ? prev
        : `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
    );
  };

  const handlePinPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const mapElement = mapViewportRef.current;
    if (!mapElement) return;

    e.preventDefault();
    e.stopPropagation();
    setDraggingPin(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePinPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const mapElement = mapViewportRef.current;
    if (!draggingPin || !mapElement) return;

    updatePinFromPointer(e.clientX, e.clientY, mapElement);
  };

  const handlePinPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setDraggingPin(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleZoomIn = () => {
    setMapZoom((prev) => Math.min(prev + 1, MAX_MAP_ZOOM));
  };

  const handleZoomOut = () => {
    setMapZoom((prev) => Math.max(prev - 1, MIN_MAP_ZOOM));
  };

  const handleSearchLocation = async () => {
    const query = locationSearch.trim();
    if (!query) {
      setLocationError("Enter an address, office name, or landmark first.");
      return;
    }

    try {
      setLocationSearching(true);
      setLocationError("");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          query
        )}`
      );
      const results = await response.json();
      const result = Array.isArray(results) ? results[0] : null;

      if (!result) {
        throw new Error("No matching location found. Try a more specific address.");
      }

      setLocationDraftCoords({
        lat: Number(result.lat),
        lng: Number(result.lon),
      });
      setMapCenterCoords({
        lat: Number(result.lat),
        lng: Number(result.lon),
      });
      setLocationDraftLabel(result.display_name || query);
    } catch (err: any) {
      setLocationError(err.message || "Could not find that location.");
    } finally {
      setLocationSearching(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support current location.");
      return;
    }

    if (!window.isSecureContext) {
      setLocationError(
        "Current location only works on HTTPS or localhost. Open the app from localhost/127.0.0.1, not a plain network URL."
      );
      return;
    }

    try {
      const permission = await navigator.permissions?.query({
        name: "geolocation" as PermissionName,
      });

      if (permission?.state === "denied") {
        setLocationError(
          "Location access is blocked. Allow location permission in your browser settings, then try again."
        );
        return;
      }
    } catch {
      // Some browsers do not support querying geolocation permission.
    }

    setLocationError("");
    setLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocationDraftCoords(coords);
        setMapCenterCoords(coords);
        setMapZoom(Math.max(mapZoom, 16));
        setLocationDraftLabel((prev) =>
          prev.trim()
            ? prev
            : `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
        );
        setLocatingUser(false);
      },
      (geolocationError) => {
        const message =
          geolocationError.code === geolocationError.PERMISSION_DENIED
            ? "Location permission was denied. Allow it in your browser, then try again."
            : geolocationError.code === geolocationError.POSITION_UNAVAILABLE
            ? "Your device could not determine its current location."
            : "Getting your location took too long. Try again or search for your address.";

        setLocationError(message);
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleApplyPinnedLocation = () => {
    setForm((prev) => ({
      ...prev,
      location_label:
        locationDraftLabel.trim() ||
        `${locationDraftCoords.lat.toFixed(6)}, ${locationDraftCoords.lng.toFixed(
          6
        )}`,
      location_url: buildGoogleMapsUrl(
        locationDraftCoords.lat,
        locationDraftCoords.lng
      ),
    }));
    setLocationPickerOpen(false);
  };

  return (
    <>
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

          {!loading && access?.trialActive ? (
            <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
              Your Free plan trial includes cover photos and premium branding
              tools for <strong>{access.trialDaysRemaining}</strong>{" "}
              {access.trialDaysRemaining === 1 ? "day" : "days"}.
            </div>
          ) : null}

          {!loading && access?.trialEnded ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Free trial ended</p>
              <p>
                Your 7-day free trial for better personal branding tools has
                ended. Cover photos and premium themes are locked until you
                upgrade to Pro or Business.
              </p>
              <Link
                to="/plans"
                className="mt-3 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                View Plans
              </Link>
            </div>
          ) : null}

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-8 flex items-center gap-3">
              <LoaderCircle className="w-5 h-5 animate-spin" />
              <span>Loading profile...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {onboardingMode ? (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-indigo-600 mb-1">
                          Card setup tour
                        </p>
                        <h2 className="text-2xl font-bold mb-2">
                          Let&apos;s make your public card ready to share
                        </h2>
                        <p className="text-gray-600 max-w-2xl">
                          Start with your photo so people recognize you when
                          they tap your NFC card, then add the essentials and
                          open the live public version.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate("/profile", { replace: true })}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2"
                      >
                        Skip for now
                      </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                      {onboardingItems.map((item, index) => {
                        const Icon = item.complete ? CheckCircle2 : Circle;
                        return (
                          <button
                            type="button"
                            key={item.label}
                            onClick={item.action}
                            className={`rounded-lg border p-4 ${
                              item.highlight && !item.complete
                                ? "border-indigo-200 bg-indigo-50"
                                : item.complete
                                ? "border-green-200 bg-green-50"
                                : "border-gray-200 bg-white"
                            } text-left transition hover:border-indigo-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Icon
                                className={`w-5 h-5 ${
                                  item.complete
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              />
                              <span className="text-xs font-semibold text-gray-500">
                                Step {index + 1}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-xl font-semibold">
                      Basic Information
                    </h2>
                    {onboardingMode ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                        <Camera className="w-4 h-4" />
                        Photo first
                      </span>
                    ) : null}
                  </div>

                  <div
                    ref={photoSectionRef}
                    className={`mb-6 scroll-mt-24 p-2 -m-2 ${getTourHighlightClass(
                      "photo"
                    )}`}
                  >
                    {renderTourTip("photo")}
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
                          ref={uploadButtonRef}
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className={`inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-60 ${
                            activeTourTarget === "photo"
                              ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                              : ""
                          }`}
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

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Cover Photo
                    </label>

                    <div className="rounded-xl border overflow-hidden bg-gray-50">
                      <div className="h-36 bg-gradient-to-r from-indigo-600 to-blue-600">
                        {form.cover_photo_url ? (
                          <ImageWithFallback
                            src={form.cover_photo_url}
                            alt="Cover photo"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="p-4">
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverFileChange}
                        />

                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingCover || !access?.canUseBranding}
                          className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-white disabled:opacity-60"
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingCover ? "Uploading..." : "Upload Cover"}
                        </button>

                        {form.cover_photo_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                cover_photo_url: "",
                              }))
                            }
                            disabled={!access?.canUseBranding}
                            className="ml-3 inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-white disabled:opacity-60"
                          >
                            Remove
                          </button>
                        ) : null}

                        {!access?.canUseBranding ? (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                            Your 7-day free trial for cover photos and better
                            personal branding tools has ended. Upgrade to Pro or
                            Business to change this section.
                          </div>
                        ) : null}

                        <p className="text-xs text-gray-500 mt-2">
                          Upload a wide JPG, PNG, or WEBP up to 8MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-2 -m-2 ${getTourHighlightClass(
                        "identity"
                      )}`}
                    >
                      {renderTourTip("identity")}
                      <label
                        htmlFor="full_name"
                        className="block text-sm font-medium mb-2"
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          ref={nameInputRef}
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

                    <div
                      className={
                        activeTourTarget === "identity"
                          ? "rounded-xl ring-4 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100 transition"
                          : "transition"
                      }
                    >
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

                    <div
                      ref={contactSectionRef}
                      className={`p-2 -m-2 scroll-mt-24 ${getTourHighlightClass(
                        "contact"
                      )}`}
                    >
                      {renderTourTip("contact")}
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

                    <div
                      className={
                        activeTourTarget === "contact"
                          ? "rounded-xl ring-4 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100 transition"
                          : "transition"
                      }
                    >
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

                    <div
                      className={
                        activeTourTarget === "contact"
                          ? "rounded-xl ring-4 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100 transition"
                          : "transition"
                      }
                    >
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

                    <div
                      className={
                        activeTourTarget === "contact"
                          ? "rounded-xl ring-4 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100 transition"
                          : "transition"
                      }
                    >
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

                    <div
                      className={`md:col-span-2 ${
                        activeTourTarget === "contact"
                          ? "rounded-xl ring-4 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100 transition"
                          : "transition"
                      }`}
                    >
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

                    <div className="md:col-span-2 border-t pt-5 mt-2">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                            Map Location
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Add an office, shop, or home pin that visitors can
                            open from your public card.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={openLocationPicker}
                          className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2"
                        >
                          <MapPin className="w-4 h-4" />
                          Pick on Map
                        </button>
                      </div>
                    </div>

                    <div
                      className={`md:col-span-2 ${
                        activeTourTarget === "contact"
                          ? "rounded-xl ring-4 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100 transition"
                          : "transition"
                      }`}
                    >
                      <label
                        htmlFor="location_label"
                        className="block text-sm font-medium mb-2"
                      >
                        Office or Home Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="location_label"
                          placeholder="Office, BGC Taguig or your full address"
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.location_label}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              location_label: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div
                      className={`md:col-span-2 ${
                        activeTourTarget === "contact"
                          ? "rounded-xl ring-4 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100 transition"
                          : "transition"
                      }`}
                    >
                      <label
                        htmlFor="location_url"
                        className="block text-sm font-medium mb-2"
                      >
                        Google Maps Link
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          id="location_url"
                          placeholder="https://maps.google.com/..."
                          className="border rounded-lg px-3 py-2 pl-10 w-full"
                          value={form.location_url}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              location_url: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Open Google Maps, share the place, then paste the link here.
                      </p>
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
                <div
                  ref={statusSectionRef}
                  className={`bg-white rounded-xl shadow-md p-6 scroll-mt-24 ${getTourHighlightClass(
                    "finish"
                  )}`}
                >
                  {renderTourTip("finish")}
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

                  {onboardingMode ? (
                    <button
                      onClick={handleFinishSetup}
                      disabled={saving || uploadingImage}
                      className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-black rounded-lg px-4 py-3 disabled:opacity-60"
                    >
                      <Eye className="w-5 h-5" />
                      Save and View Public Card
                    </button>
                  ) : null}
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Public Preview</h2>
                  <div
                    className={`overflow-hidden border shadow-sm ${
                      previewIsExecutive
                        ? `rounded-sm ${previewTheme.card}`
                        : previewIsEditorial || previewIsPortrait
                        ? `rounded-[1.5rem] ${previewTheme.card}`
                        : `rounded-2xl ${previewTheme.card}`
                    }`}
                  >
                    <div
                      className={`relative ${
                        previewIsExecutive
                          ? "h-24"
                          : previewIsAurora
                          ? "h-32"
                          : previewIsSunrise
                          ? "h-36"
                          : previewIsEditorial
                          ? "h-28"
                          : "h-20"
                      } ${previewTheme.header}`}
                    >
                      {previewCoverUrl ? (
                        <>
                          <ImageWithFallback
                            src={previewCoverUrl}
                            alt="Cover preview"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div
                            className={`absolute inset-0 ${
                              previewIsEditorial
                                ? "bg-black/45"
                                : "bg-gradient-to-b from-black/10 to-black/30"
                            }`}
                          />
                        </>
                      ) : null}
                    </div>
                    <div
                      className={
                        previewIsExecutive
                          ? "px-4 pb-5 -mt-10"
                          : previewIsAurora
                          ? "px-4 pb-5 -mt-14"
                          : previewIsSunrise
                          ? "px-4 pb-5 -mt-12"
                          : previewIsEditorial
                          ? "px-4 pb-5 -mt-12"
                          : "px-4 pb-4 -mt-10"
                      }
                    >
                      <div
                        className={`relative z-10 h-20 w-20 overflow-hidden border-4 flex items-center justify-center font-semibold text-xl ${
                          previewIsExecutive
                            ? `rounded-sm border-[#171717] ${previewTheme.avatar}`
                            : previewIsAurora
                            ? `h-24 w-24 rounded-2xl border-white ${previewTheme.avatar}`
                            : previewIsEditorial
                            ? `rounded-2xl border-[#101815] ${previewTheme.avatar}`
                            : `mx-auto rounded-full border-white ${previewTheme.avatar}`
                        }`}
                      >
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
                      <div
                        className={
                          previewIsEditorial || previewIsAurora
                            ? "mt-3 text-left"
                            : "text-center mt-3"
                        }
                      >
                        <h3
                          className={`font-semibold ${
                            previewIsExecutive ? "font-serif text-[#d7c39a]" : ""
                          } text-lg`}
                        >
                          {form.full_name || "Your Name"}
                        </h3>
                        <p className={`text-sm ${previewTheme.muted}`}>
                          {form.position || "Your Position"}
                        </p>
                        <p className={`text-sm ${previewTheme.muted}`}>
                          {form.company || "Your Company"}
                        </p>
                        {form.location_label ? (
                          <p
                            className={`text-sm mt-2 flex items-center gap-1 ${
                              previewIsEditorial || previewIsAurora
                                ? "justify-start"
                                : "justify-center"
                            } ${previewTheme.muted}`}
                          >
                            <MapPin className="w-4 h-4" />
                            {form.location_label}
                          </p>
                        ) : null}
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

    {locationPickerOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold">Pin Your Location</h2>
              <p className="text-sm text-gray-500">
                Search, use your current location, or click the map to move the pin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLocationPickerOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close location picker"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchLocation();
                    }
                  }}
                  placeholder="Search office, shop, landmark, or address"
                  className="w-full rounded-lg border px-3 py-3 pl-10"
                />
              </div>

              <button
                type="button"
                onClick={handleSearchLocation}
                disabled={locationSearching}
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 hover:bg-gray-50 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {locationSearching ? "Searching..." : "Search"}
              </button>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locatingUser}
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 hover:bg-gray-50 disabled:opacity-60"
              >
                {locatingUser ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {locatingUser ? "Locating..." : "Use Current"}
              </button>
            </div>

            {locationError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {locationError}
              </div>
            ) : null}

            <div
              ref={mapViewportRef}
              onClick={handleMapClick}
              onPointerDown={handleMapPointerDown}
              onPointerMove={handleMapPointerMove}
              onPointerUp={handleMapPointerUp}
              onPointerCancel={handleMapPointerCancel}
              className={`relative h-80 w-full overflow-hidden rounded-xl border border-gray-300 bg-[#e5e3df] shadow-inner touch-none ${
                draggingMap ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              {mapTiles.map((tile) => (
                <img
                  key={tile.key}
                  src={tile.url}
                  alt=""
                  draggable={false}
                  className="absolute h-64 w-64 select-none saturate-[0.95] contrast-[0.98]"
                  style={{
                    left: tile.left,
                    top: tile.top,
                  }}
                />
              ))}

              <div className="absolute left-3 top-3 z-10 overflow-hidden rounded-lg bg-white shadow-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  disabled={mapZoom >= MAX_MAP_ZOOM}
                  className="flex h-10 w-10 items-center justify-center border-b text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Zoom in"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  disabled={mapZoom <= MIN_MAP_ZOOM}
                  className="flex h-10 w-10 items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Zoom out"
                >
                  <Minus className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                onPointerDown={handlePinPointerDown}
                onPointerMove={handlePinPointerMove}
                onPointerUp={handlePinPointerUp}
                onPointerCancel={handlePinPointerUp}
                onClick={(e) => e.stopPropagation()}
                className={`absolute z-20 -translate-x-1/2 -translate-y-full cursor-grab touch-none rounded-full focus:outline-none focus:ring-4 focus:ring-red-200 ${
                  draggingPin ? "cursor-grabbing scale-110" : ""
                }`}
                style={{
                  left: pinPosition.left,
                  top: pinPosition.top,
                }}
                aria-label="Drag location pin"
              >
                <MapPin className="h-12 w-12 fill-red-600 text-white drop-shadow-xl" />
              </button>

              <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-gray-600 shadow">
                Drag the map to pan. Drag the red pin to set the exact spot.
              </div>

              <div className="absolute right-3 top-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-gray-600 shadow">
                Zoom {mapZoom}
              </div>
            </div>

            <div>
              <label
                htmlFor="picked_location_label"
                className="mb-2 block text-sm font-medium"
              >
                Location Label
              </label>
              <input
                id="picked_location_label"
                type="text"
                value={locationDraftLabel}
                onChange={(e) => setLocationDraftLabel(e.target.value)}
                placeholder="Main office, shop, home office, or full address"
                className="w-full rounded-lg border px-3 py-3"
              />
              <p className="mt-2 text-xs text-gray-500">
                Pin: {locationDraftCoords.lat.toFixed(6)},{" "}
                {locationDraftCoords.lng.toFixed(6)}
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setLocationPickerOpen(false)}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPinnedLocation}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                <MapPin className="h-4 w-4" />
                Use This Pin
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
