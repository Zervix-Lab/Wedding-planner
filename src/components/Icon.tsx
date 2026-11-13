// Tiny inline SVG icon set (no icon library). Icons are decorative: every button also has a text label.
const PATHS = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  check: "M5 12l5 5L20 7",
  x: "M6 6l12 12M18 6L6 18",
  logout: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9",
  login: "M15 4h4v16h-4M8 8l-4 4 4 4M4 12h11",
  users: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M17 6a3 3 0 010 5M21 20c0-2.5-1.5-4-4-4.6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
  store: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3M10 20v-5h4v5",
  wallet: "M3 7h16a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 7V6a2 2 0 012-2h12M17 14h2",
  menu: "M4 6h16M4 12h16M4 18h16",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  down: "M5 9l7 7 7-7",
  up: "M5 15l7-7 7 7",
  back: "M19 12H5M11 6l-6 6 6 6",
  heart: "M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  columns: "M4 5h6v14H4zM14 5h6v14h-6z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 018 0v3",
  mail: "M3 6h18v12H3zM3 7l9 7 9-7",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  open: "M5 12h14M13 6l6 6-6 6",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  tag: "M3 12V4h8l10 10-8 8zM7.5 8h.01",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  pin: "M12 21s-6-5.5-6-11a6 6 0 1112 0c0 5.5-6 11-6 11zM12 12a2 2 0 100-4 2 2 0 000 4z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
