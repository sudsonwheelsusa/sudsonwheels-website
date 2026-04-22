import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_GALLERY_SEED,
  DEFAULT_SERVICE_SEED,
} from "@/lib/constants/site";
import type { GalleryRecord, GalleryVideoRecord, ServiceRecord } from "@/lib/types";

export async function getPublicServices() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, icon, image_path, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return DEFAULT_SERVICE_SEED.map((service, index) => ({
        id: `fallback-service-${index + 1}`,
        ...service,
        image_path: null,
        image_url: null,
        is_active: true,
      })) satisfies ServiceRecord[];
    }

    return data.map((s) => ({
      ...s,
      image_url: s.image_path
        ? supabase.storage.from("gallery").getPublicUrl(s.image_path).data.publicUrl
        : null,
    })) satisfies ServiceRecord[];
  } catch {
    return DEFAULT_SERVICE_SEED.map((service, index) => ({
      id: `fallback-service-${index + 1}`,
      ...service,
      image_path: null,
      image_url: null,
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
        "id, title, location, detail, before_image_path, after_image_path, before_image_paths, after_image_paths, before_label, after_label, sort_order, is_active"
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
        before_image_paths: [],
        after_image_paths: [],
        before_image_urls: [],
        after_image_urls: [],
        is_active: true,
      })) satisfies GalleryRecord[];
    }

    return data.map((item) => {
      const beforePaths: string[] = item.before_image_paths?.length
        ? item.before_image_paths
        : item.before_image_path
          ? [item.before_image_path]
          : [];
      const afterPaths: string[] = item.after_image_paths?.length
        ? item.after_image_paths
        : item.after_image_path
          ? [item.after_image_path]
          : [];

      return {
        ...item,
        before_image_paths: beforePaths,
        after_image_paths: afterPaths,
        before_image_url: beforePaths[0]
          ? supabase.storage.from("gallery").getPublicUrl(beforePaths[0]).data.publicUrl
          : null,
        after_image_url: afterPaths[0]
          ? supabase.storage.from("gallery").getPublicUrl(afterPaths[0]).data.publicUrl
          : null,
        before_image_urls: beforePaths.map(
          (p) => supabase.storage.from("gallery").getPublicUrl(p).data.publicUrl
        ),
        after_image_urls: afterPaths.map(
          (p) => supabase.storage.from("gallery").getPublicUrl(p).data.publicUrl
        ),
      };
    }) satisfies GalleryRecord[];
  } catch {
    return DEFAULT_GALLERY_SEED.map((item, index) => ({
      id: `fallback-gallery-${index + 1}`,
      ...item,
      before_image_path: null,
      after_image_path: null,
      before_image_url: null,
      after_image_url: null,
      before_image_paths: [],
      after_image_paths: [],
      before_image_urls: [],
      after_image_urls: [],
      is_active: true,
    })) satisfies GalleryRecord[];
  }
}

export async function getPublicGalleryVideos() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gallery_videos")
      .select("id, title, description, video_path, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) return [] satisfies GalleryVideoRecord[];

    return data.map((v) => ({
      ...v,
      video_url: supabase.storage.from("gallery").getPublicUrl(v.video_path).data.publicUrl,
    })) satisfies GalleryVideoRecord[];
  } catch {
    return [] satisfies GalleryVideoRecord[];
  }
}
