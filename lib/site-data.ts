import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_GALLERY_SEED,
  DEFAULT_SERVICE_SEED,
} from "@/lib/constants/site";
import type { GalleryRecord, ServiceRecord } from "@/lib/types";

export async function getPublicServices() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, icon, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return DEFAULT_SERVICE_SEED.map((service, index) => ({
        id: `fallback-service-${index + 1}`,
        ...service,
        is_active: true,
      })) satisfies ServiceRecord[];
    }

    return data satisfies ServiceRecord[];
  } catch {
    return DEFAULT_SERVICE_SEED.map((service, index) => ({
      id: `fallback-service-${index + 1}`,
      ...service,
      is_active: true,
    })) satisfies ServiceRecord[];
  }
}

export async function getPublicGallery() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gallery_items")
      .select(
        "id, title, location, detail, before_image_path, after_image_path, before_label, after_label, sort_order, is_active"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return DEFAULT_GALLERY_SEED.map((item, index) => ({
        id: `fallback-gallery-${index + 1}`,
        ...item,
        before_image_path: null,
        after_image_path: null,
        before_image_url: null,
        after_image_url: null,
        is_active: true,
      })) satisfies GalleryRecord[];
    }

    return data.map((item) => ({
      ...item,
      before_image_url: item.before_image_path
        ? supabase.storage.from("gallery").getPublicUrl(item.before_image_path)
            .data.publicUrl
        : null,
      after_image_url: item.after_image_path
        ? supabase.storage.from("gallery").getPublicUrl(item.after_image_path)
            .data.publicUrl
        : null,
    })) satisfies GalleryRecord[];
  } catch {
    return DEFAULT_GALLERY_SEED.map((item, index) => ({
      id: `fallback-gallery-${index + 1}`,
      ...item,
      before_image_path: null,
      after_image_path: null,
      before_image_url: null,
      after_image_url: null,
      is_active: true,
    })) satisfies GalleryRecord[];
  }
}
