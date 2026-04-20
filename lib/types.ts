export interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface GalleryRecord {
  id: string;
  title: string;
  location: string;
  detail: string;
  before_image_path: string | null;
  after_image_path: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
  before_label: string | null;
  after_label: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface LeadRecord {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  service_id: string | null;
  service_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  message: string | null;
  status: "new" | "approved" | "rejected" | "quoted" | "scheduled";
  internal_notes: string | null;
  quoted_amount: number | null;
  estimate_sent_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  scheduled_job_id: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface EstimateRecord {
  id: string;
  lead_id: string;
  amount: number;
  notes: string | null;
  status: "draft" | "sent" | "accepted" | "rejected";
  created_by: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface JobRecord {
  id: string;
  lead_id: string;
  estimate_id: string | null;
  title: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  scheduled_start: string;
  scheduled_end: string | null;
  service_name: string;
  customer_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
