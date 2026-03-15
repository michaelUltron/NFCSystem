import { supabase } from "./supabase";

const PROFILE_BUCKET = "profile-images";

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "jpg" : "jpg";
}

function generateFileId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function uploadProfileImage(file: File) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  const ext = getFileExtension(file.name);
  const safeExt = ext === "jpeg" ? "jpg" : ext;
  const filePath = `${user.id}/${generateFileId()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: data.publicUrl,
  };
}