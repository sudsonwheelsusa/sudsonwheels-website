export const CONTACT_EMAIL = "contact@sudsonwheelsusa.com";
export const CONTACT_PHONE = "+13309270080";
export const BASE_CITY = "Ashland, OH";
export const MAP_DEFAULT_CENTER = {
  lat: 40.8687,
  lng: -82.3182,
};

export const SOCIAL_LINKS = [
  {
    label: "X.com",
    href: "https://x.com/sudsonwheelsusa",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/suds_on_wheels/",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@suds_on_wheels",
  },
] as const;

export const DEFAULT_SERVICE_SEED = [
  {
    name: "House & Siding",
    description:
      "Remove dirt, mold, and mildew from your home's exterior. Safe for vinyl, wood, and brick.",
    icon: "House",
    sort_order: 1,
  },
  {
    name: "Driveways & Concrete",
    description:
      "Strip stains, oil, and grime from concrete and paver surfaces. Looks like new.",
    icon: "Droplets",
    sort_order: 2,
  },
  {
    name: "Decks & Fences",
    description:
      "Prep your deck or fence for staining, or just restore it to its natural color.",
    icon: "Trees",
    sort_order: 3,
  },
  {
    name: "Gutters",
    description:
      "Flush debris and built-up grime from your gutters and downspouts.",
    icon: "ArrowDownToLine",
    sort_order: 4,
  },
  {
    name: "Fleet Washing",
    description:
      "Keep your commercial vehicles looking sharp. We come to your lot on a schedule.",
    icon: "Truck",
    sort_order: 5,
  },
  {
    name: "Roof Soft Wash",
    description:
      "Low-pressure treatment to safely remove algae and staining from shingles.",
    icon: "Home",
    sort_order: 6,
  },
] as const;

export const DEFAULT_GALLERY_SEED = [
  {
    title: "House Wash - Ashland, OH",
    location: "Ashland, OH",
    detail: "Vinyl siding - Full exterior",
    before_label: "Before wash",
    after_label: "After wash",
    sort_order: 1,
  },
  {
    title: "Driveway - Mansfield, OH",
    location: "Mansfield, OH",
    detail: "Concrete - Oil stain removal",
    before_label: "Before wash",
    after_label: "After wash",
    sort_order: 2,
  },
  {
    title: "Deck Wash - Wooster, OH",
    location: "Wooster, OH",
    detail: "Cedar deck - Pre-stain prep",
    before_label: "Before wash",
    after_label: "After wash",
    sort_order: 3,
  },
  {
    title: "Fleet Wash - Ontario, OH",
    location: "Ontario, OH",
    detail: "4 vehicles - Monthly contract",
    before_label: "Before wash",
    after_label: "After wash",
    sort_order: 4,
  },
] as const;

export const DEFAULT_SERVICE_AREA = [
  "Ashland",
  "Mansfield",
  "Wooster",
  "Loudonville",
  "Medina",
  "Ontario",
] as const;
