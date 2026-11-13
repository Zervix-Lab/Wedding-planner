// The built-in vendor categories (slug + both languages). Admins can add more in the UI.
import type { Bi } from "./types";

export const DEFAULT_CATEGORIES: { slug: string; name: Bi }[] = [
  { slug: "hotel", name: { en: "Hotels", si: "හෝටල්" } },
  { slug: "photography", name: { en: "Photography", si: "ඡායාරූපකරණය" } },
  { slug: "dancing", name: { en: "Dancing", si: "නැටුම්" } },
  { slug: "decoration", name: { en: "Decoration", si: "සැරසිලි" } },
  { slug: "cake", name: { en: "Cake", si: "කේක්" } },
  { slug: "car", name: { en: "Wedding car", si: "මංගල රථ" } },
  { slug: "makeup", name: { en: "Makeup", si: "රූපලාවණ්‍ය" } },
  { slug: "other", name: { en: "Other", si: "වෙනත්" } },
];
