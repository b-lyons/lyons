import { Info, Martini, Mountain, Ship, Umbrella, UtensilsCrossed } from "lucide-react";
import type { CategoryId } from "./types";

export type Category = {
  id: CategoryId;
  label: string;
  short: string;
  color: string;
  icon: typeof Info;
  /** Inner glyph for the Leaflet div-icon pins, drawn on a 24x24 viewBox. */
  glyph: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "food",
    label: "Food",
    short: "Eat",
    color: "#D9463A",
    icon: UtensilsCrossed,
    glyph: '<path d="M4 12h16a8 8 0 0 1-16 0Z"/><path d="M3 20h18"/>',
  },
  {
    id: "drink",
    label: "Drink",
    short: "Drink",
    color: "#DE8C1F",
    icon: Martini,
    glyph: '<path d="M4 5h16l-8 8Z"/><path d="M12 13v6"/><path d="M8 19h8"/>',
  },
  {
    id: "beach",
    label: "Beaches",
    short: "Beach",
    color: "#12A3BC",
    icon: Umbrella,
    glyph: '<path d="M12 12v9"/><path d="M3 12a9 9 0 0 1 18 0Z"/>',
  },
  {
    id: "daytrip",
    label: "Day trips",
    short: "Trips",
    color: "#2A5FA8",
    icon: Ship,
    glyph: '<path d="M3.5 17h17l-2.5 4H6Z"/><path d="M12 2.5v14"/><path d="M12 4.5l6 8.5h-6"/>',
  },
  {
    id: "sights",
    label: "Sights & nature",
    short: "See",
    color: "#3B8F58",
    icon: Mountain,
    glyph: '<path d="M3 20 10 7l4 7 2-3 5 9Z"/>',
  },
  {
    id: "practical",
    label: "Practical",
    short: "Info",
    color: "#7B6E93",
    icon: Info,
    glyph: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5h.01"/>',
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

export const ALL_CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/**
 * Stand-in for a category the app does not recognise — a value typed straight
 * into the database, or one this version renamed. The data is the source of
 * truth and the app is often the older half, so render it plainly rather than
 * crashing or, worse, quietly dropping the row.
 */
const UNKNOWN_CATEGORY: Category = {
  id: "practical",
  label: "Other",
  short: "Other",
  color: "#7B6E93",
  icon: Info,
  glyph: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5h.01"/>',
};

export function categoryFor(id: string): Category {
  return CATEGORY_BY_ID[id as CategoryId] ?? UNKNOWN_CATEGORY;
}

export function isKnownCategory(id: string): boolean {
  return id in CATEGORY_BY_ID;
}
