/** "10:45 AM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Today", "Yesterday", or "24 Aug" (adds the year for other years). */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86_400_000,
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

/** "Today, 10:45 AM", "Yesterday, 4:20 PM", "24 Aug, 3:42 PM" */
export function formatDateTime(iso: string): string {
  return `${formatDay(iso)}, ${formatTime(iso)}`;
}

/** "just now", "12 min ago", "3 hours ago", else a date. */
export function formatAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  return formatDateTime(iso);
}

/** "PROMPT_INJECTION" -> "Prompt Injection" */
export function humanizeType(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
