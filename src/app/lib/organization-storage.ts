import { supabase } from "./supabase";

export async function uploadOrganizationLogo(file: File, organizationId: string) {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = fileExt === "jpeg" ? "jpg" : fileExt;
  const fileName = `${organizationId}/${Date.now()}-logo.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("organization-logos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("organization-logos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}